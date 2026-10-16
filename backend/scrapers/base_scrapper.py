
from abc import ABC, abstractmethod
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


class BaseCourseScraper(ABC):
    college_id: str
    college_name: str
    department_id: str
    department_name: str
    base_url: str

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.session = requests.Session()

        self.session.headers.update({
            "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/130.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        })

    
    def fetch_page(
        self, url: str | None = None
    ) -> BeautifulSoup:
        target = url or self.base_url

        response = self.session.get(
            target,
            timeout=self.timeout,
            allow_redirects=True,
            headers={
                "Accept": (
                    "*/*"
                ),
                "Referer": "https://www.cse.iitm.ac.in/",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36"
            },
        )
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "lxml")
        page_text = soup.get_text(" ", strip=True).lower()

        if (
            "validation request" in page_text
            or "user validation required" in page_text
        ):
            raise RuntimeError(
                f"IIT Madras returned a validation challenge for {target}. "
                f"HTTP status: {response.status_code}. "
                f"Final URL: {response.url}. "
                "Use an authorized data source or a saved HTML snapshot."
            )

        return soup


    @abstractmethod
    def parse_courses(
        self, soup: BeautifulSoup
    ) -> list[dict[str, Any]]:
        """Extract raw course records from the page."""
        raise NotImplementedError

    def to_common_schema(
        self, raw: dict[str, Any]
    ) -> dict[str, Any]:
        """Attach common college and department metadata."""

        source_url = urljoin(
            self.base_url,
            raw.get("source_url") or self.base_url,
        )

        known_fields = {
            "course_code",
            "title",
            "category",
            "level",
            "credits",
            "description",
            "prerequisites",
            "instructor",
            "semester_offered",
            "syllabus_url",
            "source_url",
        }

        return {
            "college_id": self.college_id,
            "college_name": self.college_name,
            "department_id": self.department_id,
            "department_name": self.department_name,
            "course_code": raw.get("course_code"),
            "title": raw["title"],
            "category": raw.get("category"),
            "level": raw.get("level"),
            "credits": raw.get("credits"),
            "description": raw.get("description"),
            "prerequisites": raw.get("prerequisites") or [],
            "instructor": raw.get("instructor"),
            "semester_offered": raw.get("semester_offered"),
            "syllabus_url": (
                urljoin(self.base_url, raw["syllabus_url"])
                if raw.get("syllabus_url")
                else None
            ),
            "source_url": source_url,
            "raw_extra": {
                key: value
                for key, value in raw.items()
                if key not in known_fields
            },
        }

    def scrape(self) -> list[dict[str, Any]]:
        soup = self.fetch_page()
        raw_courses = self.parse_courses(soup)

        records = []

        for raw in raw_courses:
            if not raw.get("title"):
                continue

            records.append(
                self.to_common_schema(raw)
            )

        return records
