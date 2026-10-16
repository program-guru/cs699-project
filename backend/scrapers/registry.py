from scrapers.base_scrapper import BaseCourseScraper
from scrapers.strategies.iitm_cse_scraper import IITMCSEScraper
from scrapers.strategies.iitb_cse_scraper import IITBCSEScraper


class ScraperRegistry:
    def __init__(self):
        self._scrapers: dict[
            tuple[str, str], type[BaseCourseScraper]
        ] = {}

    def register(
        self,
        college_id: str,
        department_id: str,
        scraper_class: type[BaseCourseScraper],
    ) -> None:
        key = (
            college_id.lower(),
            department_id.lower(),
        )

        if key in self._scrapers:
            raise ValueError(f"Duplicate scraper registration: {key}")

        self._scrapers[key] = scraper_class

    def get(
        self,
        college_id: str,
        department_id: str,
    ) -> BaseCourseScraper:
        key = (
            college_id.lower(),
            department_id.lower(),
        )

        if key not in self._scrapers:
            raise KeyError(f"No scraper registered for {key}")

        return self._scrapers[key]()

    def available_sources(self) -> list[dict[str, str]]:
        result = []

        for (college_id, department_id), cls in self._scrapers.items():
            result.append({
                "college_id": college_id,
                "department_id": department_id,
                "college_name": cls.college_name,
                "department_name": cls.department_name,
            })

        return result


registry = ScraperRegistry()
registry.register("iitm", "cse", IITMCSEScraper)
registry.register("iitb", "cse", IITBCSEScraper)

