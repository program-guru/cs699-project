import logging
import re
from typing import ClassVar

from bs4 import BeautifulSoup, Tag

from models.course import Course
from scrapers.base_scraper import BaseCourseScraper, RawCourse

logger = logging.getLogger(__name__)

PLACEHOLDER_SYLLABUS = "detailed syllabus text is not available"
PLACEHOLDER_INSTRUCTOR = "to be announced"

# Labels we expect inside the Details dialog. The dialog markup was not
# inspected, so this is matched loosely against the dialog's visible text.
LABELS: dict[str, str] = {
    "prerequisite": "prerequisites",
    "prerequisites": "prerequisites",
    "pre-requisite": "prerequisites",
    "pre-requisites": "prerequisites",
    "instructor": "instructor",
    "instructors": "instructor",
    "faculty": "instructor",
    "syllabus": "description",
    "description": "description",
    "course description": "description",
    "course content": "description",
    "course contents": "description",
    "course outline": "description",
    "textbook": "textbooks",
    "textbooks": "textbooks",
    "reference": "references",
    "references": "references",
    "reference books": "references",
    "evaluation": "evaluation",
    "grading": "evaluation",
}
LABEL_ONLY_RE = re.compile(
    r"^(" + "|".join(re.escape(k) for k in LABELS) + r")\s*:?\s*$", re.I
)
LABEL_INLINE_RE = re.compile(
    r"^(" + "|".join(re.escape(k) for k in LABELS) + r")\s*:\s*(.+)$", re.I
)


