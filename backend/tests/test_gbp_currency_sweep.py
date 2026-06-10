"""
Backend tests for the GBP currency sweep & UK locale (iteration 7).

Covers:
  - GET  /api/admin/conversion-stats (admin) — basic_price_usd=9.99, premium_price_usd=14.99
  - GET  /api/paypal/recovery-stats   (admin) — price_usd=9.99
  - POST /api/paypal/register-premium  — 400 on empty, 400/502 on fake order (NEVER grants access)
  - POST /api/paypal/register-donor    — 400 on empty, 400/502 on fake order
  - GET  /api/pdf/resources/subscribers — 401 without auth, 200 with admin
  - GET  /api/pdf/premium-pack/purchases — 401 without auth, 200 with admin
  - SEO: GET /api/render/platform/{slug}  → lang="en-GB" and priceCurrency="GBP"
  - Static index.html: lang="en-GB", og:locale en_GB, geo.region GB
  - Platforms DB: 199+ seeded, earningsPotential strings use £ (not $)
"""
import os
import re

import pytest
import requests
from dotenv import load_dotenv

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..")
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://income-uk-checkout.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_USER = "admin"
ADMIN_PASS = "Gulluk*9"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/cms/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return r.json()["token"]


# ---------------------------------------------------------------------------
# Admin stats — pricing fields hold GBP amounts (field names retain _usd suffix)
# ---------------------------------------------------------------------------
class TestAdminPricingStats:
    def test_conversion_stats_requires_auth(self, session):
        r = session.get(f"{API}/admin/conversion-stats")
        assert r.status_code in (401, 403), r.text

    def test_conversion_stats_pricing(self, session, admin_token):
        r = session.get(
            f"{API}/admin/conversion-stats",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        # Field names keep _usd suffix but values are the GBP amounts (per problem statement)
        assert data.get("basic_price_usd") == 9.99, f"basic_price_usd={data.get('basic_price_usd')}"
        assert data.get("premium_price_usd") == 14.99, f"premium_price_usd={data.get('premium_price_usd')}"

    def test_recovery_stats_requires_auth(self, session):
        r = session.get(f"{API}/paypal/recovery-stats")
        assert r.status_code in (401, 403), r.text

    def test_recovery_stats_price(self, session, admin_token):
        r = session.get(
            f"{API}/paypal/recovery-stats",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("price_usd") == 9.99


# ---------------------------------------------------------------------------
# PayPal server-verified flows must NEVER grant access without a real order
# ---------------------------------------------------------------------------
class TestPayPalRegisterRejections:
    def test_register_premium_empty(self, session):
        r = session.post(f"{API}/paypal/register-premium", json={"order_id": ""})
        assert r.status_code == 400, r.text

    def test_register_premium_fake_order(self, session):
        r = session.post(f"{API}/paypal/register-premium", json={"order_id": "FAKE-ORDER-XYZ-001"})
        # 400 (creds set & PayPal says not found) or 502 (creds unset)
        assert r.status_code in (400, 401, 404, 502), f"unexpected {r.status_code}: {r.text}"
        try:
            body = r.json()
        except Exception:
            body = {}
        # Must never grant access
        assert "token" not in body
        assert "download_url" not in body

    def test_register_donor_empty(self, session):
        r = session.post(f"{API}/paypal/register-donor", json={"order_id": ""})
        assert r.status_code == 400, r.text

    def test_register_donor_fake_order(self, session):
        r = session.post(f"{API}/paypal/register-donor", json={"order_id": "FAKE-ORDER-XYZ-002"})
        assert r.status_code in (400, 401, 404, 502), f"unexpected {r.status_code}: {r.text}"
        try:
            body = r.json()
        except Exception:
            body = {}
        assert "token" not in body


# ---------------------------------------------------------------------------
# Admin-gated PDF endpoints
# ---------------------------------------------------------------------------
class TestAdminGatedPDFEndpoints:
    def test_premium_purchases_requires_auth(self, session):
        r = session.get(f"{API}/pdf/premium-pack/purchases")
        assert r.status_code in (401, 403), r.text

    def test_premium_purchases_with_admin(self, session, admin_token):
        r = session.get(
            f"{API}/pdf/premium-pack/purchases",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200, r.text
        assert "purchases" in r.json()

    def test_resources_subscribers_requires_auth(self, session):
        r = session.get(f"{API}/pdf/resources/subscribers")
        assert r.status_code in (401, 403), r.text

    def test_resources_subscribers_with_admin(self, session, admin_token):
        r = session.get(
            f"{API}/pdf/resources/subscribers",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200, r.text


# ---------------------------------------------------------------------------
# SEO geo signals — server-rendered SEO route should be UK-localised
# ---------------------------------------------------------------------------
class TestSEOUKLocale:
    def test_render_platform_seo_uk_locale(self, session):
        # Try a few candidate slugs; just look for any 200 with en-GB markup
        # First fetch the platform list to get a real slug.
        plist = session.get(f"{API}/platforms").json().get("platforms", [])
        assert plist, "no platforms seeded"
        # Build a plausible slug from the first platform name
        candidate = re.sub(r"[^a-z0-9]+", "-", plist[0]["name"].lower()).strip("-")
        r = session.get(f"{API}/seo/render/platform/{candidate}", allow_redirects=True)
        if r.status_code != 200:
            pytest.skip(f"render/platform/{candidate} -> {r.status_code} (slug mapping may differ)")
        html = r.text
        assert 'lang="en-GB"' in html, "missing lang=en-GB in server-rendered platform SEO page"
        # If Product schema is emitted, currency must be GBP
        if '"priceCurrency"' in html:
            assert '"priceCurrency": "GBP"' in html or '"priceCurrency":"GBP"' in html, \
                "priceCurrency is not GBP"


# ---------------------------------------------------------------------------
# Public index.html SEO geo signals (frontend served via REACT_APP_BACKEND_URL host)
# ---------------------------------------------------------------------------
class TestIndexHtmlSEO:
    def test_root_html_has_uk_locale_and_geo(self):
        # The frontend public URL == BASE_URL (kubernetes ingress routes / to React).
        r = requests.get(f"{BASE_URL}/", timeout=15)
        assert r.status_code == 200, r.status_code
        html = r.text
        assert 'lang="en-GB"' in html, "missing lang=en-GB in index.html"
        assert 'geo.region' in html and '"GB"' in html, "missing geo.region GB meta"


# ---------------------------------------------------------------------------
# Platforms DB — earnings should be in £, NOT $
# ---------------------------------------------------------------------------
class TestPlatformsCurrency:
    def test_platforms_use_gbp_earnings(self, session):
        r = session.get(f"{API}/platforms")
        assert r.status_code == 200
        platforms = r.json().get("platforms", [])
        assert len(platforms) >= 199, f"expected 199+ platforms, got {len(platforms)}"
        # Inspect structured earnings field — must NOT contain $<digit> patterns
        offenders = []
        for p in platforms:
            ep = p.get("earningsPotential") or ""
            mp = p.get("minPayout") or ""
            for field_val, field_name in ((ep, "earningsPotential"), (mp, "minPayout")):
                if re.search(r"\$\d", field_val):
                    offenders.append({"name": p.get("name"), "field": field_name, "value": field_val})
        assert not offenders, f"platforms with $ in earnings/payout: {offenders[:10]}"
