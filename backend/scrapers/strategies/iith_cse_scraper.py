import csv
import io
import re
from typing import Any, ClassVar

from bs4 import BeautifulSoup

from models.course import Course
from models.catalog import College, Department
from scrapers.base_scraper import BaseCourseScraper, RawCourse


class IITHCSEScraper(BaseCourseScraper):
    college_name = College.IITH
    department_name = Department.CSE

    base_url = "https://cse.iith.ac.in/academics/courses.html"

    request_headers: ClassVar[dict[str, str]] = {
        "Accept": "text/csv,text/plain,*/*",
    }

    # (category, level hint, csv url)
    SHEETS: ClassVar[tuple[tuple[str, str, str], ...]] = (
        (
            "Core",
            "UG",
            "https://docs.google.com/spreadsheets/d/e/"
            "2PACX-1vTp5MchquNwsDJc9-2JBi3vb0yKMg2u0izg4wQS-lBVp_HKXtabDdEgTPBSATHl8AGijxlQ7NvUP6vR/"
            "pub?output=csv",
        ),
        (
            "Elective",
            "5-level",
            "https://docs.google.com/spreadsheets/d/e/"
            "2PACX-1vQDuYvuJc2hyWqcK9MhKh3Gyi6AihTHgeVB0W-QOCns9VT7-8VZ0oci2dbMWZmFR-OYSYE1eTlLXTAc/"
            "pub?gid=1198494644&single=true&output=csv",
        ),
        (
            "Elective",
            "6-level",
            "https://docs.google.com/spreadsheets/d/e/"
            "2PACX-1vSsvuDohfkHdcodHGEaKmcWyGvq_1cutgumDwKTV7I-9OE0fWYvR4SjX1GebXw4jEk29CdI_jq6gI4L/"
            "pub?gid=2095190655&single=true&output=csv",
        ),
    )

    COURSE_CODE_RE = re.compile(r"^[A-Z]{2,3}\s?\d{4}[A-Z]?$")
    LTPC_RE = re.compile(r"^\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?){3}$")

    # header keyword to field name mapping
    HEADER_KEYWORDS: ClassVar[tuple[tuple[str, str], ...]] = (
        ("code", "course_code"),
        ("credit", "credits"),
        ("title", "title"),
        ("name", "title"),
        ("syllabus", "description"),
        ("content", "description"),
        ("description", "description"),
        ("reference", "references"),
        ("text", "references"),
    )

    # Used if no header row is found
    DEFAULT_COLUMNS: ClassVar[dict[str, int]] = {
        "course_code": 0,
        "title": 1,
        "credits": 2,
        "description": 3,
        "references": 4,
    }

    def parse_courses(self, soup: BeautifulSoup) -> list[RawCourse]:
        # data will comes from CSV exports
        del soup
        raise NotImplementedError("Use scrape() to process the CSV exports.")

    def scrape(self) -> list[Course]:
        raw_courses: list[RawCourse] = []
        seen: set[str] = set()

        for category, level_hint, url in self.SHEETS:
            rows = self._fetch_csv(url)
            parsed = self._parse_rows(rows, category, level_hint, url)
            for raw in parsed:
                key = raw["course_code"].lower()
                if key in seen:
                    continue
                seen.add(key)
                raw_courses.append(raw)

        if not raw_courses:
            raise RuntimeError(
                "No courses extracted from IIT Hyderabad CSE sheets. "
                "Check the printed row counts and the sheet header names."
            )

        return [self.to_common_schema(raw) for raw in raw_courses]

    def _fetch_csv(self, url: str) -> list[list[str]]:
        response = self.session.get(
            url,
            timeout=self.timeout,
            allow_redirects=True,
            headers=self.request_headers,
        )
        response.raise_for_status()
        response.encoding = "utf-8"

        text = response.text
        if text.lstrip().lower().startswith(("<!doctype", "<html")):
            raise RuntimeError(
                f"Expected CSV but got HTML from {url}. "
                "The sheet may no longer be published to the web."
            )

        return list(csv.reader(io.StringIO(text)))

    def _parse_rows(
        self,
        rows: list[list[str]],
        category: str,
        level_hint: str,
        url: str,
    ) -> list[RawCourse]:
        columns, start = self._detect_columns(rows)
        courses: list[RawCourse] = []

        for row in rows[start:]:
            def cell(field: str, row: list[str] = row) -> str:
                idx = columns.get(field)
                if idx is None or idx >= len(row):
                    return ""
                return re.sub(r"[ \t]+", " ", row[idx]).strip()

            code = re.sub(r"\s+", "", cell("course_code").upper())
            title = cell("title")

            if not self.COURSE_CODE_RE.fullmatch(code) or not title:
                continue

            credits, credits_raw = self._parse_credits(cell("credits"))

            raw: dict[str, Any] = {
                "course_code": code,
                "title": title,
                "category": category,
                "credits": credits,
                "description": cell("description") or None,
                "source_url": url,
                "references": cell("references") or None,
                "sheet": level_hint,
            }
            if credits is None and credits_raw:
                raw["credits_raw"] = credits_raw

            courses.append(raw)

        return courses

    def _detect_columns(self, rows: list[list[str]]) -> tuple[dict[str, int], int]:
        """Find the header row and map field names to column indexes."""
        for i, row in enumerate(rows[:15]):
            lowered = [c.strip().lower() for c in row]
            if not any("code" in c for c in lowered):
                continue

            mapping: dict[str, int] = {}
            for idx, header in enumerate(lowered):
                for keyword, field in self.HEADER_KEYWORDS:
                    if keyword in header and field not in mapping:
                        mapping[field] = idx
                        break

            if "course_code" in mapping and "title" in mapping:
                return mapping, i + 1

        return dict(self.DEFAULT_COLUMNS), 0

    def _parse_credits(self, value: str) -> tuple[int | float | None, str]:
        value = value.strip()
        if not value:
            return None, ""

        if self.LTPC_RE.fullmatch(value):  # last number is credits
            value = value.split("-")[-1]

        try:
            number = float(value)
        except ValueError:
            return None, value

        return (int(number) if number.is_integer() else number), ""