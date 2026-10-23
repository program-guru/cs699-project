from unittest.mock import Mock

from bs4 import BeautifulSoup
from scrapers.strategies.iitb_cse_scraper import IITBCSEScraper
from scrapers.strategies.iitm_cse_scraper import IITMCSEScraper


def test_iitm_parser_deduplicates_course_codes() -> None:
    html = """
    <div class="card">
        <h3>Data Structures</h3>
        <span>UG</span><span>Core</span>
        <p>Course No : CS101</p>
    </div>
    <div class="card">
        <h3>Data Structures (duplicate)</h3>
        <p>Course No : CS101</p>
    </div>
    """

    records = IITMCSEScraper().parse_courses(BeautifulSoup(html, "lxml"))

    assert len(records) == 1
    assert records[0]["course_code"] == "CS101"


def test_iitb_parser_handles_null_and_non_object_prerequisites() -> None:
    response = Mock()
    response.json.return_value = [
        {
            "crsename": "Data Structures",
            "crsecode": "CS101",
            "prereq": None,
        },
        {
            "crsename": "Operating Systems",
            "crsecode": "CS102",
            "prereq": 123,
        },
        {
            "crsename": "Networks",
            "crsecode": "CS103",
            "prereq": "CS101",
        },
    ]
    scraper = IITBCSEScraper()
    scraper.session.get = Mock(return_value=response)

    records = scraper.scrape()

    assert [record["prerequisites"] for record in records] == [
        [],
        [],
        ["CS101"],
    ]
    scraper.close()


def test_scraper_close_closes_http_session() -> None:
    scraper = IITMCSEScraper()
    scraper.session.close = Mock()

    scraper.close()

    scraper.session.close.assert_called_once_with()
