from typing import ClassVar

from bs4 import BeautifulSoup

from models.course import Course
from scrapers.base_scraper import BaseCourseScraper, RawCourse


class IITBCSEScraper(BaseCourseScraper):
    college_id = "iitb"
    college_name = "IIT Bombay"
    department_id = "cse"
    department_name = "Computer Science and Engineering"

    base_url = "https://www.cse.iitb.ac.in/~internal-live/api/courses/"
    seasonal_urls: ClassVar[tuple[tuple[str, str], ...]] = (
        ("Autumn", f"{base_url}autumn_courses/"),
        ("Spring", f"{base_url}spring_courses/"),
    )
    request_headers: ClassVar[dict[str, str]] = {"Accept": "application/json"}

    def parse_courses(self, soup: BeautifulSoup) -> list[RawCourse]:
        # This API returns JSON, so we do not parse HTML cards.
        del soup
        raise NotImplementedError("Use scrape() to process the JSON API response.")

    def scrape(self) -> list[Course]:
        records: list[Course] = []

        for semester, url in self.seasonal_urls:
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()

            data = response.json()
            if not isinstance(data, list):
                raise TypeError(
                    f"Expected a JSON list from the IIT Bombay {semester} courses API."
                )

            for item in data:
                if not isinstance(item, dict):
                    continue

                title_value = item.get("crsename")
                title = title_value.strip() if isinstance(title_value, str) else ""
                if not title:
                    continue

                prerequisite = item.get("prereq")
                prerequisite_text = (
                    prerequisite.strip() if isinstance(prerequisite, str) else ""
                )

                raw = {
                    "course_code": (
                        item["crsecode"].strip()
                        if isinstance(item.get("crsecode"), str)
                        else None
                    ),
                    "title": title,
                    "credits": item.get("totcred"),
                    "description": item.get("description") or None,
                    "prerequisites": (
                        [prerequisite_text]
                        if prerequisite_text and prerequisite_text.upper() != "NIL"
                        else []
                    ),
                    "semester_offered": semester,
                    "source_url": url,
                    "category": (item.get("crsetype") or "").strip() or None,
                    "level": None,
                    "lecture": item.get("lecture"),
                    "tutorial": item.get("tutorial"),
                    "practical": item.get("practical"),
                    "selfstudy": item.get("selfstudy"),
                    "duration": item.get("crseduration"),
                    "instructors": item.get("instructors"),
                    "homepage": item.get("homepage"),
                    "textref": item.get("textref"),
                    "api_id": item.get("id"),
                }

                records.append(self.to_common_schema(raw))

        return records
