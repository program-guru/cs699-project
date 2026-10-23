from typing import Any, ClassVar

from bs4 import BeautifulSoup

from scrapers.base_scraper import BaseCourseScraper


class IITBCSEScraper(BaseCourseScraper):
    college_id = "iitb"
    college_name = "IIT Bombay"
    department_id = "cse"
    department_name = "Computer Science and Engineering"

    base_url = "https://www.cse.iitb.ac.in/~internal-live/api/courses/all_courses/"
    request_headers: ClassVar[dict[str, str]] = {"Accept": "application/json"}

    def parse_courses(self, soup: BeautifulSoup) -> list[dict[str, Any]]:
        # This API returns JSON, so we do not parse HTML cards.
        raise NotImplementedError("Use scrape() to process the JSON API response.")

    def scrape(self) -> list[dict[str, Any]]:
        response = self.session.get(
            self.base_url,
            timeout=self.timeout,
        )
        response.raise_for_status()

        data = response.json()

        if not isinstance(data, list):
            raise TypeError("Expected a JSON list from the IIT Bombay courses API.")

        records = []

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
                "semester_offered": ", ".join(
                    semester
                    for semester, offered in [
                        ("Spring", item.get("springcourse")),
                        ("Autumn", item.get("autumncourse")),
                    ]
                    if offered
                )
                or None,
                "source_url": self.base_url,
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
