
import json
import logging
import argparse
from pathlib import Path

from bs4 import BeautifulSoup
from pydantic import TypeAdapter

from scrapers.models import Course
from scrapers.registry import registry

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--html",
        help="Path to a saved HTML file; skips the live website request.",
    )
    args = parser.parse_args()

    college_id = "iitb"
    department_id = "cse"
    # college_id = "iitb"
    # department_id = "cse"

    scraper = registry.get(college_id, department_id)

    try:
        if args.html:
            html_path = Path(args.html)

            soup = BeautifulSoup(
                html_path.read_text(encoding="utf-8"),
                "lxml",
            )

            raw_records = scraper.parse_courses(soup)

            records = [
                scraper.to_common_schema(record)
                for record in raw_records
                if record.get("title")
            ]

            logging.info("Parsed saved HTML: %s", html_path)
        else:
            records = scraper.scrape()

        courses = TypeAdapter(list[Course]).validate_python(records)

        output_dir = Path("data")
        output_dir.mkdir(parents=True, exist_ok=True)

        output_file = output_dir / (
            f"{college_id}_{department_id}_courses.json"
        )

        output_file.write_text(
            json.dumps(
                [course.model_dump(mode="json") for course in courses],
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )

        logging.info(
            "Saved %d courses to %s",
            len(courses),
            output_file,
        )

        if not courses:
            logging.warning(
                "No courses found. Check the HTML and parser selectors."
            )

    except Exception:
        logging.exception(
            "Processing failed for %s/%s",
            college_id,
            department_id,
        )
        raise


if __name__ == "__main__":
    main()
