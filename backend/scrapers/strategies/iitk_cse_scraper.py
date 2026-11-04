import re
import time
from typing import Any, ClassVar
from urllib.parse import quote, urljoin

import requests
from bs4 import BeautifulSoup, Tag

from scrapers.base_scraper import BaseCourseScraper, RawCourse

CODE_RE = re.compile(r"[A-Za-z]{2,4}\s?\d{3}[A-Za-z]?")
CREDITS_RE = re.compile(
    r"Credits?\s*:?\s*(?P<nums>\d+(?:\s*-\s*\d+){2,5})", re.IGNORECASE
)
PREREQ_INLINE_RE = re.compile(
    r"pre-?\s?req(?:uisite)?s?\s*(?:\(s\))?\s*[:\-–]", re.IGNORECASE
)
PREREQ_LABEL_ONLY_RE = re.compile(
    r"^\s*pre-?\s?req(?:uisite)?s?\s*(?:\(s\))?\s*$", re.IGNORECASE
)
PREREQ_HEADING_RE = re.compile(
    r"^\s*pre-?\s?req(?:uisite)?s?\s*(?:\(s\))?\s*[:\-–]?\s*(?P<v>.*)$", re.IGNORECASE
)
BOOKS_HEADING_RE = re.compile(
    r"\b(books?|references?|text\s?books?|reading)\b", re.IGNORECASE
)
EMPTY_VALUES = {"", "none", "nil", "na", "n/a", "-", "no"}


def _clean(text: str) -> str:
    text = text.replace("\xa0", " ")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