class IITGNCSEScraper(BaseCourseScraper):
    college_id = "iitgn"
    college_name = "IIT Gandhinagar"
    department_id = "cse"
    department_name = "Computer Science and Engineering"

    base_url = "https://cse.iitgn.ac.in/academics/courses/"
    request_headers: ClassVar[dict[str, str]] = {
        "Accept": "text/html,application/xhtml+xml",
    }

    # Catalogue cards live in section.section-padding; the "Featured course
    # resources" cards are in an earlier section and are deliberately skipped.
    CARD_SELECTOR = "section.section-padding div[data-slot='card']"

    def __init__(self, timeout: int = 30, use_browser: bool = True):
        super().__init__(timeout=timeout)
        self.use_browser = use_browser

    # ------------------------------------------------------------------
    # Static parsing of the list cards (description is truncated here)
    # ------------------------------------------------------------------
    def parse_courses(self, soup: BeautifulSoup) -> list[RawCourse]:
        cards = soup.select(self.CARD_SELECTOR)
        if not cards:
            raise RuntimeError(
                "No catalogue cards found on the IIT Gandhinagar page. "
                "The page structure may have changed."
            )

        courses: list[RawCourse] = []
        for card in cards:
            raw = self._parse_card(card)
            if raw:
                courses.append(raw)
        return courses

    def _parse_card(self, card: Tag) -> RawCourse | None:
        title_el = card.find("h2")
        code_el = card.select_one("span.text-foreground")
        if not title_el or not code_el:
            return None

        title = title_el.get_text(" ", strip=True)
        code = code_el.get_text(" ", strip=True)

        program_el = card.select_one("span.rounded-full.border")
        program = program_el.get_text(" ", strip=True) if program_el else None

        ltp = None
        for span in card.find_all("span"):
            m = re.search(r"L-T-P\s*(\d+-\d+-\d+)", span.get_text(" ", strip=True))
            if m:
                ltp = m.group(1)
                break

        badges = [
            b.get_text(" ", strip=True)
            for b in card.select("span[data-slot='badge']")
        ]
        credits = level = category = duration = None
        for text in badges:
            if m := re.match(r"(\d+)\s*credits?$", text, re.I):
                credits = int(m.group(1))
            elif re.match(r"\d+\s*level$", text, re.I):
                level = text
            elif text in ("Full Semester", "Half Semester"):
                duration = text
            else:
                category = text  # "Others" / "Special Topics"

        desc_el = card.select_one("p.leading-relaxed")
        description = desc_el.get_text(" ", strip=True) if desc_el else None
        truncated = False
        if description and description.lower().startswith(PLACEHOLDER_SYLLABUS):
            description = None
        elif description and description.endswith("..."):
            truncated = True

        instructor = None
        users_icon = card.select_one("svg.lucide-users")
        if users_icon and users_icon.parent:
            text = users_icon.parent.get_text(" ", strip=True)
            if text and text.lower() != PLACEHOLDER_INSTRUCTOR:
                instructor = text

        return {
            "course_code": code,
            "title": title,
            "category": category,
            "level": level,
            "credits": credits,
            "description": description,
            "instructor": instructor,
            "source_url": self.base_url,
            # kept in raw_extra
            "program": program,
            "ltp": ltp,
            "duration": duration,
            "description_truncated": truncated,
        }

    # ------------------------------------------------------------------
    # Dialog parsing
    # ------------------------------------------------------------------
    @staticmethod
    def _parse_dialog_text(text: str) -> dict[str, str]:
        sections: dict[str, list[str]] = {}
        current = "_preamble"
        for line in (ln.strip() for ln in text.splitlines()):
            if not line:
                continue
            if m := LABEL_ONLY_RE.match(line):
                current = LABELS[m.group(1).lower()]
                sections.setdefault(current, [])
            elif m := LABEL_INLINE_RE.match(line):
                current = LABELS[m.group(1).lower()]
                sections.setdefault(current, []).append(m.group(2).strip())
            else:
                sections.setdefault(current, []).append(line)
        return {k: "\n".join(v).strip() for k, v in sections.items() if v}

    def _merge_details(self, raw: RawCourse, dialog_text: str) -> None:
        raw["details_text"] = dialog_text
        sections = self._parse_dialog_text(dialog_text)

        description = sections.get("description")
        if description and not description.lower().startswith(PLACEHOLDER_SYLLABUS):
            raw["description"] = description
            raw["description_truncated"] = False

        prereq = sections.get("prerequisites")
        if prereq and prereq.strip().lower() not in {"none", "nil", "na", "n/a", "-"}:
            raw["prerequisites"] = [prereq]

        instructor = sections.get("instructor")
        if instructor and instructor.lower() != PLACEHOLDER_INSTRUCTOR:
            raw["instructor"] = instructor

        for key in ("textbooks", "references", "evaluation"):
            if key in sections:
                raw[key] = sections[key]

    # ------------------------------------------------------------------
    # Browser-driven scrape
    # ------------------------------------------------------------------
    def _scrape_with_browser(self) -> list[RawCourse]:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError as exc:
            raise RuntimeError(
                "Playwright is required to read the Details dialogs. Install with: "
                "pip install playwright && playwright install chromium"
            ) from exc

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            try:
                page.goto(self.base_url, wait_until="networkidle",
                          timeout=self.timeout * 1000)
                # Wait for React hydration: buttons only work after it.
                page.wait_for_selector(f"{self.CARD_SELECTOR} h2",
                                       timeout=self.timeout * 1000)
                page.wait_for_timeout(1000)

                soup = BeautifulSoup(page.content(), "lxml")
                static_cards = soup.select(self.CARD_SELECTOR)
                parsed = [self._parse_card(c) for c in static_cards]

                cards = page.locator(self.CARD_SELECTOR)
                if cards.count() != len(parsed):
                    raise RuntimeError("Card count mismatch between DOM and parse.")

                for i, raw in enumerate(parsed):
                    if raw is None:
                        continue
                    try:
                        cards.nth(i).get_by_role("button", name="Details").click()
                        dialog = page.locator("[role='dialog']").first
                        dialog.wait_for(state="visible", timeout=10_000)
                        text = dialog.inner_text()
                        if raw["title"].lower() not in text.lower():
                            logger.warning("Dialog for %r did not mention title",
                                           raw["title"])
                        self._merge_details(raw, text)
                    except Exception as exc:  # keep going; list data still usable
                        logger.warning("Details failed for %s (%s): %s",
                                       raw["course_code"], raw["title"], exc)
                    finally:
                        page.keyboard.press("Escape")
                        try:
                            page.locator("[role='dialog']").first.wait_for(
                                state="hidden", timeout=5_000)
                        except Exception:
                            pass
            finally:
                browser.close()

        return [r for r in parsed if r]

    def scrape(self) -> list[Course]:
        if self.use_browser:
            try:
                raw_courses = self._scrape_with_browser()
            except RuntimeError as exc:
                if "Playwright is required" not in str(exc):
                    raise
                logger.warning("%s Falling back to truncated list data.", exc)
                raw_courses = self.parse_courses(self.fetch_page())
        else:
            raw_courses = self.parse_courses(self.fetch_page())

        records: list[Course] = []
        seen: set[tuple[str, str]] = set()
        for raw in raw_courses:
            if not raw.get("title"):
                continue
            key = (str(raw.get("course_code")).lower(), raw["title"].lower())
            if key in seen:
                continue
            seen.add(key)
            records.append(self.to_common_schema(raw))
        return records