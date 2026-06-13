"""
Regression tests for the UK platform directory audit (uk_audit.reconcile_uk_platforms).

These run against the live (preview/local) Mongo configured in backend/.env.
reconcile_uk_platforms is idempotent, so running the tests does not pollute data.
"""
import os
import asyncio
import pytest
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from uk_audit import reconcile_uk_platforms, NON_UK_REMOVE, UK_REPLACEMENTS  # noqa: E402


def _db():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    return client[os.environ["DB_NAME"]]


def test_reconcile_then_idempotent():
    async def run():
        db = _db()
        # First reconcile brings DB to the canonical UK state.
        first = await reconcile_uk_platforms(db)
        assert first["total_platforms"] >= 199
        assert first["non_uk_remaining"] == 0

        # Second run must be a pure no-op (proves idempotency).
        second = await reconcile_uk_platforms(db)
        assert second["removed_non_uk"] == 0
        assert second["removed_duplicates"] == 0
        assert second["added_uk_platforms"] == 0
        assert second["total_platforms"] == first["total_platforms"]
        assert second["non_uk_remaining"] == 0
        return second

    asyncio.run(run())


def test_no_non_uk_and_no_duplicates_in_db():
    async def run():
        db = _db()
        await reconcile_uk_platforms(db)
        # No platform may be flagged non-UK.
        assert await db.platforms.count_documents({"ukAvailable": False}) == 0
        # No removed name may remain.
        assert await db.platforms.count_documents(
            {"name": {"$in": list(NON_UK_REMOVE)}}
        ) == 0
        # No duplicate names (case-insensitive).
        docs = await db.platforms.find({}, {"name": 1}).to_list(1000)
        names = [d["name"].strip().lower() for d in docs]
        assert len(names) == len(set(names)), "duplicate platform names found"

    asyncio.run(run())


def test_uk_replacements_present():
    async def run():
        db = _db()
        await reconcile_uk_platforms(db)
        names = {
            d["name"].strip().lower()
            for d in await db.platforms.find({}, {"name": 1}).to_list(1000)
        }
        for tpl in UK_REPLACEMENTS:
            assert tpl["name"].strip().lower() in names, f"missing {tpl['name']}"

    asyncio.run(run())
