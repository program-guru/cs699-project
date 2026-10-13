
import requests
from bs4 import BeautifulSoup

URL = "https://www.cse.iitm.ac.in/courses.php"

response = requests.get(
    URL,
    timeout=20,
    headers={"User-Agent": "CSCourseComparator/0.1 (academic project)"}
)
response.raise_for_status()

soup = BeautifulSoup(response.text, "lxml")

print("HTTP status:", response.status_code)
print("Page title:", soup.title.get_text(" ", strip=True) if soup.title else None)
print("HTML size:", len(response.text))

# Look for course-related headings and their nearby markup.
for heading in soup.find_all(["h1", "h2", "h3", "h4", "h5"]):
    title = heading.get_text(" ", strip=True)
    if title:
        print("\nHEADING:", title)
        print(heading.parent.prettify()[:1800])
