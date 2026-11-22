from exam_scrapers.base_scraper import BaseExamScraper
from exam_scrapers.strategies.gate_scraper import GATEScraper
from exam_scrapers.strategies.jam_2027_scraper import JAM2027Scraper
from exam_scrapers.strategies.jam_scraper import JAMScraper
from models.catalog import Exam

ExamKey = tuple[Exam, int]


class ExamScraperRegistry:
    def __init__(self) -> None:
        self._scrapers: dict[ExamKey, type[BaseExamScraper]] = {}

    def register(self, scraper_class: type[BaseExamScraper]) -> None:
        key = (scraper_class.exam_name, scraper_class.year)
        if key in self._scrapers:
            raise ValueError(f"Duplicate exam scraper registration: {key}")
        self._scrapers[key] = scraper_class

    def get(self, exam_name: Exam, year: int) -> BaseExamScraper:
        key = (exam_name, year)
        try:
            return self._scrapers[key]()
        except KeyError:
            raise KeyError(f"No exam scraper registered for {key}") from None

    def exams(self) -> list[Exam]:
        return sorted({exam for exam, _ in self._scrapers})

    def years(self, exam_name: Exam) -> list[int]:
        return sorted(
            {year for name, year in self._scrapers if name == exam_name},
            reverse=True,
        )


exam_registry = ExamScraperRegistry()
exam_registry.register(GATEScraper)
exam_registry.register(JAMScraper)
exam_registry.register(JAM2027Scraper)
