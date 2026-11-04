import re
import time
from typing import Any, ClassVar

import requests
from bs4 import BeautifulSoup, Tag

from scrapers.base_scraper import BaseCourseScraper, RawCourse

# A course code such as "COL106", "COL 106", "ELL201", "MTL 732"
_CODE = r"[A-Za-z]{2,4}\s?\d{3}[A-Za-z]?"

# Tokens that may appear in a "Pre-requisites:" / "Overlaps with:" value
_LIST_TOKEN = (
    rf"(?:{_CODE}|\bEC\s?\d+\b|\b\d+\b|\bor\b|\band\b|\bequivalent\b|[,/&;()])"
)
_LIST_VALUE = rf"(?P<v>(?:\s*{_LIST_TOKEN})+)"

PREREQ_RE = re.compile(rf"Pre-?\s?requisites?\s*:?\s*{_LIST_VALUE}", re.IGNORECASE)
PERMISSION_RE = re.compile(
    r"Pre-?\s?requisites?\s*:?\s*(?P<v>Permission of (?:the )?Instructor)",
    re.IGNORECASE,
)
OVERLAP_RE = re.compile(rf"Overlaps?\s+with\s*:?\s*{_LIST_VALUE}", re.IGNORECASE)

CREDITS_RE = re.compile(
    r"(?P<credits>\d+(?:\.\d+)?)\s*credits?"
    r"(?:\s*\((?P<ltp>\d+(?:\.\d+)?-\d+(?:\.\d+)?-\d+(?:\.\d+)?)\))?",
    re.IGNORECASE,
)

# "COL100 Introdution to ...", "COL632: Introduction ...", "COL 671: Principles ...:"
TITLE_RE = re.compile(
    r"^\s*(?P<dept>[A-Za-z]{2,4})\s*(?P<num>\d{3}[A-Za-z]?)\s*[:\-–]?\s*(?P<name>.+?)\s*[:\-–]?\s*$"
)

CODE_FINDER_RE = re.compile(_CODE)


class IITDCSEScraper(BaseCourseScraper):
    college_id = "iitd"
    college_name = "IIT Delhi"

    department_id = "cse"
    department_name = "Computer Science and Engineering"

    base_url = "https://homecse.iitd.ac.in/all-courses/"
    request_headers: ClassVar[dict[str, str]] = {
        "Accept": "text/html,application/xhtml+xml",
        "Referer": "https://homecse.iitd.ac.in/",
    }

    # Seconds to wait between detail-page requests (be polite to the server).
    detail_delay: float = 0.3

    # ------------------------------------------------------------------ #
    # Listing page
    # ------------------------------------------------------------------ #
    def parse_courses(self, soup: BeautifulSoup) -> list[RawCourse]:
        items = soup.select("li.wp-block-post")

        if not items:
            raise RuntimeError(
                "No course entries (li.wp-block-post) found on the IIT Delhi page. "
                "The page structure may have changed."
            )

        courses: list[RawCourse] = []
        seen: set[str] = set()

        for item in items:
            link = item.select_one(".wp-block-post-title a[href]")
            if not link:
                continue

            raw_title = link.get_text(" ", strip=True)
            match = TITLE_RE.match(raw_title)
            if not match:
                continue

            course_code = f"{match['dept'].upper()}{match['num'].upper()}"
            title = match["name"].strip(" :-–")

            key = course_code.lower()
            if key in seen or not title:
                continue
            seen.add(key)

            excerpt_tag = item.select_one(".wp-block-post-excerpt__excerpt")
            excerpt = excerpt_tag.get_text(" ", strip=True) if excerpt_tag else ""

            number = match["num"]
            course: RawCourse = {
                "course_code": course_code,
                "title": title,
                "level": self._level_from_number(number),
                "category": None,
                "source_url": link["href"],
                "current_offering": "category-current-offering"
                in (item.get("class") or []),
            }
            # Excerpt is truncated, but good enough as a fallback
            course.update(self._parse_body_text(excerpt, truncated=True))
            courses.append(course)

        if not courses:
            raise RuntimeError(
                f"Found {len(items)} entries, but extracted no courses. "
                "Inspect the listing HTML and title format."
            )

        return courses

    # ------------------------------------------------------------------ #
    # Detail page
    # ------------------------------------------------------------------ #
    def parse_detail(self, soup: BeautifulSoup) -> dict[str, Any]:
        content = soup.select_one("div.entry-content") or soup.select_one(
            "div.nv-content-wrap"
        )
        if not isinstance(content, Tag):
            return {}

        text = content.get_text(" ", strip=True)
        return self._parse_body_text(text, truncated=False)

    def _parse_body_text(self, text: str, truncated: bool) -> dict[str, Any]:
        """Extract credits, L-T-P, prerequisites, overlaps and description."""
        text = re.sub(r"\s+", " ", text).strip()
        result: dict[str, Any] = {}

        # Credits + (L-T-P)
        credits_match = CREDITS_RE.search(text)
        if credits_match:
            result["credits"] = float(credits_match["credits"])
            if credits_match["ltp"]:
                result["ltp"] = credits_match["ltp"]
            text = (text[: credits_match.start()] + " " + text[credits_match.end() :]).strip()

        # Prerequisites
        prereqs: list[str] = []
        prereq_match = PREREQ_RE.search(text) or PERMISSION_RE.search(text)
        if prereq_match:
            value = prereq_match["v"].strip()
            prereqs = [c.replace(" ", "").upper() for c in CODE_FINDER_RE.findall(value)]
            if not prereqs:
                prereqs = [value]
            result["prerequisites"] = prereqs
            result["prerequisites_text"] = value
            text = (text[: prereq_match.start()] + " " + text[prereq_match.end() :]).strip()

        # Overlaps (kept in raw_extra)
        overlap_match = OVERLAP_RE.search(text)
        if overlap_match:
            result["overlaps"] = [
                c.replace(" ", "").upper()
                for c in CODE_FINDER_RE.findall(overlap_match["v"])
            ]
            text = (
                text[: overlap_match.start()] + " " + text[overlap_match.end() :]
            ).strip()

        # Whatever is left is the description (skip truncated excerpt text)
        description = re.sub(r"\s+", " ", text).strip()
        if truncated:
            description = ""
        if description:
            result["description"] = description

        return result

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def _level_from_number(number: str) -> str | None:
        """IITD numbering: 1xx-4xx are UG, 6xx-8xx are PG, 5xx is ambiguous."""
        digit = number[:1]
        if digit in "1234":
            return "UG"
        if digit in "6789":
            return "PG"
        return None

    # ------------------------------------------------------------------ #
    # Orchestration: listing page -> one request per course detail page
    # ------------------------------------------------------------------ #
    def scrape(self):
        soup = self.fetch_page()
        raw_courses = self.parse_courses(soup)

        records = []

        for raw in raw_courses:
            try:
                detail_soup = self.fetch_page(raw["source_url"])
                detail = self.parse_detail(detail_soup)
                # Detail data wins over the truncated listing excerpt
                raw.update({k: v for k, v in detail.items() if v})
            except (requests.RequestException, RuntimeError) as exc:
                print(
                    f"[iitd/cse] could not fetch details for "
                    f"{raw['course_code']}: {exc}"
                )

            if raw.get("title"):
                records.append(self.to_common_schema(raw))

            time.sleep(self.detail_delay)

        return records