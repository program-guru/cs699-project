from models.catalog import College, Department

from scrapers.base_scraper import BaseCourseScraper
from scrapers.strategies.iitb_cse_scraper import IITBCSEScraper
from scrapers.strategies.iitm_cse_scraper import IITMCSEScraper

Key = tuple[College, Department]


class ScraperRegistry:
    def __init__(self) -> None:
        self._scrapers: dict[Key, type[BaseCourseScraper]] = {}

    def register(self, scraper_class: type[BaseCourseScraper]) -> None:
        key = (scraper_class.college_name, scraper_class.department_name)
        if key in self._scrapers:
            raise ValueError(f"Duplicate scraper registration: {key}")
        self._scrapers[key] = scraper_class

    def get(self, college: College, department: Department) -> BaseCourseScraper:
        try:
            return self._scrapers[(college, department)]()
        except KeyError:
            raise KeyError(
                f"No scraper registered for {(college, department)}"
            ) from None

    def colleges(self) -> list[College]:
        return sorted({c for c, _ in self._scrapers})

    def departments(self, college: College | None = None) -> list[Department]:
        return sorted(
            {d for c, d in self._scrapers if college is None or c == college}
        )


registry = ScraperRegistry()
registry.register(IITMCSEScraper)
registry.register(IITBCSEScraper)
