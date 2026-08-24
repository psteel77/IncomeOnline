"""
Pillar Series — 3-tier access model backend tests.
  Pillar 1      -> FREE
  Pillars 2-10  -> £9.99 basic member (any active subscription)
  Pillars 11-20 -> £14.99 Premium members only
"""
import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

BASIC_EMAIL = "basic-test@incomeonline.info"
PREMIUM_EMAIL = "premium-test@incomeonline.info"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    return s


@pytest.fixture(scope="session")
def admin_token(client):
    creds_path = Path("/app/memory/test_credentials.md")
    if not creds_path.exists():
        pytest.skip("missing test_credentials.md")
    r = client.post(f"{BASE_URL}/api/cms/login", json={"username": "admin", "password": "Gulluk*9"})
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    tok = r.json().get("token")
    assert isinstance(tok, str) and tok
    return tok


def _member_jwt(client, admin_token, email):
    r = client.post(
        f"{BASE_URL}/api/cms/get-verify-link",
        json={"email": email},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    if r.status_code != 200:
        pytest.fail(f"get-verify-link failed for {email}: {r.status_code} {r.text[:300]}")
    verify_url = r.json().get("verify_url")
    assert verify_url, f"no verify_url in response: {r.text[:300]}"
    vtoken = verify_url.split("token=")[-1]
    v = client.get(f"{BASE_URL}/api/auth/verify/{vtoken}")
    assert v.status_code == 200, v.text[:300]
    body = v.json()
    if not body.get("success") or not body.get("token"):
        pytest.fail(f"verify did not return JWT for {email}: {body}")
    return body["token"]


@pytest.fixture(scope="session")
def basic_jwt(client, admin_token):
    return _member_jwt(client, admin_token, BASIC_EMAIL)


@pytest.fixture(scope="session")
def premium_jwt(client, admin_token):
    return _member_jwt(client, admin_token, PREMIUM_EMAIL)


# --- metadata endpoint -------------------------------------------------
class TestPillarMetadata:
    def test_list_pillars(self, client):
        r = client.get(f"{BASE_URL}/api/pdf/pillars")
        assert r.status_code == 200
        pillars = r.json()["pillars"]
        assert len(pillars) == 20
        by_n = {p["n"]: p for p in pillars}
        assert by_n[1]["tier"] == "free"
        for n in range(2, 11):
            assert by_n[n]["tier"] == "basic", f"pillar {n} tier {by_n[n]['tier']}"
        for n in range(11, 21):
            assert by_n[n]["tier"] == "premium", f"pillar {n} tier {by_n[n]['tier']}"
        for p in pillars:
            assert isinstance(p["title"], str) and p["title"].strip()


# --- unauthenticated gating -------------------------------------------
class TestAnonymousAccess:
    def test_pillar_1_free(self, client):
        r = client.get(f"{BASE_URL}/api/pdf/pillar/1")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("application/pdf")
        assert r.content[:4] == b"%PDF"

    @pytest.mark.parametrize("n", [2, 5, 10])
    def test_basic_pillars_401(self, client, n):
        r = client.get(f"{BASE_URL}/api/pdf/pillar/{n}")
        assert r.status_code == 401, f"pillar {n} -> {r.status_code}"

    @pytest.mark.parametrize("n", [11, 15, 20])
    def test_premium_pillars_401(self, client, n):
        r = client.get(f"{BASE_URL}/api/pdf/pillar/{n}")
        assert r.status_code == 401, f"pillar {n} -> {r.status_code}"

    def test_invalid_pillar_404(self, client):
        assert client.get(f"{BASE_URL}/api/pdf/pillar/21").status_code == 404
        assert client.get(f"{BASE_URL}/api/pdf/pillar/0").status_code == 404

    def test_bad_token_401(self, client):
        r = client.get(f"{BASE_URL}/api/pdf/pillar/5", headers={"Authorization": "Bearer notatoken"})
        assert r.status_code == 401


# --- basic member ------------------------------------------------------
class TestBasicMember:
    def test_auth_check_not_premium(self, client, basic_jwt):
        r = client.get(f"{BASE_URL}/api/auth/check", headers={"Authorization": f"Bearer {basic_jwt}"})
        assert r.status_code == 200
        d = r.json()
        assert d["authenticated"] is True
        assert d["email"] == BASIC_EMAIL
        assert d.get("is_premium") is False

    @pytest.mark.parametrize("n", [1, 2, 5, 10])
    def test_can_download_1_to_10(self, client, basic_jwt, n):
        r = client.get(f"{BASE_URL}/api/pdf/pillar/{n}", headers={"Authorization": f"Bearer {basic_jwt}"})
        assert r.status_code == 200, f"pillar {n} -> {r.status_code} {r.text[:200]}"
        assert r.content[:4] == b"%PDF"

    @pytest.mark.parametrize("n", [11, 15, 20])
    def test_blocked_from_premium(self, client, basic_jwt, n):
        r = client.get(f"{BASE_URL}/api/pdf/pillar/{n}", headers={"Authorization": f"Bearer {basic_jwt}"})
        assert r.status_code == 403, f"pillar {n} -> {r.status_code}"
        assert "Premium" in r.json().get("detail", "")


# --- premium member ----------------------------------------------------
class TestPremiumMember:
    def test_auth_check_premium(self, client, premium_jwt):
        r = client.get(f"{BASE_URL}/api/auth/check", headers={"Authorization": f"Bearer {premium_jwt}"})
        assert r.status_code == 200
        d = r.json()
        assert d["authenticated"] is True
        assert d["email"] == PREMIUM_EMAIL
        assert d.get("is_premium") is True

    @pytest.mark.parametrize("n", list(range(1, 21)))
    def test_can_download_all(self, client, premium_jwt, n):
        r = client.get(f"{BASE_URL}/api/pdf/pillar/{n}", headers={"Authorization": f"Bearer {premium_jwt}"})
        assert r.status_code == 200, f"pillar {n} -> {r.status_code} {r.text[:200]}"
        assert r.content[:4] == b"%PDF"
        assert "Content-Disposition" in r.headers


# --- legacy routes -----------------------------------------------------
class TestLegacyRoutes:
    def test_legacy_pillar_1(self, client):
        r = client.get(f"{BASE_URL}/api/pdf/pillar-1")
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"

    def test_legacy_pillar_2_requires_member(self, client):
        assert client.get(f"{BASE_URL}/api/pdf/pillar-2").status_code == 401

    def test_legacy_pillar_2_member_ok(self, client, basic_jwt):
        r = client.get(f"{BASE_URL}/api/pdf/pillar-2", headers={"Authorization": f"Bearer {basic_jwt}"})
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"
