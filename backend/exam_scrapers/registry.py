from exam_scrapers.base_scraper import BaseExamScraper
from exam_scrapers.strategies.gate_scraper import GATEScraper
from exam_scrapers.strategies.jam_scraper import JAMScraper


class ExamScraperRegistry:
    def __init__(self) -> None:
        self._scrapers: dict[tuple[str, int], type[BaseExamScraper]] = {}

    def register(self, scraper_class: type[BaseExamScraper]) -> None:
        key = (scraper_class.exam_name.upper(), scraper_class.year)
        if key in self._scrapers:
            raise ValueError(f"Duplicate exam scraper registration: {key}")
        self._scrapers[key] = scraper_class

    def get(self, exam_name: str, year: int) -> BaseExamScraper:
        key = (exam_name.upper(), year)
        try:
            return self._scrapers[key]()
        except KeyError:
            raise KeyError(f"No exam scraper registered for {key}") from None

    def exams(self) -> list[str]:
        return sorted({exam_name for exam_name, _ in self._scrapers})

    def years(self, exam_name: str) -> list[int]:
        normalized = exam_name.upper()
        return sorted(
            {year for name, year in self._scrapers if name == normalized},
            reverse=True,
        )


exam_registry = ExamScraperRegistry()
exam_registry.register(GATEScraper)
exam_registry.register(JAMScraper)
