
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import TypeAdapter

from scrapers.models import Course
from scrapers.registry import registry

app = FastAPI(title="UniScope API")

COURSE_ADAPTER = TypeAdapter(list[Course])
DATA_DIR = Path(__file__).resolve().parent / "data"

# use http://localhost:8000/docs for testing all the uri through web


# health check
@app.get("/")
def health_check():
    return {"message": "UniScope backend is running"}

# Lists the registered college scrapers.
@app.get("/api/sources")
def get_sources():
    return {"sources": registry.available_sources()}

# Does scraping
@app.post("/api/scrape/{college_id}/{department_id}")
def scrape_courses(college_id: str, department_id: str):
    try:
        scraper = registry.get(college_id, department_id)
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown source: {college_id}/{department_id}",
        )

    try:
        records = scraper.scrape()
        courses = COURSE_ADAPTER.validate_python(records)

        DATA_DIR.mkdir(parents=True, exist_ok=True)
        output_file = DATA_DIR / (
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

        return {
            "college_id": college_id,
            "department_id": department_id,
            "count": len(courses),
            "saved_to": str(output_file),
            "courses": [
                course.model_dump(mode="json")
                for course in courses
            ],
        }

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Scraping failed: {exc}",
        ) from exc
