import re
import time
from typing import ClassVar

import requests
from bs4 import BeautifulSoup

from scrapers.base_scraper import BaseCourseScraper, RawCourse


def is_list_word(word: str) -> bool:
    """True for words that can appear in 'COL106, COL216 OR Equivalent'."""
    word = word.strip(",;/&()").lower()
    return (
        word in ("", "or", "and", "equivalent")
        or word.isdigit()  # e.g. "60" in "Pre-requisites: 60"
        or re.fullmatch(r"[a-z]{2,4}\d{2,3}[a-z]?", word) is not None  # e.g. "col106"
    )


def take_list(label: str, text: str):
    """Find `label` in text and grab the list of course codes written right after it.
    Returns (the_list_as_text, text_with_label_and_list_removed).
    If the label is not found, returns (None, text)."""
    match = re.search(label + r"\s*:?", text, re.IGNORECASE)
    if not match:
        return None, text

    words = text[match.end():].split()
    count = 0
    while count < len(words) and is_list_word(words[count]):
        count += 1

    value = " ".join(words[:count])
    rest = text[: match.start()] + " " + " ".join(words[count:])
    return value, rest


def parse_text(text: str) -> dict:
    """Pull credits, prerequisites and overlaps out of course text.
    Whatever is left over becomes the description."""
    text = " ".join(text.split())
    text = re.sub(r"\b([A-Z]{2,4}) (\d{3})\b", r"\1\2", text)  # "COL 106" -> "COL106"
    result = {}

    # Credits, e.g. "4 credits (3-0-2)"
    match = re.search(r"(\d+\.?\d*)\s*credits?(?:\s*\(([\d-]+)\))?", text, re.IGNORECASE)
    if match:
        result["credits"] = float(match.group(1))
        if match.group(2):
            result["ltp"] = match.group(2)
        text = text[: match.start()] + " " + text[match.end():]

    # Prerequisites and overlaps
    prereq, text = take_list(r"pre-?requisites?", text)
    if prereq:
        result["prerequisites"] = re.findall(r"[A-Z]{2,4}\d{3}", prereq.upper()) or [prereq]
        result["prerequisites_text"] = prereq

    overlap, text = take_list(r"overlaps?\s+with", text)
    if overlap:
        result["overlaps"] = re.findall(r"[A-Z]{2,4}\d{3}", overlap.upper())

    description = " ".join(text.split())
    if description:
        result["description"] = description

    return result


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

    def parse_courses(self, soup: BeautifulSoup) -> list[RawCourse]:
        """Read the listing page: one entry per course."""
        items = soup.select("li.wp-block-post")
        if not items:
            raise RuntimeError("No courses found on the IIT Delhi page. Structure may have changed.")

        courses = []
        seen = set()

        for item in items:
            link = item.select_one(".wp-block-post-title a")
            if not link:
                continue

            # Titles look like "COL100 Intro...", "COL632: Intro...", "COL 671: Principles...:"
            match = re.match(r"([A-Za-z]{3})\s*(\d{3})[\s:]*(.*)", link.get_text(" ", strip=True))
            if not match:
                continue

            letters, number, title = match.groups()
            code = letters.upper() + number
            if code in seen:
                continue
            seen.add(code)

            course = {
                "course_code": code,
                "title": title.strip(" :"),
                "level": "UG" if number[0] in "1234" else "PG" if number[0] in "6789" else None,
                "source_url": link["href"],
                "current_offering": "category-current-offering" in item.get("class", []),
            }

            # The excerpt is cut short, so only use it for credits/prerequisites
            excerpt = item.select_one(".wp-block-post-excerpt__excerpt")
            if excerpt:
                info = parse_text(excerpt.get_text(" ", strip=True))
                info.pop("description", None)
                course.update(info)

            courses.append(course)

        return courses

    def scrape(self):
        listing = self.fetch_page()
        records = []

        for raw in self.parse_courses(listing):
            # Open the course's own page: it has the full text
            try:
                page = self.fetch_page(raw["source_url"])
                content = page.select_one("div.entry-content")
                if content:
                    raw.update(parse_text(content.get_text(" ", strip=True)))
            except (requests.RequestException, RuntimeError) as exc:
                print(f"[iitd/cse] could not fetch {raw['course_code']}: {exc}")

            records.append(self.to_common_schema(raw))
            time.sleep(0.3)  # be polite to the server

        return records