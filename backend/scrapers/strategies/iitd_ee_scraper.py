from typing import ClassVar
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from models.course import Course
from models.catalog import College, Department
from scrapers.base_scraper import BaseCourseScraper, RawCourse


class IITDEEScraper(BaseCourseScraper):
    college_name = College.IITD
    department_name = Department.EE

    base_url = "https://ee.iitd.ac.in/courses"
    request_headers: ClassVar[dict[str, str]] = {
        "Accept": "text/html,application/xhtml+xml",
    }

    def parse_courses(self, soup: BeautifulSoup) -> list[RawCourse]:
        """Read one listing page: every table row is one course."""
        courses: list[RawCourse] = []

        for row in soup.select("table.data tbody tr"):
            link = row.select_one('td[data-label="Course"] a')
            if not link:
                continue

            code = row.select_one('td[data-label="Course code"]').get_text(strip=True)
            ltp = row.select_one('td[data-label="L-T-P"]').get_text(strip=True)
            credits = row.select_one('td[data-label="Credits"]').get_text(strip=True)

            courses.append(
                {
                    "course_code": code,
                    "title": link.get_text(strip=True),
                    "credits": int(credits) if credits.isdigit() else None,
                    "source_url": urljoin(self.base_url, link["href"]),
                    "ltp": ltp,  # not in common schema, goes to raw_extra
                }
            )

        return courses

    def scrape(self) -> list[Course]:
        # Step 1: collect courses from every listing page.
        raw_courses: list[RawCourse] = []
        page_url = self.base_url

        while page_url:
            soup = self.fetch_page(page_url)
            raw_courses.extend(self.parse_courses(soup))

            next_link = soup.select_one('nav.pager a[rel="next"]')
            page_url = urljoin(page_url, next_link["href"]) if next_link else None

        if not raw_courses:
            raise RuntimeError("No courses found. The page structure may have changed.")

        # Step 2: open each course page to get its description.
        records: list[Course] = []

        for raw in raw_courses:
            detail = self.fetch_page(raw["source_url"])
            prose = detail.select_one("div.prose")
            raw["description"] = prose.get_text(" ", strip=True) if prose else None

            records.append(self.to_common_schema(raw))

        return records