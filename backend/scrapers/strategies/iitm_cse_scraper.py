import re
from typing import ClassVar

from bs4 import BeautifulSoup

from scrapers.base_scraper import BaseCourseScraper, RawCourse


class IITMCSEScraper(BaseCourseScraper):
    college_id = "iitm"
    college_name = "IIT Madras"

    department_id = "cse"
    department_name = "Computer Science and Engineering"

    base_url = "https://www.cse.iitm.ac.in/courses.php"
    request_headers: ClassVar[dict[str, str]] = {
        "Accept": "text/html,application/xhtml+xml",
        "Referer": "https://www.cse.iitm.ac.in/",
    }

    COURSE_CODE_RE = re.compile(
        r"Course\s*No\s*:\s*([A-Za-z0-9_-]+)",
        re.IGNORECASE,
    )

    def parse_courses(self, soup: BeautifulSoup) -> list[RawCourse]:
        cards = soup.select("div.card")

        if not cards:
            raise RuntimeError(
                "No course cards found on the IIT Madras page. "
                "The page structure may have changed."
            )

        courses: list[RawCourse] = []
        seen: set[str] = set()

        for card in cards:
            heading = card.find(["h2", "h3", "h4", "h5", "h6"])

            if not heading:
                continue

            title = heading.get_text(" ", strip=True)

            if not title:
                continue

            card_text = card.get_text(" ", strip=True)
            match = self.COURSE_CODE_RE.search(card_text)

            if not match:
                continue

            course_code = match.group(1).strip()

            labels = {
                span.get_text(" ", strip=True).lower() for span in card.find_all("span")
            }

            level = "UG" if "ug" in labels else "PG" if "pg" in labels else None

            category = (
                "Core"
                if "core" in labels
                else "Elective"
                if "elective" in labels
                else None
            )

            key = course_code.lower()

            if key in seen:
                continue

            seen.add(key)

            courses.append(
                {
                    "course_code": course_code,
                    "title": title,
                    "level": level,
                    "category": category,
                    "source_url": self.base_url,
                }
            )

        if not courses:
            raise RuntimeError(
                f"Found {len(cards)} cards, but extracted no courses. "
                "Inspect the card HTML and course-code format."
            )

        return courses
