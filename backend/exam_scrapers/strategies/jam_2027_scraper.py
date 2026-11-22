from datetime import datetime
from typing import ClassVar

from bs4 import BeautifulSoup

from exam_scrapers.base_scraper import BaseExamScraper


class JAM2027Scraper(BaseExamScraper):
    exam_name = "JAM"
    year = 2027

    base_url = "https://jam.iitkgp.ac.in/"
    source_url = base_url

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
        ticker = soup.select_one(".notice-board .news-ticker-track")
        if ticker is None:
            raise ValueError("Could not find the JAM announcement ticker.")

        records = []
        seen_events = set()
        for item in ticker.select(".notice-item.news-item"):
            activity_element = item.select_one(".text-list-ox")
            day_element = item.select_one(".date span")
            month_year_element = item.select_one(".date small")
            if (
                activity_element is None
                or day_element is None
                or month_year_element is None
            ):
                continue

            activity = " ".join(activity_element.get_text(" ", strip=True).split())
            day = day_element.get_text(" ", strip=True)
            month_year = " ".join(
                month_year_element.get_text(" ", strip=True).split()
            )
            month_year = month_year.upper().replace("SEPT", "SEP")
            try:
                date_value = datetime.strptime(
                    f"{day} {month_year}", "%d %b %Y"
                ).strftime("%B %d, %Y")
            except ValueError as error:
                raise ValueError(
                    f"Could not parse JAM announcement date: {day} {month_year}"
                ) from error

            activity_key = activity.casefold().removesuffix("s")
            event_key = (activity_key, date_value)
            if event_key in seen_events:
                continue
            seen_events.add(event_key)

            records.append({
                "activity": activity,
                "dates": [{
                    "value": date_value,
                    "revised": "extended" in activity.casefold(),
                }],
                "days": [],
                "source_url": self.source_url,
            })

        if not records:
            raise ValueError("The JAM announcement ticker contained no events.")

        return records
