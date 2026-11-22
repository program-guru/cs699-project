import re
from typing import ClassVar
from urllib.parse import quote, urljoin

import requests
from bs4 import BeautifulSoup

from scrapers.base_scraper import BaseCourseScraper, RawCourse
from models.catalog import College, Department


class IITKCSEScraper(BaseCourseScraper):
    college_name = College.IITK
    department_name = Department.CSE

    base_url = "https://www.cse.iitk.ac.in/pages/Courses.html"
    request_headers: ClassVar[dict[str, str]] = {
        "Accept": "text/html,application/xhtml+xml",
    }

    def parse_courses(self, soup: BeautifulSoup) -> list[RawCourse]:
        rows = soup.select("table tr")

        if not rows:
            raise RuntimeError("No table found. The page structure may have changed.")

        courses: list[RawCourse] = []

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 3:
                continue  

            code = cells[1].get_text(strip=True)
            links = cells[2].find_all("a")
            title = links[0].get_text(strip=True)

            # Some page names have spaces
            detail_url = quote(urljoin(self.base_url, links[0]["href"]), safe=":/%()")


            digit = re.search(r"\d", code).group()
            level = "UG" if digit in "1234" else "PG" if digit in "6789" else None

            course = {
                "course_code": code,
                "title": title,
                "level": level,
                "source_url": detail_url,
            }

            if len(links) > 1:
                course["syllabus_url"] = links[1]["href"]

            try:
                self.parse_detail(course, detail_url)
            except requests.RequestException:
                pass  
            courses.append(course)

        return courses

    def parse_detail(self, course: RawCourse, url: str) -> None:
        soup = self.fetch_page(url)
        box = soup.select_one("div.agileinfo-contact-main-address")

        section = ""  
        description = []
        books = []
        prereq = []
        for tag in box.find_all(["h6", "p", "li"]):
            text = tag.get_text(" ", strip=True)
            if not text:
                continue

            # last number is credits
            credits = re.search(r"Credits?\s*:?\s*(\d+(?:\s*-\s*\d+){2,5})", text, re.I)
            if credits:
                numbers = re.findall(r"\d+", credits.group(1))
                course["credits"] = float(numbers[-1])
                course["ltp"] = "-".join(numbers[:3])

            label = re.search(r"pre-?\s?req\w*\s*[:\-–]", text, re.I)

            if label:
                value = text[label.end():].strip()
                if value:
                    prereq.append(value)
                else:
                    section = "prerequisites"  
            elif tag.name == "h6" or re.fullmatch(r"pre-?\s?req\w*", text, re.I):
                section = text.lower() 
                if not re.search(r"pre-?\s?req|book|reference", section):
                    description.append(text)
            elif re.search(r"pre-?\s?req", section):
                prereq.append(text)
            elif re.search(r"book|reference", section):
                books.append(text)
            else:
                description.append(text)

        if description:
            course["description"] = "\n".join(description)

        if books:
            course["textbooks"] = "\n".join(books)

        if prereq:
            text = " ".join(prereq)
            codes = re.findall(r"[A-Za-z]{2,4}\s?\d{3}[A-Za-z]?", text)
            course["prerequisites_text"] = text
            course["prerequisites"] = [c.replace(" ", "").upper() for c in codes] or (
                [] if text.lower().strip(" .") in ("none", "nil", "na", "-") else [text]
            )