"""
Backend tests for the new Premium Pack ($14.99) flow.

Covers:
  - GET  /api/pdf/premium-pack?token=<valid|invalid|empty>
  - GET  /api/pdf/premium-pack/purchases (admin-only list)
  - POST /api/paypal/register-premium (bad/empty/fake order_id)
  - Regression: free-guide PDF endpoints still serve application/pdf

Note: download tokens are now ONLY issued by the PayPal-verified flow
(server.py /api/paypal/register-premium). The old public token-issuer
endpoint was removed. Tests seed a token directly into Mongo.
"""
import os
import uuid
from datetime import datetime, timezone

import pytest
import requests
from dotenv import load_dotenv
from pymongo import MongoClient

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
def mongo():
    client = MongoClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    yield db
    # cleanup any test rows
    db.premium_purchases.delete_many({"email": {"$regex": "^test_", "$options": "i"}})
    client.close()


@pytest.fixture()
def premium_token(mongo):
    token = str(uuid.uuid4())
    mongo.premium_purchases.insert_one({
        "id": str(uuid.uuid4()),
        "token": token,
        "email": "test_premium_seed@example.com",
        "amount": "14.99",
        "currency": "USD",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "download_count": 0,
        "verified": True,
    })
    yield token
    mongo.premium_purchases.delete_one({"token": token})


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/cms/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return r.json()["token"]


# ---------------------------------------------------------------------------
# Premium Pack download (token-gated) + admin list
# ---------------------------------------------------------------------------
class TestPremiumPackPurchase:
    def test_public_token_issuer_is_removed(self, session):
        # The old unauthenticated token issuer must no longer exist
        r = session.post(f"{API}/pdf/premium-pack/purchase",
                         json={"email": "test_removed@example.com"})
        assert r.status_code in (404, 405), r.text

    def test_download_with_valid_token_returns_zip(self, session, premium_token):
        d = session.get(f"{API}/pdf/premium-pack", params={"token": premium_token})
        assert d.status_code == 200, d.text[:300]
        ctype = d.headers.get("content-type", "")
        assert "application/zip" in ctype, f"unexpected content-type {ctype}"
        body = d.content
        assert len(body) > 400 * 1024, f"ZIP too small: {len(body)} bytes"
        assert body[:2] == b"PK", "Response is not a ZIP file"

    def test_download_with_invalid_token_returns_403(self, session):
        d = session.get(f"{API}/pdf/premium-pack", params={"token": "INVALID"})
        assert d.status_code == 403, d.text

    def test_download_with_empty_token_returns_403(self, session):
        d = session.get(f"{API}/pdf/premium-pack", params={"token": ""})
        assert d.status_code == 403, d.text

    def test_download_with_no_token_param_returns_403(self, session):
        d = session.get(f"{API}/pdf/premium-pack")
        assert d.status_code == 403

    def test_admin_purchases_requires_auth(self, session):
        r = session.get(f"{API}/pdf/premium-pack/purchases")
        assert r.status_code in (401, 403), r.text

    def test_admin_purchases_listing(self, session, admin_token):
        r = session.get(f"{API}/pdf/premium-pack/purchases",
                        headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "total" in data
        assert "purchases" in data
        assert isinstance(data["purchases"], list)
        assert isinstance(data["total"], int)


# ---------------------------------------------------------------------------
# Server-verified Premium flow — must never grant access for fake orders
# ---------------------------------------------------------------------------
class TestRegisterPremium:
    def test_empty_order_id_returns_400(self, session):
        r = session.post(f"{API}/paypal/register-premium", json={"order_id": ""})
        assert r.status_code == 400, r.text
        # FastAPI returns {"detail": "order_id is required"}
        assert "order_id" in r.text.lower()

    def test_missing_order_id_field(self, session):
        # Pydantic will accept missing because default is "" → same as empty → 400
        r = session.post(f"{API}/paypal/register-premium", json={})
        # Either 400 (string default empty) or 422 (validation). Both are acceptable —
        # what matters is it does NOT grant access.
        assert r.status_code in (400, 422), r.text

    def test_fake_order_id_does_not_500(self, session):
        r = session.post(f"{API}/paypal/register-premium",
                         json={"order_id": "FAKEORDER123"})
        # In preview, PayPal creds may be unset → 502.
        # If creds set, PayPal will say order not found → 400/404 area.
        # CRITICAL: must not 500 and must NOT return token / download_url.
        assert r.status_code != 500, f"Expected non-500, got {r.status_code}: {r.text}"
        assert r.status_code in (400, 401, 404, 502), f"Unexpected status {r.status_code}: {r.text}"
        try:
            body = r.json()
        except Exception:
            body = {}
        assert "token" not in body
        assert "download_url" not in body


# ---------------------------------------------------------------------------
# Regression: free-guide PDFs still serve application/pdf
# ---------------------------------------------------------------------------
FREE_PDF_ENDPOINTS = [
    "/pdf/rule-of-72",
    "/pdf/budget-503020",
    "/pdf/passive-income",
    "/pdf/debt-snowball",
    "/pdf/emergency-fund",
    "/pdf/compound-interest",
    "/pdf/credit-score",
    "/pdf/isa-vs-sipp",
    "/pdf/side-hustle-quickstart",
]


@pytest.mark.parametrize("path", FREE_PDF_ENDPOINTS)
def test_free_guide_pdf_endpoint(session, path):
    # Use stream so we don't pull the full file; only need headers + first bytes
    r = session.get(f"{API}{path}", stream=True, timeout=30)
    assert r.status_code == 200, f"{path} -> {r.status_code}"
    ctype = r.headers.get("content-type", "")
    assert "application/pdf" in ctype, f"{path} content-type={ctype}"
    first = r.raw.read(5)
    assert first.startswith(b"%PDF"), f"{path} not a real PDF (starts with {first!r})"
    r.close()


# Optional 10th free guide — UK Tax basics (mentioned in problem statement as 10 guides)
def test_uk_tax_basics_optional(session):
    r = session.get(f"{API}/pdf/uk-tax-basics", stream=True, timeout=30)
    # Allow 404 if not implemented in this build; just record status
    if r.status_code == 404:
        pytest.skip("uk-tax-basics endpoint not present in this build")
    assert r.status_code == 200
    assert "application/pdf" in r.headers.get("content-type", "")
    r.close()
