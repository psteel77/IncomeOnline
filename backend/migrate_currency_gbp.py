"""
UK alignment: convert displayed currency from $ to £.

1. Source files (for future seeds): symbol-swap $ -> £ ONLY inside the
   `earningsPotential` and `minPayout` values of platform records in
   seed_data.py and server.py, and across success_stories_data.py
   (testimonial copy). Descriptive prose mentioning genuine third-party $
   amounts (e.g. "$80 million paid", "$5 signup bonus") is left untouched.

2. Live DB migration: swap $ -> £ in the `earningsPotential` and `minPayout`
   fields of every document in the `platforms` collection.

Run:  python migrate_currency_gbp.py            # source files + local DB
"""
import os
import re
import asyncio

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from motor.motor_asyncio import AsyncIOMotorClient

HERE = os.path.dirname(__file__)
FIELD_RE = re.compile(r'("(?:earningsPotential|minPayout)"\s*:\s*")([^"]*)"')


def _swap_fields(text: str) -> tuple[str, int]:
    count = 0

    def repl(m):
        nonlocal count
        val = m.group(2)
        if "$" in val:
            count += 1
            val = val.replace("$", "£")
        return m.group(1) + val + '"'

    return FIELD_RE.sub(repl, text), count


def migrate_source_file(path: str):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    new_text, n = _swap_fields(text)
    if new_text != text:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_text)
    print(f"  {os.path.basename(path)}: updated {n} earnings/payout fields")


def migrate_success_stories(path: str):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    n = text.count("$")
    new_text = text.replace("$", "£")
    if new_text != text:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_text)
    print(f"  success_stories_data.py: swapped {n} '$' -> '£'")


async def migrate_db():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    cursor = db.platforms.find({}, {"_id": 1, "earningsPotential": 1, "minPayout": 1})
    updated = 0
    async for doc in cursor:
        changes = {}
        for field in ("earningsPotential", "minPayout"):
            val = doc.get(field)
            if isinstance(val, str) and "$" in val:
                changes[field] = val.replace("$", "£")
        if changes:
            await db.platforms.update_one({"_id": doc["_id"]}, {"$set": changes})
            updated += 1
    total = await db.platforms.count_documents({})
    client.close()
    print(f"  platforms DB: updated {updated} of {total} documents")


def main():
    print("Source files:")
    migrate_source_file(os.path.join(HERE, "seed_data.py"))
    migrate_source_file(os.path.join(HERE, "server.py"))
    migrate_success_stories(os.path.join(HERE, "success_stories_data.py"))
    print("Database:")
    asyncio.run(migrate_db())
    print("Done.")


if __name__ == "__main__":
    main()
