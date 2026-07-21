"""Backend tests for the Pillar Series feature (Pillar 1 free, Pillar 2 members-only)."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://moneytools-uk.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_USER = "admin"
ADMIN_PASS = "Gulluk*9"
MEMBER_EMAIL = "pillartest@incomeonline.info"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/cms/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def member_token(admin_token):
    """Get a fresh member auth_token via /verify?token=..."""
    r = requests.post(
        f"{API}/cms/get-verify-link",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"email": MEMBER_EMAIL},
        timeout=15,
    )
    assert r.status_code == 200, f"get-verify-link failed: {r.status_code} {r.text}"
    data = r.json()
    verify_url = data.get("verify_url") or data.get("verifyUrl")
    assert verify_url, f"no verify_url in response: {data}"
    # Extract token from URL like /verify?token=XXX or /verify/XXX
    if "token=" in verify_url:
        vtoken = verify_url.split("token=")[1].split("&")[0]
    else:
        vtoken = verify_url.rstrip("/").split("/")[-1]

    # Hit the auth verify endpoint to convert into a JWT
    vr = requests.get(f"{API}/auth/verify/{vtoken}", timeout=15)
    assert vr.status_code == 200, f"auth/verify failed: {vr.status_code} {vr.text}"
    vdata = vr.json()
    jwt = vdata.get("token") or vdata.get("auth_token") or vdata.get("access_token")
    assert jwt, f"no jwt token in verify response: {vdata}"
    return jwt


# --- Pillar 1: FREE (no auth) ---
def test_pillar_1_public_returns_pdf():
    r = requests.get(f"{API}/pdf/pillar-1", timeout=30, allow_redirects=True)
    assert r.status_code == 200, f"expected 200, got {r.status_code}"
    assert "application/pdf" in r.headers.get("content-type", "").lower()
    assert len(r.content) > 1000


# --- Pillar 2: MEMBERS ONLY ---
def test_pillar_2_no_auth_returns_401():
    r = requests.get(f"{API}/pdf/pillar-2", timeout=15, allow_redirects=False)
    assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text[:200]}"


def test_pillar_2_bogus_bearer_returns_401_not_500():
    r = requests.get(
        f"{API}/pdf/pillar-2",
        headers={"Authorization": "Bearer this-is-not-a-real-jwt"},
        timeout=15,
        allow_redirects=False,
    )
    assert r.status_code == 401, f"expected 401 (must not be 500), got {r.status_code}: {r.text[:200]}"


def test_pillar_2_malformed_auth_header_returns_401():
    r = requests.get(
        f"{API}/pdf/pillar-2",
        headers={"Authorization": "NotBearer xxx"},
        timeout=15,
        allow_redirects=False,
    )
    assert r.status_code == 401


def test_pillar_2_with_valid_member_token_returns_pdf(member_token):
    r = requests.get(
        f"{API}/pdf/pillar-2",
        headers={"Authorization": f"Bearer {member_token}"},
        timeout=30,
        allow_redirects=True,
    )
    assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text[:300]}"
    assert "application/pdf" in r.headers.get("content-type", "").lower()
    assert len(r.content) > 1000
