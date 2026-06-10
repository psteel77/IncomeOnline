"""
Backend tests for the Wealth Generator Guides feature.
Covers public read, admin CRUD, auth gating, SEO render + sitemap, and
the AI-draft endpoint's cheap validation path (no real LLM call).
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://income-uk-checkout.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_USER, ADMIN_PASS = "admin", "Gulluk*9"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth(session):
    r = session.post(f"{API}/cms/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


class TestPublicGuides:
    def test_list_published(self, session):
        r = session.get(f"{API}/guides")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "guides" in d and "categories" in d
        assert d["count"] >= 3  # seeded starters
        for g in d["guides"]:
            assert g["status"] == "published"
            assert "content" not in g  # list is lightweight

    def test_get_single_seeded(self, session):
        slug = "isa-vs-sipp-where-should-uk-savers-put-their-money"
        r = session.get(f"{API}/guides/{slug}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["guide"]["slug"] == slug
        assert len(d["guide"]["content"]) > 500
        assert isinstance(d["related"], list)

    def test_get_missing_404(self, session):
        r = session.get(f"{API}/guides/this-does-not-exist-xyz")
        assert r.status_code == 404


class TestAuthGating:
    def test_admin_all_requires_auth(self, session):
        assert session.get(f"{API}/guides/admin/all").status_code in (401, 403)

    def test_create_requires_auth(self, session):
        r = session.post(f"{API}/guides", json={"title": "x"})
        assert r.status_code in (401, 403)

    def test_generate_draft_requires_auth(self, session):
        r = session.post(f"{API}/guides/generate-draft", json={"topic": "x"})
        assert r.status_code in (401, 403)

    def test_generate_draft_empty_topic_400(self, session, auth):
        # cheap validation path — must reject before any LLM call
        r = session.post(f"{API}/guides/generate-draft", json={"topic": ""}, headers=auth)
        assert r.status_code == 400, r.text


class TestAdminCrud:
    def test_full_lifecycle(self, session, auth):
        title = f"TEST Guide {uuid.uuid4().hex[:8]}"
        # create draft
        r = session.post(f"{API}/guides", headers=auth, json={
            "title": title, "category": "Side Hustles",
            "excerpt": "test excerpt", "content": "## Hello\n\nThis is a **test** guide body.",
            "tags": ["test", "qa"], "status": "draft",
        })
        assert r.status_code == 200, r.text
        guide = r.json()["guide"]
        gid, slug = guide["id"], guide["slug"]

        # draft NOT visible publicly
        assert session.get(f"{API}/guides/{slug}").status_code == 404
        # but visible to admin via get
        g = session.get(f"{API}/guides/admin/get/{gid}", headers=auth)
        assert g.status_code == 200 and g.json()["guide"]["title"] == title

        # publish via update
        r = session.put(f"{API}/guides/{gid}", headers=auth, json={
            "title": title, "category": "Side Hustles", "excerpt": "test excerpt",
            "content": "## Hello\n\nUpdated body.", "tags": ["test"], "status": "published",
        })
        assert r.status_code == 200, r.text

        # now public
        pub = session.get(f"{API}/guides/{slug}")
        assert pub.status_code == 200
        assert pub.json()["guide"]["status"] == "published"

        # PATCH status to draft must NOT blank content
        p = session.patch(f"{API}/guides/{gid}/status", headers=auth, json={"status": "draft"})
        assert p.status_code == 200, p.text
        admin_doc = session.get(f"{API}/guides/admin/get/{gid}", headers=auth).json()["guide"]
        assert admin_doc["status"] == "draft"
        assert "Updated body." in admin_doc["content"], "content was blanked by status toggle"
        # and back to published
        p2 = session.patch(f"{API}/guides/{gid}/status", headers=auth, json={"status": "published"})
        assert p2.status_code == 200

        # delete
        d = session.delete(f"{API}/guides/{gid}", headers=auth)
        assert d.status_code == 200
        assert session.get(f"{API}/guides/{slug}").status_code == 404


class TestGuidesSEO:
    def test_sitemap(self, session):
        r = session.get(f"{API}/seo/guides-sitemap.xml")
        assert r.status_code == 200
        assert "application/xml" in r.headers.get("content-type", "")
        assert "/guides" in r.text and "<urlset" in r.text

    def test_render_guide(self, session):
        slug = "isa-vs-sipp-where-should-uk-savers-put-their-money"
        r = session.get(f"{API}/seo/render/guide/{slug}")
        assert r.status_code == 200
        body = r.text
        assert 'lang="en-GB"' in body
        assert "BlogPosting" in body
        assert 'hreflang="en-gb"' in body

    def test_render_guides_index(self, session):
        r = session.get(f"{API}/seo/render/guides")
        assert r.status_code == 200
        assert "Wealth Generator Guides" in r.text
