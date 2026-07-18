import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://moneytools-uk.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def test_list_guides_returns_published_and_categories():
    r = requests.get(f"{API}/guides", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert "guides" in data and "categories" in data
    assert isinstance(data["guides"], list)
    assert len(data["guides"]) >= 1
    g0 = data["guides"][0]
    for k in ("id", "slug", "title", "category", "read_minutes", "excerpt"):
        assert k in g0, f"missing key {k}"
    assert isinstance(data["categories"], list)


def test_get_valid_guide_by_slug():
    listing = requests.get(f"{API}/guides", timeout=20).json()
    slug = listing["guides"][0]["slug"]
    r = requests.get(f"{API}/guides/{slug}", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert "guide" in data
    assert data["guide"]["slug"] == slug
    assert data["guide"].get("content")
    assert "related" in data
    assert isinstance(data["related"], list)


def test_invalid_slug_returns_404():
    r = requests.get(f"{API}/guides/this-does-not-exist-xyz", timeout=20)
    assert r.status_code == 404


def test_category_filter_freelancing():
    r = requests.get(f"{API}/guides", params={"category": "Freelancing"}, timeout=20)
    assert r.status_code == 200
    data = r.json()
    for g in data.get("guides", []):
        assert g["category"] == "Freelancing"


def test_admin_all_requires_auth():
    r = requests.get(f"{API}/guides/admin/all", timeout=20)
    assert r.status_code in (401, 403)


def test_known_guide_slug():
    r = requests.get(f"{API}/guides/how-to-start-freelancing-in-the-uk-with-no-experience", timeout=20)
    # may or may not exist; but if it exists, test key fields
    if r.status_code == 200:
        d = r.json()["guide"]
        assert d["slug"] == "how-to-start-freelancing-in-the-uk-with-no-experience"
        assert d.get("hero_image", "").startswith("http")
