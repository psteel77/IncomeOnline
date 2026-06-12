import json, sys, urllib.request

PROD = "https://incomeonline-production.up.railway.app"
SLUG = "isa-vs-sipp-where-should-uk-savers-put-their-money"

EXPANDED = """Two letters, two life-changing tax wrappers. **ISAs** and **SIPPs** are the backbone of most UK savers' plans — but they work very differently. Here's how to decide where your money should go.

## What is an ISA?
An Individual Savings Account lets you save or invest up to **£20,000 per tax year** (2025/26) with **no tax** on interest, dividends or growth. You can withdraw at any time, tax-free. A Stocks & Shares ISA is the version most investors use for long-term growth.

## What is a SIPP?
A Self-Invested Personal Pension is a pension you control. Its superpower is **tax relief**: a basic-rate taxpayer paying in £80 has it topped up to £100 by HMRC. Higher-rate taxpayers can claim more back via self-assessment. The catch — you can't normally access it until age 55 (rising to 57 from 2028).

## ISA vs SIPP at a glance

| | Stocks & Shares ISA | SIPP |
|---|---|---|
| Annual allowance (2025/26) | £20,000 | Up to £60,000 |
| Tax going in | From taxed income | Boosted by tax relief (20–45%) |
| Tax coming out | 100% tax-free | 25% tax-free, rest taxed as income |
| Access | Any time | From age 55 (57 from 2028) |
| Best for | Flexibility, medium-term goals | Long-term retirement, higher-rate relief |

## The key differences
- **Access:** ISA = any time. SIPP = locked until pension age.
- **Tax going in:** ISA = from taxed income. SIPP = boosted by tax relief.
- **Tax coming out:** ISA = fully tax-free. SIPP = 25% tax-free, the rest taxed as income.
- **Allowance:** ISA = £20,000/yr. SIPP = up to £60,000/yr for most.

## A worked example
Say you're a higher-rate taxpayer with £1,000 to invest. Put it in a **SIPP** and tax relief turns it into ~£1,667 invested (reclaiming more via self-assessment). Put it in an **ISA** and it's £1,000 — but every penny comes out tax-free, any time. Over 25 years at 6%, the SIPP's head start compounds significantly — *if* you can wait until pension age.

## A simple framework
1. **Emergency fund first** — 3–6 months of expenses in easy-access cash.
2. **Grab the free money** — if your employer matches workplace pension contributions, pay in enough to get the full match. That's an instant return no ISA can beat.
3. **Then weigh ISA vs SIPP:**
   - Need access before retirement (house deposit, career break)? Favour the **ISA**.
   - Higher-rate taxpayer with a long horizon? The **SIPP's** tax relief is hard to beat.
   - Want both flexibility *and* tax relief? Many people split contributions.

## Common mistakes to avoid
- Leaving long-term money in **cash** ISAs where inflation erodes it.
- Ignoring your **employer pension match** — free money that beats both.
- Maxing a SIPP when you'll need the cash before 55.

## Don't forget the Lifetime ISA
If you're 18–39 and saving for a first home or retirement, a **Lifetime ISA** adds a 25% government bonus on up to £4,000 a year — though withdrawal rules are strict.

## Frequently asked questions
**Can I have both an ISA and a SIPP?** Yes — most UK savers use both, and you can pay into both in the same tax year.

**Is a Lifetime ISA better than a SIPP for a first home?** For a first home, yes — the LISA's 25% bonus is purpose-built for it (up to £4,000/yr).

**What happens to my SIPP if I change jobs?** Nothing — a SIPP is personal and follows you, unlike some workplace pensions.

## The bottom line
There's rarely a single "right" answer. ISAs win on flexibility; SIPPs win on tax relief and long-term discipline. Most UK savers benefit from using **both** over time.

*Just getting started earning money to invest? See our guides on [realistic UK side hustles](/guides/11-realistic-side-hustles-to-make-money-online-in-the-uk) and [freelancing with no experience](/guides/how-to-start-freelancing-in-the-uk-with-no-experience).*

*This is general information, not financial advice. Consider speaking to a regulated adviser about your own circumstances.*
"""


def req(method, path, data=None, token=None):
    url = PROD + path
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(url, data=body, method=method)
    r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(r, timeout=30) as resp:
        return json.loads(resp.read().decode())


# 1) admin login
tok = req("POST", "/api/cms/login", {"username": "admin", "password": "Gulluk*9"}).get("token")
assert tok, "login failed"

# 2) fetch current guide + back it up
cur = req("GET", f"/api/guides/{SLUG}")
g = cur.get("guide", cur)
with open("/app/scripts/seo_backup_isa.json", "w") as f:
    json.dump(g, f, indent=2)
print("backed up original content length:", len(g.get("content", "")))

# 3) PUT expanded content, preserving every other field
payload = {
    "title": g["title"],
    "content": EXPANDED,
    "excerpt": g.get("excerpt", ""),
    "meta_description": g.get("meta_description", ""),
    "category": g.get("category", "Getting Started"),
    "tags": g.get("tags", []),
    "hero_image": g.get("hero_image", ""),
    "author": g.get("author", "Income Online"),
    "status": g.get("status", "published"),
}
res = req("PUT", f"/api/guides/{g['id']}", payload, token=tok)
print("update result:", res)

# 4) verify
after = req("GET", f"/api/guides/{res.get('slug', SLUG)}")
ga = after.get("guide", after)
print("new content length:", len(ga.get("content", "")), "| slug:", ga.get("slug"), "| status:", ga.get("status"))
