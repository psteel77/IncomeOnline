"""
Idempotent E-commerce catalogue reconciliation (requested 3 Jul 2026):
  - removes ALL duplicate "Poshmark" entries, and
  - upserts (by name) Amazon Associates, Etsy and Shopify under "E-commerce"
    in the same schema/style as existing platforms (Ruby Lane etc.), including
    a ~100-word UK "About" precis + paymentMethods + ukAvailable.

Safe to run repeatedly (upsert by name, no duplicates). Used both to seed the
preview DB and, via the admin endpoint, to reconcile production after deploy.
"""

CATEGORY = "E-commerce"

# Same field shape as existing platform docs + longDescription (like the 66 UK
# platforms) for the detail-page "About" card.
NEW_PLATFORMS = [
    {
        "name": "Amazon Associates",
        "category": CATEGORY,
        "description": "Amazon's affiliate programme — earn commission by promoting millions of products through your own unique referral links.",
        "earningsPotential": "£50 - £5,000+/month",
        "difficulty": "Medium",
        "rating": 4.3,
        "minPayout": "£25",
        "paymentMethods": ["Bank Transfer", "Amazon Gift Card", "Cheque"],
        "featured": False,
        "link": "https://affiliate-program.amazon.co.uk/",
        "ukAvailable": True,
        "longDescription": (
            "Amazon Associates is Amazon UK's affiliate marketing programme, letting you earn "
            "commission by recommending products to your audience. You create unique tracking "
            "links for any item on Amazon.co.uk and earn a percentage of qualifying sales made "
            "through them — ideal if you run a blog, YouTube channel, social account or website. "
            "Commission rates vary by product category, and earnings can be paid by bank transfer, "
            "Amazon gift card or cheque once you reach the threshold. It suits UK content creators "
            "and reviewers looking to monetise existing traffic. All commission is self-employment "
            "income and must be declared to HMRC. Actual earnings depend on your audience size, "
            "niche and how relevant your recommendations are."
        ),
    },
    {
        "name": "Etsy",
        "category": CATEGORY,
        "description": "Global marketplace for handmade, vintage and craft goods — open a UK shop and sell to millions of buyers.",
        "earningsPotential": "£100 - £8,000+/month",
        "difficulty": "Medium",
        "rating": 4.4,
        "minPayout": "£0",
        "paymentMethods": ["Bank Transfer (Etsy Payments)", "PayPal"],
        "featured": False,
        "link": "https://www.etsy.com/uk/sell",
        "ukAvailable": True,
        "longDescription": (
            "Etsy is one of the world's best-known marketplaces for handmade, vintage and craft "
            "supplies, and it is fully available to UK sellers. You open a shop, list your products "
            "with photos and descriptions, and reach a global audience of buyers actively looking "
            "for unique items. Etsy charges listing and transaction fees, and pays out to your UK "
            "bank account via Etsy Payments. It suits makers, artists, vintage sellers and small "
            "creative businesses wanting a low-barrier storefront without building their own website. "
            "As a self-employed seller you must report income to HMRC and may need to register for "
            "Self Assessment. Earnings depend on your niche, pricing, product quality and marketing."
        ),
    },
    {
        "name": "Shopify",
        "category": CATEGORY,
        "description": "Build your own fully branded online store and sell products directly to customers across the UK and worldwide.",
        "earningsPotential": "£200 - £20,000+/month",
        "difficulty": "Medium",
        "rating": 4.5,
        "minPayout": "£0",
        "paymentMethods": ["Bank Transfer", "Shopify Payments", "PayPal"],
        "featured": False,
        "link": "https://www.shopify.co.uk/",
        "ukAvailable": True,
        "longDescription": (
            "Shopify is a leading e-commerce platform that lets UK entrepreneurs build a fully "
            "branded online store without any technical expertise. You choose a theme, add your "
            "products, set up UK-friendly payment and shipping options, and sell directly to "
            "customers at home and abroad. Shopify charges a monthly subscription plus payment "
            "processing fees, and funds are paid into your UK bank account. It suits anyone serious "
            "about building a scalable retail or dropshipping business with full control over their "
            "brand. As a business owner you are responsible for declaring profits to HMRC and, once "
            "over the threshold, registering for VAT. Earnings vary widely based on products, "
            "marketing spend and demand."
        ),
    },
]


async def apply(db):
    """Idempotently reconcile the E-commerce catalogue. Returns a summary dict."""
    # 1) Remove every Poshmark entry (there were duplicates).
    removed = await db.platforms.delete_many({"name": {"$regex": "^poshmark$", "$options": "i"}})

    # 2) Upsert the three new platforms by name (no duplicates on re-run).
    upserted = []
    for p in NEW_PLATFORMS:
        existing = await db.platforms.find_one({"name": p["name"]})
        if existing:
            await db.platforms.update_one({"name": p["name"]}, {"$set": p})
            upserted.append({"name": p["name"], "action": "updated", "id": existing.get("id")})
        else:
            last = await db.platforms.find_one(sort=[("id", -1)])
            next_id = (last["id"] + 1) if last and isinstance(last.get("id"), int) else 1
            doc = {**p, "id": next_id}
            await db.platforms.insert_one(doc)
            upserted.append({"name": p["name"], "action": "created", "id": next_id})

    # 3) Recompute the E-commerce category count.
    count = await db.platforms.count_documents({"category": CATEGORY})
    await db.categories.update_one({"name": CATEGORY}, {"$set": {"count": count}})

    return {
        "poshmark_removed": removed.deleted_count,
        "platforms": upserted,
        "ecommerce_count": count,
    }
