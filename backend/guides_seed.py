"""
Starter "Wealth Generator Guides" — UK-focused seed articles (idempotent).

Seeds a handful of genuinely useful, British-English articles so the Guides
section launches with content. Existing slugs are never overwritten, so the
admin can freely edit them afterwards.
"""
import re
import uuid
from datetime import datetime, timezone


def _slugify(text: str) -> str:
    s = (text or "").lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:80]


def _read_minutes(content: str) -> int:
    return max(1, round(len(re.findall(r"\w+", content)) / 200))


STARTER_GUIDES = [
    {
        "title": "11 Realistic Side Hustles to Make Money Online in the UK",
        "category": "Side Hustles",
        "tags": ["side hustles", "make money online", "uk", "extra income"],
        "excerpt": "Eleven legitimate, UK-friendly side hustles you can start from your sofa — with realistic earnings and what each one actually involves.",
        "meta_description": "11 realistic side hustles to make money online in the UK — freelancing, surveys, tutoring, reselling and more, with honest earnings and how to start.",
        "hero_image": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
        "content": """Looking for a legitimate way to earn a bit extra around your day job? The good news is the UK has dozens of genuine online side hustles — no get-rich-quick nonsense required. Below are eleven realistic options, what they actually pay, and how to get started.

## 1. Freelancing your existing skills
If you can write, design, edit video, build spreadsheets or code, platforms like Upwork and Fiverr connect you with clients worldwide. Beginners often start at £15–£30 an hour and climb quickly once they have reviews.

## 2. Online surveys and microtasks
Sites such as Prolific and YouGov pay for your opinion. It won't replace a salary — think £20–£100 a month — but it's genuinely passive and pays via PayPal or bank transfer.

## 3. Tutoring and teaching
With a good grasp of a subject (or English), you can tutor UK pupils online or teach English to overseas students. Rates of £15–£35 an hour are common.

## 4. Reselling and flipping
Buy underpriced items from charity shops or car boot sales and resell on eBay, Vinted or Facebook Marketplace. Many UK resellers make a few hundred pounds a month part-time.

## 5. Print-on-demand
Upload designs to services like Redbubble or Etsy and they handle printing and posting. It's slow to build but genuinely passive once your designs rank.

## 6. Content creation
YouTube, TikTok and a niche blog can earn through ads, sponsorships and affiliate links. Expect months of effort before meaningful income — but the ceiling is high.

## 7. Virtual assistant work
Small businesses pay £12–£25 an hour for help with inboxes, scheduling and admin. Reliability matters more than experience.

## 8. Transcription and captioning
If you type quickly and accurately, transcription platforms pay per audio minute. It's flexible and you can fit it around other commitments.

## 9. Selling templates and digital products
Notion templates, CV designs, Lightroom presets — make once, sell forever. Etsy and Gumroad make this easy for UK sellers.

## 10. Pet sitting and dog walking
Not strictly online, but apps like Rover let you find clients digitally. A popular option for animal lovers, often £10–£15 per walk.

## 11. Cashback and matched betting
Cashback sites give money back on spending you'd do anyway. Matched betting (over‑18s only) can be profitable but carries risk and isn't for everyone — research carefully.

## How to choose
Pick **one** based on the skills and time you already have, commit for 90 days, and treat it like a small business. Track your income for **HMRC** — once you earn over the £1,000 trading allowance in a tax year, you'll need to declare it via self‑assessment.

*Earnings vary and nothing here is guaranteed — but every option above is a legitimate, UK‑friendly way to start.*
""",
    },
    {
        "title": "ISA vs SIPP: Where Should UK Savers Put Their Money?",
        "category": "Tax & ISAs",
        "tags": ["isa", "sipp", "pensions", "investing", "uk tax"],
        "excerpt": "A plain-English guide to the two most popular UK tax wrappers — how ISAs and SIPPs differ, and how to decide which deserves your money first.",
        "meta_description": "ISA vs SIPP explained for UK savers — tax relief, access rules, allowances and a simple framework for deciding where to invest first.",
        "hero_image": "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80",
        "content": """Two letters, two life-changing tax wrappers. **ISAs** and **SIPPs** are the backbone of most UK savers' plans — but they work very differently. Here's how to decide where your money should go.

## What is an ISA?
An Individual Savings Account lets you save or invest up to **£20,000 per tax year** (2025/26) with **no tax** on interest, dividends or growth. You can withdraw at any time, tax‑free. A Stocks & Shares ISA is the version most investors use for long‑term growth.

## What is a SIPP?
A Self‑Invested Personal Pension is a pension you control. Its superpower is **tax relief**: a basic‑rate taxpayer paying in £80 has it topped up to £100 by HMRC. Higher‑rate taxpayers can claim more back via self‑assessment. The catch — you can't normally access it until age 55 (rising to 57 from 2028).

## The key differences
- **Access:** ISA = any time. SIPP = locked until pension age.
- **Tax going in:** ISA = from taxed income. SIPP = boosted by tax relief.
- **Tax coming out:** ISA = fully tax‑free. SIPP = 25% tax‑free, the rest taxed as income.
- **Allowance:** ISA = £20,000/yr. SIPP = up to £60,000/yr for most (annual allowance).

## A simple framework
1. **Emergency fund first** — 3–6 months of expenses in easy‑access cash.
2. **Grab the free money** — if your employer matches workplace pension contributions, pay in enough to get the full match. That's an instant return no ISA can beat.
3. **Then weigh ISA vs SIPP:**
   - Need access before retirement (house deposit, career break)? Favour the **ISA**.
   - Higher‑rate taxpayer with a long horizon? The **SIPP's** tax relief is hard to beat.
   - Want both flexibility *and* tax relief? Many people split contributions.

## Don't forget the Lifetime ISA
If you're 18–39 and saving for a first home or retirement, a **Lifetime ISA** adds a 25% government bonus on up to £4,000 a year — though withdrawal rules are strict.

## The bottom line
There's rarely a single "right" answer. ISAs win on flexibility; SIPPs win on tax relief and long‑term discipline. Most UK savers benefit from using **both** over time.

*This is general information, not financial advice. Consider speaking to a regulated adviser about your own circumstances.*
""",
    },
    {
        "title": "How to Start Freelancing in the UK With No Experience",
        "category": "Freelancing",
        "tags": ["freelancing", "uk", "self-employed", "getting started"],
        "excerpt": "A step-by-step starter plan for landing your first paid freelance client in the UK — even if you've never freelanced before.",
        "meta_description": "How to start freelancing in the UK with no experience — pick a skill, build a mini portfolio, set rates, find first clients and stay right with HMRC.",
        "hero_image": "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1200&q=80",
        "content": """Freelancing is one of the fastest ways to turn a skill into income — and you don't need years of experience to begin. Here's a realistic, UK‑specific plan to land your first paying client.

## Step 1: Pick one sellable skill
You probably already have one: writing, social media, design, spreadsheets, admin, translation, basic web edits. Don't wait until you feel "qualified" — clients buy outcomes, not credentials.

## Step 2: Build a tiny portfolio
No clients yet? Create 2–3 sample pieces. Write a mock blog post, design a logo for a fictional café, or build a sample spreadsheet. Quality beats quantity — three strong samples are plenty to start.

## Step 3: Set a starter rate
Research what others charge on Upwork, Fiverr and PeoplePerHour, then price slightly below to win your first reviews. £15–£25 an hour is a common UK starting point; raise it after every few jobs.

## Step 4: Find your first clients
- **Marketplaces:** Upwork, Fiverr, PeoplePerHour — fast access to demand.
- **Your network:** tell friends, ex‑colleagues and local small businesses.
- **Communities:** relevant Reddit subs, Facebook groups and LinkedIn.

Send tailored, concise pitches that lead with how you'll help — not your life story.

## Step 5: Deliver brilliantly, then ask for a review
Your first few jobs are about momentum. Over‑communicate, hit deadlines, and politely ask happy clients for a review and a referral. Five‑star feedback compounds quickly.

## Step 6: Get your admin right (the UK bit)
- Register as **self‑employed with HMRC** once your income passes the **£1,000 trading allowance** in a tax year.
- Keep simple records of income and expenses — a spreadsheet is fine to begin.
- Set aside roughly 20–30% of profit for tax so January's self‑assessment bill isn't a shock.
- Consider separating your money with a free business or second current account.

## Step 7: Raise your rates and specialise
Once you're booked up, niche down ("email copy for SaaS", "Shopify product photos"). Specialists charge more and attract better clients.

## The mindset that wins
Treat freelancing like a business from day one: be reliable, communicate clearly, and keep improving your craft. Your first £100 is the hardest — after that, it's about consistency.

*Income isn't guaranteed and varies by skill and effort, but this is a proven path thousands of UK freelancers have followed.*
""",
    },
]


async def seed_guides(db) -> int:
    """Insert any starter guides whose slug isn't already present. Returns count inserted."""
    now = datetime.now(timezone.utc).isoformat()
    inserted = 0
    for g in STARTER_GUIDES:
        slug = _slugify(g["title"])
        if await db.guides.find_one({"slug": slug}):
            continue
        doc = {
            "id": str(uuid.uuid4()),
            "slug": slug,
            "title": g["title"],
            "content": g["content"].strip(),
            "excerpt": g["excerpt"],
            "meta_description": g["meta_description"],
            "category": g["category"],
            "tags": g["tags"],
            "hero_image": g.get("hero_image", ""),
            "author": "Income Online",
            "status": "published",
            "read_minutes": _read_minutes(g["content"]),
            "created_at": now,
            "updated_at": now,
            "published_at": now,
        }
        await db.guides.insert_one(doc)
        inserted += 1
    return inserted
