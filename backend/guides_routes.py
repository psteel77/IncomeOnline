"""
Wealth Generator Guides — blog/article system for SEO & organic UK traffic.

- Public:  GET /api/guides            (published list, lightweight)
           GET /api/guides/{slug}     (single published article)
- Admin:   GET /api/guides/admin/all  (all incl. drafts)
           POST /api/guides           (create)
           PUT /api/guides/{guide_id} (update)
           DELETE /api/guides/{guide_id}
           POST /api/guides/generate-draft  (AI-assisted draft via Emergent LLM key)

Content is stored as Markdown. Articles are written for the UK market
(British English, £, ISAs/SIPPs/HMRC context).
"""
import os
import re
import uuid
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from cms_routes import get_admin_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/guides")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
GUIDE_CATEGORIES = [
    "Side Hustles", "Freelancing", "Passive Income", "Saving & Budgeting",
    "Investing", "Tax & ISAs", "Getting Started",
]


def _slugify(text: str) -> str:
    s = (text or "").lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:80] or uuid.uuid4().hex[:8]


def _read_minutes(content: str) -> int:
    words = len(re.findall(r"\w+", content or ""))
    return max(1, round(words / 200))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _unique_slug(db, base: str, exclude_id: str | None = None) -> str:
    slug = base
    i = 2
    while True:
        existing = await db.guides.find_one({"slug": slug})
        if not existing or existing.get("id") == exclude_id:
            return slug
        slug = f"{base}-{i}"
        i += 1


class GuideIn(BaseModel):
    title: str
    content: str = ""            # Markdown body
    excerpt: str = ""
    meta_description: str = ""
    category: str = "Getting Started"
    tags: list[str] = Field(default_factory=list)
    hero_image: str = ""
    author: str = "Income Online"
    status: str = "draft"        # draft | published


class DraftRequest(BaseModel):
    topic: str
    category: str = "Getting Started"


def _card(doc: dict) -> dict:
    """Lightweight projection for list cards (no full content)."""
    return {
        "id": doc.get("id"),
        "slug": doc.get("slug"),
        "title": doc.get("title"),
        "excerpt": doc.get("excerpt"),
        "category": doc.get("category"),
        "tags": doc.get("tags", []),
        "hero_image": doc.get("hero_image"),
        "author": doc.get("author"),
        "status": doc.get("status"),
        "read_minutes": doc.get("read_minutes"),
        "published_at": doc.get("published_at"),
        "updated_at": doc.get("updated_at"),
    }


# --------------------------------------------------------------------------
# Public endpoints
# --------------------------------------------------------------------------
@router.get("")
async def list_published_guides(category: str | None = None, limit: int = 100):
    from server import db
    query = {"status": "published"}
    if category and category != "All":
        query["category"] = category
    docs = await db.guides.find(query, {"_id": 0}).sort("published_at", -1).to_list(max(1, min(limit, 200)))
    cats = await db.guides.distinct("category", {"status": "published"})
    return {"guides": [_card(d) for d in docs], "count": len(docs), "categories": sorted(cats)}


@router.get("/admin/all")
async def list_all_guides(admin: str = Depends(get_admin_user), limit: int = 300):
    from server import db
    docs = await db.guides.find({}, {"_id": 0}).sort("updated_at", -1).to_list(max(1, min(limit, 500)))
    return {"guides": [_card(d) for d in docs], "count": len(docs)}


