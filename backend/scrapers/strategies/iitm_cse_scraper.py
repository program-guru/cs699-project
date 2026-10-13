
import re
from typing import Any

from bs4 import BeautifulSoup

from base_scrapper import BaseCourseScraper


class IITMCSEScraper(BaseCourseScraper):
    college_id = "iitm"
    college_name = "IIT Madras"

    department_id = "cse"
    department_name = "Computer Science and Engineering"

    base_url = "https://www.cse.iitm.ac.in/courses.php"

    COURSE_CODE_RE = re.compile(
        r"Course\s*No\s*:\s*([A-Za-z0-9_-]+)",
        re.IGNORECASE,
    )

    def parse_courses(
        self, soup: BeautifulSoup
    ) -> list[dict[str, Any]]:

        cards = soup.select("div.card")

        if not cards:
            raise RuntimeError(
                "No course cards found on the IIT Madras page. "
                "The page structure may have changed."
            )

        courses: list[dict[str, Any]] = []
        seen: set[tuple[str, str]] = set()

        for card in cards:
            heading = card.find(
                ["h2", "h3", "h4", "h5", "h6"]
            )

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
                span.get_text(" ", strip=True).lower()
                for span in card.find_all("span")
            }

            level = (
                "UG" if "ug" in labels
                else "PG" if "pg" in labels
                else None
            )

            category = (
                "Core" if "core" in labels
                else "Elective" if "elective" in labels
                else None
            )

            key = (course_code, title)

            if key in seen:
                continue

            seen.add(key)

            courses.append({
                "course_code": course_code,
                "title": title,
                "level": level,
                "category": category,
                "source_url": self.base_url,
            })

        if not courses:
            raise RuntimeError(
                f"Found {len(cards)} cards, but extracted no courses. "
                "Inspect the card HTML and course-code format."
            )

        return courses
