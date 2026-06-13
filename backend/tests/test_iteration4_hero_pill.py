"""
Iteration 4 — Hero CMS pill + lead capture backend tests.

Covers:
- POST /api/leads/capture happy path (valid email, returns success, upserts subscriber)
- POST /api/leads/capture invalid-email rejection (422)
- Lead source is appended (lead_sources contains 'hero_pill') and newsletter_opt_in=True
- /api/content exposes the new hero pill_* CMS fields
- Admin can PUT /api/cms/sections/hero to update pill_label/pill_target/pill_enabled/pill_capture_email
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://moneytools-uk.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Gulluk*9"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/cms/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}, timeout=10)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------------------------- /api/leads/capture ----------------------------

class TestLeadsCapture:
    def test_capture_valid_email_returns_success(self, auth_headers):
        email = f"TEST_hero_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/leads/capture", json={"email": email, "source": "hero_pill"}, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True

        # Verify persistence via subscribers admin endpoint (admin-gated)
        time.sleep(0.2)
        sub = requests.get(f"{API}/pdf/resources/subscribers", headers=auth_headers, timeout=10)
        assert sub.status_code == 200, sub.text
        body = sub.json()
        # endpoint returns {success, subscribers:[...]} per iteration_3 notes
        subs = body.get("subscribers") if isinstance(body, dict) else body
        assert isinstance(subs, list)
        match = [s for s in subs if (s.get("email") or "").lower() == email.lower()]
        assert match, f"captured email {email} not present in subscribers list"
        row = match[0]
        assert row.get("newsletter_opt_in") is True
        assert "hero_pill" in (row.get("lead_sources") or [])

    def test_capture_invalid_email_rejected(self):
        r = requests.post(f"{API}/leads/capture", json={"email": "not-an-email", "source": "hero_pill"}, timeout=10)
        assert r.status_code == 422, f"expected 422 for invalid email, got {r.status_code}: {r.text}"

    def test_capture_missing_email_rejected(self):
        r = requests.post(f"{API}/leads/capture", json={"source": "hero_pill"}, timeout=10)
        assert r.status_code == 422

    def test_capture_idempotent_appends_source(self, auth_headers):
        email = f"TEST_hero_idem_{uuid.uuid4().hex[:6]}@example.com"
        # First capture with hero_pill
        r1 = requests.post(f"{API}/leads/capture", json={"email": email, "source": "hero_pill"}, timeout=10)
        assert r1.status_code == 200
        # Second capture with different source — should NOT duplicate row
        r2 = requests.post(f"{API}/leads/capture", json={"email": email, "source": "footer_form"}, timeout=10)
        assert r2.status_code == 200

        sub = requests.get(f"{API}/pdf/resources/subscribers", headers=auth_headers, timeout=10).json()
        subs = sub.get("subscribers") if isinstance(sub, dict) else sub
        rows = [s for s in subs if (s.get("email") or "").lower() == email.lower()]
        assert len(rows) == 1, f"expected single subscriber row after upsert, got {len(rows)}"
        sources = rows[0].get("lead_sources") or []
        assert "hero_pill" in sources and "footer_form" in sources


# ---------------------------- /api/content hero pill_* ----------------------------

class TestContentHeroPillFields:
    def test_content_exposes_hero_pill_fields(self):
        r = requests.get(f"{API}/content", timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        content = body.get("content", body)
        hero = content.get("hero") or {}
        # All four CMS-editable pill fields must be present
        for key in ("pill_enabled", "pill_label", "pill_target", "pill_capture_email"):
            assert key in hero, f"hero.{key} missing from /api/content; hero keys = {list(hero.keys())}"


# ---------------------------- Admin update hero pill ----------------------------

class TestAdminHeroPillUpdate:
    def _get_hero(self):
        r = requests.get(f"{API}/content", timeout=10)
        content = r.json().get("content", {})
        return content.get("hero") or {}

    def test_admin_can_update_hero_pill_fields(self, auth_headers):
        original = self._get_hero()
        # Test payload — mutate all four fields
        custom_label = f"TEST Grab My Guides {uuid.uuid4().hex[:4]}"
        payload = {
            **{k: v for k, v in original.items() if k not in ("_id",)},
            "pill_enabled": True,
            "pill_label": custom_label,
            "pill_target": "support",
            "pill_capture_email": True,
        }
        r = requests.put(f"{API}/cms/content/hero", json={"content": payload}, headers=auth_headers, timeout=10)
        assert r.status_code == 200, f"PUT /cms/content/hero failed: {r.status_code} {r.text}"

        # Re-fetch and validate persisted
        time.sleep(0.2)
        hero_after = self._get_hero()
        assert hero_after.get("pill_label") == custom_label
        assert hero_after.get("pill_target") == "support"
        assert hero_after.get("pill_capture_email") is True
        assert hero_after.get("pill_enabled") is True

        # Restore to sensible defaults so frontend tests + final state are clean
        restore = {
            **{k: v for k, v in hero_after.items() if k not in ("_id",)},
            "pill_enabled": True,
            "pill_label": "Free MoneyRules Guides",
            "pill_target": "free-resources",
            "pill_capture_email": False,
        }
        r2 = requests.put(f"{API}/cms/content/hero", json={"content": restore}, headers=auth_headers, timeout=10)
        assert r2.status_code == 200

    def test_admin_update_requires_auth(self):
        r = requests.put(f"{API}/cms/content/hero", json={"pill_label": "no auth"}, timeout=10)
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}"
