import re
from typing import ClassVar

from bs4 import BeautifulSoup, Tag

from exam_scrapers.base_scraper import BaseExamScraper
from models.catalog import Exam


class GATEScraper(BaseExamScraper):
    """
    Scraper for GATE 2027 important dates.

    Extracts activities, dates, and days from the official
    GATE important dates HTML table.
    """

    exam_name = Exam.GATE
    year = 2027

    base_url = "https://gate2027.iitm.ac.in/"
    source_url = f"{base_url}important_dates"

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
        table = soup.select_one(".table-scroll table")

        if table is None:
            raise ValueError("Could not find the GATE important dates table.")

        records = []
        current_activity = None

        for row in table.select("tbody tr"):
            cells = row.find_all("td", recursive=False)

            if len(cells) < 2:
                continue

            if cells[0].has_attr("rowspan"):
                current_activity = cells[0].get_text(" ", strip=True)
                date_cell = cells[1]
                day_cell = cells[2] if len(cells) > 2 else None
            elif len(cells) == 3:
                current_activity = cells[0].get_text(" ", strip=True)
                date_cell = cells[1]
                day_cell = cells[2]
            elif len(cells) == 2 and current_activity:
                date_cell = cells[0]
                day_cell = cells[1]
            else:
                continue

            dates = self.keep_latest_values(
                self.extract_cell_values(date_cell)
            )
            days = self.keep_latest_values(
                self.extract_cell_values(day_cell)
                if day_cell else []
            )

            records.append({
                "activity": current_activity,
                "dates": dates,
                "days": days,
                "source_url": self.source_url,
            })

        return records

    @staticmethod
    def extract_cell_values(cell: Tag) -> list[dict]:
        results = []
        fragments = re.split(r"<br\s*/?>", str(cell), flags=re.IGNORECASE)

        for fragment in fragments:
            fragment_soup = BeautifulSoup(fragment, "html.parser")
            deleted = fragment_soup.find_all("del")

            for deleted_element in deleted:
                deleted_element.extract()

            plain_text = fragment_soup.get_text(" ", strip=True)

            if plain_text:
                results.append({
                    "value": plain_text,
                    "revised": False,
                })
                continue

            if deleted:
                deleted_text = " ".join(
                    element.get_text(" ", strip=True)
                    for element in deleted
                    if element.get_text(" ", strip=True)
                )
                if deleted_text:
                    results.append({
                        "value": deleted_text,
                        "revised": True,
                    })

        if not results:
            text = cell.get_text(" ", strip=True)
            if text:
                results.append({
                    "value": text,
                    "revised": False,
                })

        return results

    @staticmethod
    def keep_latest_values(values: list[dict]) -> list[dict]:
        if not values:
            return []

        has_revisions = any(value["revised"] for value in values)
        if not has_revisions:
            if any(value["value"].strip().lower() == "to" for value in values):
                return [{
                    "value": " to ".join(
                        item["value"].strip()
                        for item in values
                        if item["value"].strip().lower() != "to"
                    ),
                    "revised": False,
                }]
            return values

        current_values = [
            value for value in values
            if not value["revised"]
        ]
        if current_values:
            return [current_values[-1]]
        return [values[-1]]