class IITKCSEScraper(BaseCourseScraper):
    college_id = "iitk"
    college_name = "IIT Kanpur"

    department_id = "cse"
    department_name = "Computer Science and Engineering"

    base_url = "https://www.cse.iitk.ac.in/pages/Courses.html"
    request_headers: ClassVar[dict[str, str]] = {
        "Accept": "text/html,application/xhtml+xml",
        "Referer": "https://www.cse.iitk.ac.in/",
    }

    # Seconds between detail-page requests
    detail_delay: float = 0.3

    # ------------------------------------------------------------------ #
    # Listing page
    # ------------------------------------------------------------------ #
    def parse_courses(self, soup: BeautifulSoup) -> list[RawCourse]:
        rows = soup.select("table.table tbody tr") or soup.select("table tr")

        if not rows:
            raise RuntimeError(
                "No table rows found on the IIT Kanpur courses page. "
                "The page structure may have changed."
            )

        courses: list[RawCourse] = []
        seen: set[tuple[str, str]] = set()

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 3:
                continue  # header row or malformed row

            code = _clean(cells[1].get_text(" ", strip=True))
            name_link = cells[2].find(
                "a"
            )  # first link = course page, 2nd = "[Details]" PDF
            title = _clean(
                name_link.get_text(" ", strip=True)
                if name_link
                else cells[2].get_text(" ", strip=True)
            )

            if not code or not title:
                continue

            key = (code.lower(), title.lower())
            if key in seen:
                continue
            seen.add(key)

            href = (name_link or cells[1].find("a") or {}).get("href")
            course: RawCourse = {
                "course_code": code,
                "title": title,
                "level": self._level_from_code(code),
                "category": None,
                "source_url": self._build_url(href) if href else self.base_url,
            }

            # Optional extra PDF with course details, e.g. CS630
            for link in cells[2].find_all("a")[1:]:
                link_href = link.get("href")
                if link_href and link_href.lower().endswith(".pdf"):
                    course["syllabus_url"] = self._build_url(link_href)
                    break

            courses.append(course)

        if not courses:
            raise RuntimeError(
                f"Found {len(rows)} table rows, but extracted no courses. "
                "Inspect the table HTML."
            )

        return courses

    # ------------------------------------------------------------------ #
    # Detail page
    # ------------------------------------------------------------------ #
    def parse_detail(self, soup: BeautifulSoup) -> dict[str, Any]:
        container = soup.select_one("div.agileinfo-contact-main-address")
        if not isinstance(container, Tag):
            return {}

        result: dict[str, Any] = {}
        sections: list[tuple[str, list[str]]] = []
        heading = ""
        paragraphs: list[str] = []

        prereq_parts: list[str] = []
        in_prereq_section = False 
        take_next_as_prereq = False  # label alone in an element: value is the next element

        def flush() -> None:
            nonlocal paragraphs
            if paragraphs:
                sections.append((heading, paragraphs))
            paragraphs = []

        for el in container.find_all(["h4", "h5", "h6", "p", "ul", "ol"]):
            if el.find_parent(["p", "ul", "ol"]):
                continue  # avoid reading nested elements twice

            if el.name == "h4":
                continue  # course title

            # ---------- headings ----------
            if el.name in ("h5", "h6"):
                flush()
                in_prereq_section = False
                take_next_as_prereq = False
                heading_text = _clean(el.get_text(" ", strip=True))
                match = PREREQ_HEADING_RE.match(heading_text)
                if match:
                    if match["v"].strip():
                        prereq_parts.append(match["v"].strip())  
                    else:
                        in_prereq_section = True  
                    heading = ""
                else:
                    heading = heading_text.rstrip(":")
                continue

            text = _clean(el.get_text("\n", strip=True))
            if not text:
                continue

            # ---------- content under a Prerequisites heading / label ----------
            if in_prereq_section:
                prereq_parts.append(text.replace("\n", " "))
                continue
            if take_next_as_prereq:
                prereq_parts.append(text.replace("\n", " "))
                take_next_as_prereq = False
                continue

            kept_lines: list[str] = []
            for line in text.split("\n"):
                inline = PREREQ_INLINE_RE.search(line)
                if inline and not prereq_parts:
                    value = line[inline.end():].strip()
                    before = line[: inline.start()].strip()
                    if before:
                        kept_lines.append(before)  # e.g. credits text before the label
                    if value:
                        prereq_parts.append(value)
                    else:
                        take_next_as_prereq = True
                elif PREREQ_LABEL_ONLY_RE.match(line) and not prereq_parts:
                    take_next_as_prereq = True
                else:
                    kept_lines.append(line)
            text = "\n".join(kept_lines).strip()
            if not text:
                continue

            # ---------- Credits line ----------
            credits_match = CREDITS_RE.search(text)
            if credits_match and not heading and "credits" not in result:
                nums = [float(n) for n in re.findall(r"\d+", credits_match["nums"])]
                result["credits"] = nums[-1]
                if len(nums) >= 3:
                    result["ltp"] = "-".join(str(int(n)) for n in nums[:3])
                result["credits_text"] = text
                continue

            paragraphs.append(text)

        flush()

        description_parts: list[str] = []
        books: list[str] = []

        for sec_heading, sec_paragraphs in sections:
            body = "\n".join(sec_paragraphs)
            if sec_heading and BOOKS_HEADING_RE.search(sec_heading):
                books.append(body)
            elif sec_heading:
                description_parts.append(f"{sec_heading}: {body}")
            else:
                description_parts.append(body)

        if description_parts:
            result["description"] = "\n".join(description_parts)
        if books:
            result["textbooks"] = "\n".join(books)

        prereq_text = " ".join(prereq_parts).strip()
        if prereq_text:
            result["prerequisites"] = self._parse_prerequisites(prereq_text)
            result["prerequisites_text"] = prereq_text

        return result

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def _parse_prerequisites(text: str) -> list[str]:
        text = text.strip()
        if text.lower().strip(" .") in EMPTY_VALUES:
            return []
        codes = [c.replace(" ", "").upper() for c in CODE_RE.findall(text)]
        return codes or [text]

    @staticmethod
    def _level_from_code(code: str) -> str | None:
        """IITK numbering: 1xx-4xx UG, 6xx-8xx PG (5xx ambiguous)."""
        match = re.search(r"(\d)\d{2}", code)
        if not match:
            return None
        digit = match.group(1)
        if digit in "1234":
            return "UG"
        if digit in "6789":
            return "PG"
        return None

    def _build_url(self, href: str) -> str:
        """Join with the base URL and percent-encode spaces etc.
        (some pages are named like 'CS330 (L).html' or 'CS395 / 496.html')."""
        absolute = urljoin(self.base_url, href.strip())
        return quote(absolute, safe=":/%()?=&#")

    # ------------------------------------------------------------------ #
    # Orchestration: listing -> one request per distinct detail page
    # ------------------------------------------------------------------ #
    def scrape(self):
        soup = self.fetch_page()
        raw_courses = self.parse_courses(soup)

        detail_cache: dict[str, dict[str, Any]] = {}
        records = []

        for raw in raw_courses:
            url = raw["source_url"]

            if url != self.base_url:
                if url not in detail_cache:
                    try:
                        detail_cache[url] = self.parse_detail(self.fetch_page(url))
                    except (requests.RequestException, RuntimeError) as exc:
                        print(
                            f"[iitk/cse] could not fetch {raw['course_code']} ({url}): {exc}"
                        )
                        detail_cache[url] = {}
                    time.sleep(self.detail_delay)

                raw.update(
                    {k: v for k, v in detail_cache[url].items() if v not in (None, "")}
                )

            if raw.get("title"):
                records.append(self.to_common_schema(raw))

        return records
