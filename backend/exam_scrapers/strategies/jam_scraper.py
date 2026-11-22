from typing import ClassVar

from bs4 import BeautifulSoup

from exam_scrapers.base_scraper import BaseExamScraper
from models.catalog import Exam


class JAMScraper(BaseExamScraper):
    exam_name = Exam.JAM
    year = 2026

    base_url = "https://jam2026.iitb.ac.in/"
    source_url = f"{base_url}ImpDates.html"

    request_headers: ClassVar[dict[str, str]] = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html",
    }

    def scrape(self) -> list[dict]:
        response = self.session.get(
            self.source_url,
            headers=self.request_headers,
            timeout=self.timeout,
        )
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        table = soup.select_one("table.u-table-entity")
        if table is None:
            raise ValueError("Could not find the JAM important dates table.")

        records = []
        for row in table.select("tbody tr"):
            cells = row.find_all("td", recursive=False)
            if len(cells) < 2:
                continue

            activity = " ".join(cells[0].get_text(" ", strip=True).split())
            if not activity:
                continue

            date_cell = cells[1]
            struck_tags = [
                *date_cell.find_all(["del", "s", "strike"]),
                *date_cell.find_all(
                    style=lambda value: value and "line-through" in value.lower()
                ),
            ]
            has_struck_date = any(
                tag.get_text(" ", strip=True) for tag in struck_tags
            )
            current_date_cell = BeautifulSoup(str(date_cell), "html.parser")
            for struck_text in current_date_cell.find_all(
                ["del", "s", "strike"]
            ):
                struck_text.decompose()
            for tag in current_date_cell.find_all(style=True):
                if "line-through" in tag["style"].lower():
                    tag.decompose()

            date_value = " ".join(current_date_cell.get_text(" ", strip=True).split())
            if not date_value:
                continue

            records.append({
                "activity": activity,
                "dates": [{"value": date_value, "revised": has_struck_date}],
                "days": [],
                "source_url": self.source_url,
            })

        if not records:
            raise ValueError("The JAM important dates table contained no events.")

        return records
