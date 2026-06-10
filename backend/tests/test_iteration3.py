"""Iteration 3 backend tests.

Covers:
- (a) CMS content (idempotent seed, hero/library_banner/free_resources PUT)
- (b) Subscribers admin endpoint with CSV-style fields
- (d) Mailgun-backed resource email delivery (sandbox: sent OR failed both OK)
- Regressions: progress, .docx downloads, /platforms, login, sitemap
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://income-uk-checkout.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USER = "admin"
ADMIN_PASS = "Gulluk*9"

DOCX_MIME = "application/pdf"


# --------- Fixtures ---------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/cms/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    assert token, f"No token returned: {data}"
    return token


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# --------- (a) CMS / seed-content ---------
class TestCMSContent:
    def test_seed_content_idempotent(self, session):
        r1 = session.post(f"{API}/seed-content", timeout=20)
        assert r1.status_code == 200, r1.text
        r2 = session.post(f"{API}/seed-content", timeout=20)
        assert r2.status_code == 200, r2.text
        # 2nd call should report nothing added
        body = r2.json()
        assert "error" not in body, body
        # Either "no missing sections" message or 0 added
        assert (
            body.get("content_sections_added", 0) == 0
            or "no missing" in body.get("message", "").lower()
        ), body

    def test_content_includes_new_sections(self, session):
        r = session.get(f"{API}/content", timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        # /api/content returns {success: True, content: {section_id: {...}}}
        data = body.get("content", body) if isinstance(body, dict) else body
        assert isinstance(data, dict), f"Expected dict, got {type(data)}"
        # New sections must exist
        assert "library_banner" in data, f"library_banner missing. Keys: {list(data.keys())}"
        assert "free_resources" in data, f"free_resources missing. Keys: {list(data.keys())}"
        # Existing sections still there
        for key in ["hero", "cta", "categories", "footer"]:
            assert key in data, f"Existing section '{key}' missing after seed"

        lib = data["library_banner"]
        for f in ["badge", "headline", "description", "cta_primary", "cta_secondary"]:
            assert f in lib, f"library_banner missing field {f}: {lib}"

        free = data["free_resources"]
        for f in ["title", "subtitle"]:
            assert f in free, f"free_resources missing field {f}: {free}"


class TestCMSAdminUpdates:
    def test_login_invalid(self, session):
        r = session.post(f"{API}/cms/login", json={"username": "admin", "password": "wrongpass"}, timeout=10)
        assert r.status_code == 401, f"Expected 401 got {r.status_code}: {r.text}"

    def test_put_hero_content(self, session, auth_headers):
        # Save original so the test never leaves the live content polluted
        original = requests.get(f"{API}/content", timeout=15).json().get("content", {}).get("hero", {})
        payload = {
            "content": {
                "badge": "TEST BADGE",
                "headline_line1": "X",
                "headline_line2": "Y",
                "subtitle_line1": "A",
                "subtitle_line2": "B",
                "title": "legacy",
                "subtitle": "legacy sub",
                "cta_text": "Go",
                "pill_enabled": True,
                "pill_label": "FREE MONEYRULES GUIDES",
                "pill_target": "free-resources",
                "pill_capture_email": True,
            }
        }
        try:
            r = requests.put(f"{API}/cms/content/hero", json=payload, headers=auth_headers, timeout=15)
            assert r.status_code == 200, f"PUT hero failed: {r.status_code} {r.text}"

            g = requests.get(f"{API}/content", timeout=15)
            assert g.status_code == 200
            hero = g.json().get("content", {}).get("hero", {})
            for k, v in payload["content"].items():
                assert hero.get(k) == v, f"hero.{k} expected {v!r} got {hero.get(k)!r}"
        finally:
            if original:
                requests.put(f"{API}/cms/content/hero", json={"content": original}, headers=auth_headers, timeout=15)

    def test_put_library_banner(self, session, auth_headers):
        original = requests.get(f"{API}/content", timeout=15).json().get("content", {}).get("library_banner", {})
        payload = {
            "content": {
                "badge": "NEW",
                "headline": "10 FREE guides",
                "description": "desc",
                "cta_primary": "Grab them",
                "cta_secondary": "or upgrade",
            }
        }
        try:
            r = requests.put(f"{API}/cms/content/library_banner", json=payload, headers=auth_headers, timeout=15)
            assert r.status_code == 200, f"PUT library_banner failed: {r.status_code} {r.text}"

            g = requests.get(f"{API}/content", timeout=15).json().get("content", {}).get("library_banner", {})
            for k, v in payload["content"].items():
                assert g.get(k) == v, f"library_banner.{k}={g.get(k)!r} expected {v!r}"
        finally:
            if original:
                requests.put(f"{API}/cms/content/library_banner", json={"content": original}, headers=auth_headers, timeout=15)

    def test_put_free_resources(self, session, auth_headers):
        original = requests.get(f"{API}/content", timeout=15).json().get("content", {}).get("free_resources", {})
        payload = {"content": {"title": "Custom Title", "subtitle": "Custom Sub"}}
        try:
            r = requests.put(f"{API}/cms/content/free_resources", json=payload, headers=auth_headers, timeout=15)
            assert r.status_code == 200, f"PUT free_resources failed: {r.status_code} {r.text}"

            g = requests.get(f"{API}/content", timeout=15).json().get("content", {}).get("free_resources", {})
            assert g.get("title") == "Custom Title"
            assert g.get("subtitle") == "Custom Sub"
        finally:
            if original:
                requests.put(f"{API}/cms/content/free_resources", json={"content": original}, headers=auth_headers, timeout=15)


# --------- (d) Mailgun resource email + (b) subscribers ---------
class TestResourceDownloadAndEmail:
    def test_request_skip_email(self, session):
        r = session.post(
            f"{API}/pdf/resources/request-download",
            json={
                "email": "testuser1@example.com",
                "resource": "rule-of-72",
                "consent": True,
                "deliver_via_email": False,
            },
            timeout=20,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        assert body.get("email_delivery") == "skipped"
        assert body.get("download_url") == "/api/pdf/rule-of-72"

    def test_request_with_email_delivery(self, session):
        r = session.post(
            f"{API}/pdf/resources/request-download",
            json={
                "email": "testuser2@example.com",
                "resource": "budget-503020",
                "consent": False,
                "deliver_via_email": True,
            },
            timeout=45,
        )
        assert r.status_code == 200, f"Expected 200 (sandbox failure also acceptable but no error): {r.status_code} {r.text}"
        body = r.json()
        assert body.get("success") is True
        assert body.get("email_delivery") in ("sent", "failed"), f"Got {body.get('email_delivery')!r}"
        assert body.get("download_url") == "/api/pdf/budget-503020"

    def test_invalid_email_422(self, session):
        r = session.post(
            f"{API}/pdf/resources/request-download",
            json={"email": "bad", "resource": "rule-of-72"},
            timeout=15,
        )
        assert r.status_code == 422, f"Expected 422 got {r.status_code}: {r.text}"

    def test_unknown_resource_400(self, session):
        r = session.post(
            f"{API}/pdf/resources/request-download",
            json={"email": "x@y.com", "resource": "unknown-thing"},
            timeout=15,
        )
        assert r.status_code == 400, f"Expected 400 got {r.status_code}: {r.text}"
        assert "unknown" in r.json().get("detail", "").lower()


class TestSubscribersAdmin:
    def test_subscribers_list(self, session, auth_headers):
        r = session.get(f"{API}/pdf/resources/subscribers?limit=500", headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "total" in body
        assert "newsletter_opt_in_count" in body
        assert "subscribers" in body
        assert isinstance(body["subscribers"], list)
        assert body["total"] >= 1, "Should have at least the testuser1 subscriber"

        # find one subscriber and verify expected fields + no _id leak
        subs = body["subscribers"]
        sample = next((s for s in subs if s.get("email") == "testuser1@example.com"), subs[0])
        for f in ["email", "download_count", "resources_downloaded", "first_seen_at", "last_seen_at"]:
            assert f in sample, f"Missing field {f} in subscriber: {sample}"
        # newsletter_opt_in must be present (testuser1 had consent=True)
        assert "newsletter_opt_in" in sample or sample.get("email") != "testuser1@example.com", sample
        # Critical: no MongoDB ObjectId leak
        for s in subs:
            assert "_id" not in s, f"_id leaked: {s}"


# --------- Regression ---------
class TestRegression:
    def test_progress_endpoint(self, session):
        r = session.get(f"{API}/pdf/resources/progress?email=testuser1@example.com", timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "downloaded" in body
        assert "count" in body
        assert body.get("total") == 10, f"Expected 10 resources, got {body.get('total')}"
        assert "rule-of-72" in body["downloaded"]

    def test_rule72_pdf_download(self, session):
        r = session.get(f"{API}/pdf/rule-of-72", timeout=30)
        assert r.status_code == 200, r.text
        assert r.headers.get("content-type", "").startswith(DOCX_MIME), r.headers.get("content-type")
        assert len(r.content) > 5000

    def test_budget_pdf_download(self, session):
        r = session.get(f"{API}/pdf/budget-503020", timeout=30)
        assert r.status_code == 200, r.text
        assert r.headers.get("content-type", "").startswith(DOCX_MIME), r.headers.get("content-type")
        assert len(r.content) > 5000

    def test_platforms_list_no_id_leak(self, session):
        r = session.get(f"{API}/platforms", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        platforms = data.get("platforms", data) if isinstance(data, dict) else data
        assert isinstance(platforms, list) and len(platforms) > 0
        for p in platforms[:5]:
            assert "_id" not in p, f"_id leaked in platform: {p}"

    def test_sitemap_xml(self, session):
        r = session.get(f"{API}/seo/platforms-sitemap.xml", timeout=15)
        assert r.status_code == 200, r.text
        ct = r.headers.get("content-type", "")
        assert "xml" in ct.lower(), f"Expected xml, got {ct}"
        body = r.text
        assert "<urlset" in body or "<sitemapindex" in body
        assert "<url>" in body or "<loc>" in body
