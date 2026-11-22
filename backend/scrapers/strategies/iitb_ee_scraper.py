from typing import ClassVar
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from models.catalog import College, Department

from scrapers.base_scraper import BaseCourseScraper, RawCourse


class IITBEEScraper(BaseCourseScraper):
    college_name = College.IITB
    department_name = Department.EE

    base_url = "https://www.ee.iitb.ac.in/academics/courses/"
    request_headers: ClassVar[dict[str, str]] = {
        "Accept": "text/html,application/xhtml+xml",
    }

    def parse_courses(self, soup: BeautifulSoup) -> list[RawCourse]:
        cards = soup.select("a.course-card")

        if not cards:
            raise RuntimeError("No course cards found. The page structure may have changed.")

        courses: list[RawCourse] = []

        for card in cards:
            code = card.select_one(".course-code").get_text(strip=True)
            title = card.select_one("h3").get_text(strip=True)
            detail_url = urljoin(self.base_url, card["href"])

            course = {
                "course_code": code,
                "title": title,
                "level": card.get("data-level", "").upper() or None,
                "source_url": detail_url,
            }

            # Open the course's own page for the extra details
            self.parse_detail(course, detail_url)
            courses.append(course)

        return courses

    def parse_detail(self, course: RawCourse, url: str) -> None:
        soup = self.fetch_page(url)

        # Credits and Type are in small boxes: label on top, value below
        for box in soup.select(".course-meta-item"):
            label = box.div.get_text(strip=True).lower()
            value = box.select_one(".course-meta-value").get_text(strip=True)

            if label == "credits":
                course["credits"] = int(value) if value.isdigit() else None
            elif label == "type":
                course["category"] = value
            elif label.startswith("half"):
                course["half_sem"] = value.lower() == "yes"

        # Course Content and Text / References are separate sections
        for section in soup.select("section"):
            heading = section.find("h2").get_text(strip=True).lower()

            if "content" in heading:
                course["description"] = section.find("p").get_text(" ", strip=True)

            elif "reference" in heading:
                course["references"] = [
                    li.find_all("span")[-1].get_text(" ", strip=True)
                    for li in section.select("li")
                ]