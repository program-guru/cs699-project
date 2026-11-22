from abc import ABC, abstractmethod
from typing import Any, ClassVar

import requests
from bs4 import BeautifulSoup

from models.catalog import Exam


class BaseExamScraper(ABC):
    exam_name: ClassVar[Exam]
    year: ClassVar[int]
    base_url: str
    source_url: str
    request_headers: ClassVar[dict[str, str]] = {}

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": (
                    "UniScope exam timeline scraper "
                    "(https://github.com/program-guru/cs699-project)"
                ),
                "Accept-Language": "en-US,en;q=0.9",
            }
        )

    def close(self) -> None:
        self.session.close()

    def fetch_page(self, url: str | None = None) -> BeautifulSoup:
        target = url or self.base_url
        response = self.session.get(
            target,
            timeout=self.timeout,
            allow_redirects=True,
            headers=self.request_headers,
        )
        response.raise_for_status()
        return BeautifulSoup(response.text, "html.parser")

    @abstractmethod
    def scrape(self) -> list[dict[str, Any]]:
        """Extract exam timeline records."""
        raise NotImplementedError
