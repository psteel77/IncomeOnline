"""
Tests for Success Stories SEO endpoints (iteration 5).
Covers:
 - GET /api/seo/success-stories (list of 60 unique slugs)
 - GET /api/seo/success-story/{slug} (single + related + 404)
 - GET /api/seo/render/success-story/{slug} (crawler HTML + 404 noindex)
 - GET /api/seo/success-stories-sitemap.xml (60 <loc> entries)
 - GET /api/seo/render/success-stories (index HTML linking all 60)
 - GET /api/seo/render/home and /api/seo/render/donate (200 + valid HTML)
"""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://moneytools-uk.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def stories_payload():
    r = requests.get(f"{API}/seo/success-stories", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


# ---- list endpoint ----
class TestListStories:
    def test_returns_60_unique_slugs(self, stories_payload):
        assert stories_payload.get("count") == 60
        stories = stories_payload.get("stories") or []
        assert len(stories) == 60
        slugs = [s.get("slug") for s in stories]
        assert all(slugs), "Some stories missing slug"
        assert len(set(slugs)) == 60, "Duplicate slugs detected"

    def test_each_story_has_required_fields(self, stories_payload):
        required = {"id", "name", "platform", "category", "before", "after",
                    "timeline", "earnings", "highlight", "story", "source", "sourceUrl", "slug"}
        for s in stories_payload["stories"]:
            missing = required - set(s.keys())
            assert not missing, f"Story {s.get('id')} missing {missing}"

    def test_sarah_m_upwork_slug_present(self, stories_payload):
        slugs = {s["slug"] for s in stories_payload["stories"]}
        assert "sarah-m-upwork" in slugs


# ---- single story endpoint ----
class TestSingleStory:
    def test_get_story_by_slug(self):
        r = requests.get(f"{API}/seo/success-story/sarah-m-upwork", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "story" in data and "related" in data
        assert data["story"]["slug"] == "sarah-m-upwork"
        assert data["story"]["platform"] == "Upwork"
        assert isinstance(data["related"], list)
        assert len(data["related"]) <= 4
        # related should not contain self
        assert all(r_["slug"] != "sarah-m-upwork" for r_ in data["related"])

    def test_related_prefers_same_category(self):
        r = requests.get(f"{API}/seo/success-story/sarah-m-upwork", timeout=30)
        data = r.json()
        # Sarah is Freelancing - related should be Freelancing first
        if data["related"]:
            assert data["related"][0]["category"] == "Freelancing"

    def test_unknown_slug_404(self):
        r = requests.get(f"{API}/seo/success-story/does-not-exist", timeout=30)
        assert r.status_code == 404

    def test_multiple_slugs_resolve(self):
        for slug in ["james-k-youtube", "emma-l-etsy", "michael-t-fiverr", "rob-percival-udemy"]:
            r = requests.get(f"{API}/seo/success-story/{slug}", timeout=30)
            assert r.status_code == 200, f"slug {slug} failed: {r.status_code}"
            assert r.json()["story"]["slug"] == slug


# ---- bot-facing HTML render endpoints ----
class TestRenderSuccessStory:
    def test_render_returns_html_with_seo(self):
        r = requests.get(f"{API}/seo/render/success-story/sarah-m-upwork", timeout=30)
        assert r.status_code == 200
        html = r.text
        assert "<title>" in html
        # Unique title for this story
        m = re.search(r"<title>(.*?)</title>", html, re.S)
        assert m and "Sarah M." in m.group(1) and "Upwork" in m.group(1)
        assert '<meta name="description"' in html
        assert '<link rel="canonical"' in html
        assert "<h1>" in html
        assert '"@type": "Article"' in html or '"@type":"Article"' in html
        # breadcrumb / internal links
        assert 'href="https://www.incomeonline.info/success-stories"' in html
        # Related stories list
        assert "More success stories" in html

    def test_render_unknown_slug_404_with_noindex(self):
        r = requests.get(f"{API}/seo/render/success-story/totally-bogus-slug", timeout=30)
        assert r.status_code == 404
        assert "noindex" in r.text


# ---- sitemap ----
class TestSitemap:
    def test_sitemap_has_60_locs(self):
        r = requests.get(f"{API}/seo/success-stories-sitemap.xml", timeout=30)
        assert r.status_code == 200
        assert "application/xml" in r.headers.get("content-type", "")
        body = r.text
        assert "<urlset" in body
        locs = re.findall(r"<loc>(.*?)</loc>", body)
        assert len(locs) == 60, f"Expected 60 <loc>, got {len(locs)}"
        # Every loc points to /success-stories/{slug}
        assert all("/success-stories/" in u for u in locs)
        # Confirm sarah is there
        assert any(u.endswith("/success-stories/sarah-m-upwork") for u in locs)


# ---- index render endpoint ----
class TestRenderIndex:
    def test_index_lists_all_60_stories(self):
        r = requests.get(f"{API}/seo/render/success-stories", timeout=30)
        assert r.status_code == 200
        html = r.text
        assert "<title>" in html
        assert '<link rel="canonical"' in html
        # Every story slug should appear linked
        list_r = requests.get(f"{API}/seo/success-stories", timeout=30).json()
        slugs = [s["slug"] for s in list_r["stories"]]
        missing = [s for s in slugs if f"/success-stories/{s}" not in html]
        assert not missing, f"Missing story links in index: {missing[:5]}..."


# ---- home / donate render endpoints ----
class TestOtherRenderEndpoints:
    def test_render_home_200(self):
        r = requests.get(f"{API}/seo/render/home", timeout=30)
        assert r.status_code == 200
        assert "<title>" in r.text
        assert "Income Online" in r.text

    def test_render_donate_200(self):
        r = requests.get(f"{API}/seo/render/donate", timeout=30)
        assert r.status_code == 200
        assert "<title>" in r.text
        assert "9.99" in r.text