@router.get("/admin/get/{guide_id}")
async def admin_get_guide(guide_id: str, admin: str = Depends(get_admin_user)):
    """Full guide (incl. drafts) for the admin editor."""
    from server import db
    doc = await db.guides.find_one({"id": guide_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Guide not found")
    return {"guide": doc}


@router.post("/generate-draft")
async def generate_guide_draft(payload: DraftRequest, admin: str = Depends(get_admin_user)):
    """AI-assisted draft for a UK-focused guide. Returns fields to populate the editor."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="AI key not configured (EMERGENT_LLM_KEY).")

    topic = (payload.topic or "").strip()
    if not topic:
        raise HTTPException(status_code=400, detail="A topic is required.")

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    system_message = (
        "You are an expert UK personal-finance and 'make money online' writer for Income Online, "
        "a UK website. Always write in British English (en-GB), use £ (GBP) for all amounts, and "
        "ground advice in the UK context (ISAs, SIPPs, HMRC/self-assessment, Personal Allowance, "
        "Premium Bonds, Universal Credit where relevant). Be practical, accurate, encouraging and "
        "SEO-aware. Never invent statistics or guarantee earnings; add sensible caveats."
    )
    prompt = (
        f"Write a high-quality blog guide for UK readers on the topic: \"{topic}\".\n"
        f"Suggested category: {payload.category}.\n\n"
        "Return STRICT JSON ONLY (no markdown fences, no commentary) with exactly these keys:\n"
        '{\n'
        '  "title": "compelling, UK-flavoured, <=70 chars",\n'
        '  "meta_description": "SEO meta description, <=155 chars",\n'
        '  "excerpt": "1-2 sentence summary for the card, <=200 chars",\n'
        '  "category": "one of: ' + ", ".join(GUIDE_CATEGORIES) + '",\n'
        '  "tags": ["3-6 short lowercase tags"],\n'
        '  "content": "the full article in Markdown, 700-1100 words. Use ## and ### headings, short paragraphs, bullet lists and a brief conclusion. Do NOT repeat the title as an H1 at the top."\n'
        '}'
    )

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message=system_message,
        ).with_model("anthropic", "claude-sonnet-4-6")
        raw = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logger.exception("AI draft generation failed")
        raise HTTPException(status_code=502, detail=f"AI generation failed: {str(e)[:200]}")

    text = (raw or "").strip()
    # Strip accidental code fences
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text).strip()
    try:
        data = json.loads(text)
    except Exception:
        # Fallback: dump the raw text as content so nothing is lost
        data = {
            "title": topic,
            "meta_description": "",
            "excerpt": "",
            "category": payload.category,
            "tags": [],
            "content": text,
        }

    return {
        "title": data.get("title", topic),
        "meta_description": (data.get("meta_description") or "")[:160],
        "excerpt": (data.get("excerpt") or "")[:240],
        "category": data.get("category") or payload.category,
        "tags": data.get("tags") or [],
        "content": data.get("content") or "",
    }


@router.get("/{slug}")
async def get_published_guide(slug: str):
    from server import db
    doc = await db.guides.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Guide not found")
    # Related: same category, then others
    related = await db.guides.find(
        {"status": "published", "slug": {"$ne": slug}, "category": doc.get("category")},
        {"_id": 0},
    ).sort("published_at", -1).to_list(3)
    if len(related) < 3:
        more = await db.guides.find(
            {"status": "published", "slug": {"$ne": slug}, "category": {"$ne": doc.get("category")}},
            {"_id": 0},
        ).sort("published_at", -1).to_list(3 - len(related))
        related += more
    return {"guide": doc, "related": [_card(r) for r in related]}


# --------------------------------------------------------------------------
# Admin write endpoints
# --------------------------------------------------------------------------
@router.post("")
async def create_guide(payload: GuideIn, admin: str = Depends(get_admin_user)):
    from server import db
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    now = _now()
    slug = await _unique_slug(db, _slugify(title))
    doc = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        "title": title,
        "content": payload.content,
        "excerpt": payload.excerpt.strip(),
        "meta_description": payload.meta_description.strip(),
        "category": payload.category,
        "tags": [t.strip() for t in payload.tags if t.strip()],
        "hero_image": payload.hero_image.strip(),
        "author": payload.author.strip() or "Income Online",
        "status": "published" if payload.status == "published" else "draft",
        "read_minutes": _read_minutes(payload.content),
        "created_at": now,
        "updated_at": now,
        "published_at": now if payload.status == "published" else None,
    }
    await db.guides.insert_one(doc.copy())
    doc.pop("_id", None)
    return {"success": True, "guide": {k: v for k, v in doc.items() if k != "_id"}}


@router.put("/{guide_id}")
async def update_guide(guide_id: str, payload: GuideIn, admin: str = Depends(get_admin_user)):
    from server import db
    existing = await db.guides.find_one({"id": guide_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Guide not found")

    title = payload.title.strip() or existing["title"]
    slug = existing["slug"]
    if _slugify(title) != _slugify(existing["title"]):
        slug = await _unique_slug(db, _slugify(title), exclude_id=guide_id)

    now = _now()
    new_status = "published" if payload.status == "published" else "draft"
    published_at = existing.get("published_at")
    if new_status == "published" and not published_at:
        published_at = now
    if new_status == "draft":
        published_at = None

    update = {
        "title": title,
        "slug": slug,
        "content": payload.content,
        "excerpt": payload.excerpt.strip(),
        "meta_description": payload.meta_description.strip(),
        "category": payload.category,
        "tags": [t.strip() for t in payload.tags if t.strip()],
        "hero_image": payload.hero_image.strip(),
        "author": payload.author.strip() or "Income Online",
        "status": new_status,
        "read_minutes": _read_minutes(payload.content),
        "updated_at": now,
        "published_at": published_at,
    }
    await db.guides.update_one({"id": guide_id}, {"$set": update})
    return {"success": True, "id": guide_id, "slug": slug, "status": new_status}


class StatusUpdate(BaseModel):
    status: str


@router.patch("/{guide_id}/status")
async def set_guide_status(guide_id: str, payload: StatusUpdate, admin: str = Depends(get_admin_user)):
    """Flip publish status only — never touches the article content."""
    from server import db
    existing = await db.guides.find_one({"id": guide_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Guide not found")
    new_status = "published" if payload.status == "published" else "draft"
    now = _now()
    published_at = existing.get("published_at")
    if new_status == "published" and not published_at:
        published_at = now
    if new_status == "draft":
        published_at = None
    await db.guides.update_one(
        {"id": guide_id},
        {"$set": {"status": new_status, "published_at": published_at, "updated_at": now}},
    )
    return {"success": True, "id": guide_id, "status": new_status}


@router.delete("/{guide_id}")
async def delete_guide(guide_id: str, admin: str = Depends(get_admin_user)):
    from server import db
    res = await db.guides.delete_one({"id": guide_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Guide not found")
    return {"success": True, "deleted": guide_id}
