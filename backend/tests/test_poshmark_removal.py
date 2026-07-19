"""Tests for Poshmark removal + backend health after server.py fix."""
import os
import re
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://moneytools-uk.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def platforms():
    r = requests.get(f"{BASE_URL}/api/platforms", timeout=30)
    assert r.status_code == 200, f"platforms status={r.status_code}"
    data = r.json()
    return data["platforms"] if isinstance(data, dict) else data


def test_platforms_ok(platforms):
    assert isinstance(platforms, list)
    assert len(platforms) > 100, f"only {len(platforms)} platforms"


def test_no_poshmark_in_platforms(platforms):
    matches = [p for p in platforms if "poshmark" in (p.get("name", "") + p.get("slug", "")).lower()]
    assert matches == [], f"Found Poshmark: {matches}"


def test_categories_ok():
    r = requests.get(f"{BASE_URL}/api/categories", timeout=30)
    assert r.status_code == 200
    data = r.json()
    cats = data["categories"] if isinstance(data, dict) else data
    assert isinstance(cats, list)


def test_stats_ok():
    r = requests.get(f"{BASE_URL}/api/stats", timeout=30)
    assert r.status_code == 200


def test_content_ok():
    r = requests.get(f"{BASE_URL}/api/content", timeout=30)
    assert r.status_code == 200


def test_guides_ok():
    r = requests.get(f"{BASE_URL}/api/guides", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 3


def test_sitemap_no_poshmark():
    for path in ["/sitemap.xml", "/platforms-sitemap.xml"]:
        r = requests.get(f"{BASE_URL}{path}", timeout=30)
        assert r.status_code == 200, f"{path} status={r.status_code}"
        assert "poshmark" not in r.text.lower(), f"poshmark still in {path}"
