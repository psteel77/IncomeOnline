"""
Regression tests for the hardened PayPal register flow.

Covers the crash-safe / idempotent behaviour that does NOT require live PayPal
credentials:
  - a durable capture that failed fulfillment is reconcilable via the admin
    endpoint (grants access + marks fulfilled),
  - re-calling register-donor for an already-fulfilled order is a no-op
    (idempotent) and never re-hits PayPal,
  - the admin ledger surfaces captured-but-unfulfilled payments as
    "needs attention".

Run: cd /app/backend && python3 -m pytest tests/test_paypal_hardening.py -q
"""
import os
import uuid
import asyncio
import requests
import pytest
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
load_dotenv("/app/frontend/.env")

API = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/") + "/api"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

ADMIN = {"username": "admin", "password": "Gulluk*9"}


def _now():
    return datetime.now(timezone.utc).isoformat()


def _admin_token():
    r = requests.post(f"{API}/cms/login", json=ADMIN, timeout=20)
    r.raise_for_status()
    return r.json()["token"]


async def _seed(doc):
    c = AsyncIOMotorClient(MONGO_URL)
    await c[DB_NAME].paypal_payments.insert_one(doc)
    c.close()


async def _cleanup(order_ids, emails):
    c = AsyncIOMotorClient(MONGO_URL)
    db = c[DB_NAME]
    await db.paypal_payments.delete_many({"order_id": {"$in": order_ids}})
    await db.users.delete_many({"email": {"$in": emails}})
    c.close()


def test_reconcile_captured_but_failed_payment():
    order_id = "PYTEST_FAIL_" + uuid.uuid4().hex[:8]
    email = f"reconcile-{uuid.uuid4().hex[:6]}@example.com"
    asyncio.run(_seed({
        "order_id": order_id, "kind": "donation", "amount": "9.99", "currency": "GBP",
        "payer_email": email, "paypal_status": "COMPLETED",
        "fulfillment_status": "fulfillment_failed", "created_at": _now(), "recorded_at": _now(),
    }))
    try:
        token = _admin_token()
        h = {"Authorization": f"Bearer {token}"}

        # ledger flags it as needing attention
        lst = requests.get(f"{API}/admin/paypal-payments", headers=h, timeout=20).json()
        assert any(p["order_id"] == order_id for p in lst["needs_attention"])

        # one-click fulfil grants access + marks fulfilled
        r = requests.post(f"{API}/admin/paypal-payments/{order_id}/fulfill", headers=h, json={}, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["success"] is True

        # it is now a donor, and no longer needs attention
        donors = requests.get(f"{API}/admin/donors", headers=h, timeout=20).json()
        assert any(d["email"] == email for d in donors["donors"])
        lst2 = requests.get(f"{API}/admin/paypal-payments", headers=h, timeout=20).json()
        assert not any(p["order_id"] == order_id for p in lst2["needs_attention"])
    finally:
        asyncio.run(_cleanup([order_id], [email]))


def test_register_donor_idempotent_for_fulfilled_order():
    order_id = "PYTEST_FUL_" + uuid.uuid4().hex[:8]
    email = f"idem-{uuid.uuid4().hex[:6]}@example.com"
    asyncio.run(_seed({
        "order_id": order_id, "kind": "donation", "amount": "9.99", "currency": "GBP",
        "payer_email": email, "paypal_status": "COMPLETED",
        "fulfillment_status": "fulfilled", "created_at": _now(), "recorded_at": _now(),
    }))
    try:
        # No PayPal call happens because the order is already fulfilled.
        r = requests.post(f"{API}/paypal/register-donor", json={"order_id": order_id}, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["success"] is True
        assert body["email"] == email
        assert "already" in body["message"].lower()
    finally:
        asyncio.run(_cleanup([order_id], [email]))


def test_register_donor_requires_order_id():
    r = requests.post(f"{API}/paypal/register-donor", json={"order_id": ""}, timeout=20)
    assert r.status_code == 400


def test_admin_endpoints_require_auth():
    assert requests.get(f"{API}/admin/paypal-payments", timeout=20).status_code in (401, 403)
    assert requests.get(f"{API}/admin/donors", timeout=20).status_code in (401, 403)
