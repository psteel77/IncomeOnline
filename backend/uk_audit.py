"""
UK platform directory audit.

Single source of truth for the UK-market clean-up:
  1. NON_UK_REMOVE   — platforms genuinely unavailable to UK residents (deleted).
  2. De-duplication  — collapse duplicate listings (keep the lowest id).
  3. UK_REPLACEMENTS — hand-curated, genuinely UK-available earning platforms
                       inserted to keep the directory at 199+.

`reconcile_uk_platforms(db)` is fully idempotent — safe to run repeatedly on
both the preview DB and the production Atlas DB (via the admin endpoint).
"""

# Platforms a UK resident genuinely cannot earn from (US/other-region only,
# or defunct). Deleted entirely, regardless of any stale ukAvailable flag.
NON_UK_REMOVE = {
    # E-commerce
    "Mercari", "Poshmark", "ThredUp", "Walmart Marketplace", "Ruby Lane",
    # Gig Economy
    "DoorDash", "Instacart Shopper", "Lyft", "Shipt", "Spark Driver (Walmart)",
    "Wonolo", "Postmates", "Grubhub Driver", "Roadie", "Wag!", "Handy",
    "Thumbtack", "GigSmart", "Instawork", "Gigwalk", "Steady",
    # Teaching & Tutoring
    "Tutor.com", "VIPKid", "Wyzant", "Varsity Tutors", "TakeLessons",
    "Chegg Tutors",
    # Trading & Investing
    "Acorns", "Betterment", "Wealthfront", "M1 Finance", "SoFi Invest",
    "Stash", "Fundrise", "Groundfloor", "Yieldstreet", "Public", "Public.com",
    # Surveys & Research
    "InboxDollars", "Crowdtap", "MyPoints", "Forthright", "Opinion Outpost",
    # Remote Jobs
    "Justworks", "Speakwrite", "Zirtual", "Lensa",
    # Freelancing
    "CloudPeeps",
    # Removed at owner's request (13 June 2026)
    "Deliveroo", "Just Eat Couriers",
}


def _p(name, category, description, earnings, difficulty, rating, min_payout,
       methods, link, featured=False):
    return {
        "name": name,
        "category": category,
        "description": description,
        "earningsPotential": earnings,
        "difficulty": difficulty,
        "rating": rating,
        "minPayout": min_payout,
        "paymentMethods": methods,
        "featured": featured,
        "link": link,
        "ukAvailable": True,
    }


# Genuinely UK-available earning platforms (British English, GBP).
UK_REPLACEMENTS = [
    # ---------------- Freelancing ----------------
    _p("YunoJuno", "Freelancing", "Leading UK marketplace for freelancers and contractors, used by major British brands and agencies.", "£2,000 - £10,000/month", "Medium", 4.4, "Monthly", ["Bank Transfer"], "https://www.yunojuno.com/", True),
    _p("Malt", "Freelancing", "European freelance marketplace with a strong UK presence connecting freelancers to companies directly.", "£1,000 - £8,000/month", "Medium", 4.2, "Monthly", ["Bank Transfer"], "https://www.malt.com/"),
    _p("Worksome", "Freelancing", "UK freelance and contractor platform that handles contracts, compliance (IR35) and fast payments.", "£1,500 - £9,000/month", "Medium", 4.2, "Weekly", ["Bank Transfer"], "https://www.worksome.com/"),
    _p("Bark", "Freelancing", "UK-based marketplace where professionals receive leads from local customers across hundreds of services.", "£500 - £5,000/month", "Medium", 4.0, "Varies", ["Bank Transfer"], "https://www.bark.com/en/gb/"),
    _p("Codementor", "Freelancing", "Earn by mentoring developers and taking on freelance coding work for clients worldwide, payable to UK accounts.", "£300 - £4,000/month", "Hard", 4.1, "PayPal/Payoneer", ["PayPal", "Payoneer"], "https://www.codementor.io/"),
    _p("Designhill", "Freelancing", "Design marketplace for logos, websites and branding via contests and direct projects. Open to UK designers.", "£300 - £3,000/month", "Medium", 4.0, "Varies", ["PayPal", "Payoneer"], "https://www.designhill.com/"),

    # ---------------- Gig Economy ----------------
    _p("Stuart", "Gig Economy", "On-demand delivery network operating across UK cities. Deliver food and parcels by bike, scooter or car.", "£10 - £18/hour", "Easy", 4.1, "Weekly", ["Bank Transfer"], "https://stuart.com/", True),
    _p("Gophr", "Gig Economy", "UK courier platform for same-day deliveries. Choose jobs that suit your vehicle and schedule.", "£10 - £20/hour", "Easy", 4.0, "Weekly", ["Bank Transfer"], "https://gophr.com/couriers/"),
    _p("Evri Courier", "Gig Economy", "Deliver parcels on a self-employed round near you for one of the UK's largest delivery networks.", "£10 - £16/hour", "Easy", 3.8, "Weekly", ["Bank Transfer"], "https://www.evri.com/work-with-us/courier"),
    _p("Bolt", "Gig Economy", "Ride-hailing platform operating in London and other UK cities. Earn driving passengers with low commission.", "£12 - £25/hour", "Easy", 4.1, "Weekly", ["Bank Transfer"], "https://bolt.eu/en-gb/driver/"),
    _p("Addison Lee", "Gig Economy", "London private-hire operator. Drive passengers with one of the capital's best-known minicab brands.", "£500 - £3,000/month", "Easy", 4.0, "Weekly", ["Bank Transfer"], "https://www.addisonlee.com/drivers/"),
    _p("Airtasker", "Gig Economy", "Task marketplace connecting UK 'taskers' with people who need jobs done, from removals to handyman work.", "£10 - £30/hour", "Easy", 4.2, "£10", ["Bank Transfer", "PayPal"], "https://www.airtasker.com/uk/"),
    _p("Bidvine", "Gig Economy", "UK services marketplace. Get matched with customers looking for trades, tutoring, fitness and more.", "£300 - £3,000/month", "Medium", 4.0, "Varies", ["Bank Transfer"], "https://www.bidvine.com/"),
    _p("BorrowMyDoggy", "Gig Economy", "Connect with dog owners near you to walk and look after dogs. A popular UK side hustle for animal lovers.", "£50 - £500/month", "Easy", 4.6, "Cash/Bank", ["Bank Transfer", "Cash"], "https://www.borrowmydoggy.com/"),
    _p("Appen", "Gig Economy", "Work-from-home microtasks: data annotation, search evaluation and AI training projects open to UK workers.", "£5 - £12/hour", "Easy", 3.9, "Monthly", ["PayPal", "Bank Transfer"], "https://www.appen.com/"),
    _p("TELUS International AI", "Gig Economy", "Remote AI data and search-rater projects (formerly Lionbridge). Flexible hours, available to UK residents.", "£6 - £12/hour", "Easy", 4.0, "Monthly", ["PayPal", "Bank Transfer"], "https://www.telusinternational.com/careers/ai-community"),
    _p("Premise", "Gig Economy", "Earn from your phone by completing local data-collection tasks and photo submissions around the UK.", "£20 - £150/month", "Easy", 3.9, "£5", ["PayPal"], "https://www.premise.com/"),
    _p("Streetbees", "Gig Economy", "UK market-research app. Share opinions, photos and experiences in short missions and get paid via PayPal.", "£20 - £100/month", "Easy", 4.0, "£3", ["PayPal"], "https://www.streetbees.com/"),
    _p("Roamler", "Gig Economy", "Complete in-store mystery-shopping and merchandising tasks across the UK from your smartphone.", "£30 - £200/month", "Easy", 4.1, "£10", ["PayPal", "Bank Transfer"], "https://www.roamler.com/"),
    _p("TopCashback", "Gig Economy", "Earn cashback on everyday UK shopping plus referral bonuses. One of the highest-paying UK cashback sites.", "£100 - £600/year", "Easy", 4.5, "£0", ["Bank Transfer", "PayPal"], "https://www.topcashback.co.uk/"),
    _p("Quidco", "Gig Economy", "Popular UK cashback platform paying you back on purchases from thousands of retailers, plus refer-a-friend.", "£100 - £500/year", "Easy", 4.4, "£1", ["Bank Transfer", "PayPal"], "https://www.quidco.com/"),
    _p("JustPark", "Gig Economy", "Rent out your driveway or parking space to UK drivers and earn passive income from unused space.", "£50 - £300/month", "Easy", 4.4, "Monthly", ["Bank Transfer"], "https://www.justpark.com/rent-out-parking/"),
    _p("Airbnb", "Gig Economy", "Host a spare room or whole property to UK and international guests and earn flexible hosting income.", "£200 - £2,000/month", "Medium", 4.5, "After stay", ["Bank Transfer"], "https://www.airbnb.co.uk/host/homes", True),
    _p("Spacer", "Gig Economy", "List spare storage, garage or loft space to renters near you and earn passive monthly income in the UK.", "£30 - £200/month", "Easy", 4.0, "Monthly", ["Bank Transfer"], "https://www.spacer.co.uk/"),

    # ---------------- Teaching & Tutoring ----------------
    _p("MyTutor", "Teaching & Tutoring", "UK's leading online tutoring platform. Tutor GCSE and A-Level students from home around your schedule.", "£500 - £2,000/month", "Medium", 4.5, "Monthly", ["Bank Transfer"], "https://www.mytutor.co.uk/become-a-tutor/", True),
    _p("Tutorful", "Teaching & Tutoring", "UK tutoring marketplace for online and in-person lessons across academic subjects, music and languages.", "£400 - £1,500/month", "Medium", 4.3, "Weekly", ["Bank Transfer"], "https://tutorful.co.uk/become-a-tutor"),
    _p("Superprof", "Teaching & Tutoring", "Set your own rates and advertise lessons in any subject to students across the UK. Keep what you charge.", "£300 - £2,000/month", "Easy", 4.1, "Direct", ["Bank Transfer"], "https://www.superprof.co.uk/"),
    _p("First Tutors", "Teaching & Tutoring", "Established UK tutor directory connecting you with local and online students for one-to-one tuition.", "£300 - £1,800/month", "Medium", 4.2, "Direct", ["Bank Transfer"], "https://www.firsttutors.com/uk/"),
    _p("The Profs", "Teaching & Tutoring", "Premium UK tutoring agency for university, professional and admissions tutoring at higher hourly rates.", "£500 - £3,000/month", "Hard", 4.4, "Monthly", ["Bank Transfer"], "https://theprofs.co.uk/tutor-jobs/"),
    _p("Tutor House", "Teaching & Tutoring", "UK platform for GCSE, A-Level and degree-level tuition online and in person across London and beyond.", "£400 - £2,000/month", "Medium", 4.2, "Weekly", ["Bank Transfer"], "https://tutorhouse.co.uk/online-tutoring-jobs"),

    # ---------------- Trading & Investing ----------------
    _p("Freetrade", "Trading & Investing", "UK commission-free investing app. Buy UK and US shares, ETFs and hold a Stocks & Shares ISA. FCA regulated.", "Variable", "Medium", 4.3, "£2", ["Bank Transfer"], "https://freetrade.io/", True),
    _p("Trading 212", "Trading & Investing", "Commission-free UK trading app for stocks, ETFs and ISAs with a popular high-interest cash offering. FCA regulated.", "Variable", "Medium", 4.5, "£1", ["Bank Transfer"], "https://www.trading212.com/", True),
    _p("InvestEngine", "Trading & Investing", "Low-cost UK ETF investing platform with commission-free DIY portfolios and ISAs. FCA regulated.", "Variable", "Medium", 4.4, "£100", ["Bank Transfer"], "https://investengine.com/"),
    _p("Nutmeg", "Trading & Investing", "UK robo-adviser (a JP Morgan company). Managed ISAs, pensions and portfolios with no time commitment.", "Variable", "Easy", 4.3, "£500", ["Bank Transfer"], "https://www.nutmeg.com/"),
    _p("Moneybox", "Trading & Investing", "UK app that rounds up spare change to invest, plus ISAs, pensions and Lifetime ISAs. Great for beginners.", "Variable", "Easy", 4.4, "£1", ["Bank Transfer"], "https://www.moneyboxapp.com/"),
    _p("Moneyfarm", "Trading & Investing", "UK digital wealth manager offering managed ISAs, pensions and general investment accounts. FCA regulated.", "Variable", "Easy", 4.2, "£500", ["Bank Transfer"], "https://www.moneyfarm.com/uk/"),
    _p("Wealthify", "Trading & Investing", "Aviva-owned UK robo-investing service. Choose a risk level and let experts manage your ISA or pension.", "Variable", "Easy", 4.2, "£1", ["Bank Transfer"], "https://www.wealthify.com/"),
    _p("Plum", "Trading & Investing", "UK money app that auto-saves and invests, with ISAs and funds. Smart budgeting plus investing in one place.", "Variable", "Easy", 4.1, "£1", ["Bank Transfer"], "https://withplum.com/"),
    _p("Hargreaves Lansdown", "Trading & Investing", "The UK's largest investment platform. Trade shares and funds and hold ISAs and SIPPs. FCA regulated.", "Variable", "Medium", 4.4, "No minimum", ["Bank Transfer"], "https://www.hl.co.uk/"),
    _p("interactive investor", "Trading & Investing", "Major UK flat-fee investment platform for shares, funds, ISAs and SIPPs. Ideal for larger portfolios.", "Variable", "Medium", 4.3, "No minimum", ["Bank Transfer"], "https://www.ii.co.uk/"),
    _p("Dodl by AJ Bell", "Trading & Investing", "Low-cost UK investing app from AJ Bell with commission-free funds, shares and ISAs. FCA regulated.", "Variable", "Easy", 4.2, "£100", ["Bank Transfer"], "https://www.dodl.co.uk/"),
    _p("Wombat", "Trading & Investing", "UK micro-investing app with themed funds and fractional shares. Invest small amounts in an ISA.", "Variable", "Easy", 4.0, "£10", ["Bank Transfer"], "https://www.wombatinvest.com/"),
    _p("Chip", "Trading & Investing", "UK savings and investing app with high-interest accounts and ISAs that automate your saving.", "Variable", "Easy", 4.2, "£1", ["Bank Transfer"], "https://getchip.uk/"),
    _p("CrowdProperty", "Trading & Investing", "UK peer-to-peer property lending platform. Earn interest by funding vetted UK property projects. Capital at risk.", "Variable", "Medium", 4.1, "£500", ["Bank Transfer"], "https://www.crowdproperty.com/"),
    _p("Assetz Capital", "Trading & Investing", "UK peer-to-peer lending to British SMEs and property developers. Earn interest; capital at risk.", "Variable", "Medium", 4.0, "£1", ["Bank Transfer"], "https://www.assetzcapital.co.uk/"),
    _p("Kuflink", "Trading & Investing", "UK property-backed peer-to-peer lending with monthly interest and auto-invest. FCA regulated; capital at risk.", "Variable", "Medium", 4.1, "£100", ["Bank Transfer"], "https://www.kuflink.com/"),

    # ---------------- E-commerce ----------------
    _p("Gumtree", "E-commerce", "The UK's best-known classifieds site. Sell almost anything locally with no listing fees for private sellers.", "£50 - £1,000/month", "Easy", 4.0, "Cash/Bank", ["Cash", "Bank Transfer"], "https://www.gumtree.com/"),
    _p("Preloved", "E-commerce", "Long-running UK marketplace for second-hand goods. List clutter, fashion and furniture to local buyers.", "£50 - £800/month", "Easy", 4.0, "Cash/Bank", ["Cash", "Bank Transfer"], "https://www.preloved.co.uk/"),
    _p("Vestiaire Collective", "E-commerce", "Global pre-loved luxury fashion marketplace popular in the UK. Sell designer items to a worldwide audience.", "£100 - £3,000/month", "Easy", 4.2, "After sale", ["Bank Transfer", "PayPal"], "https://www.vestiairecollective.com/"),
    _p("Music Magpie", "E-commerce", "Sell your old tech, phones, CDs, DVDs and games to a UK reseller for a fixed quote and free postage.", "£20 - £500/month", "Easy", 4.1, "Same day", ["Bank Transfer", "PayPal"], "https://www.musicmagpie.co.uk/"),
    _p("Folksy", "E-commerce", "UK marketplace for handmade and craft sellers — a British alternative to Etsy for makers and artists.", "£50 - £2,000/month", "Easy", 4.2, "PayPal/Stripe", ["PayPal", "Bank Transfer"], "https://folksy.com/"),
    _p("OnBuy", "E-commerce", "Fast-growing UK online marketplace. List products to millions of British shoppers with competitive fees.", "£100 - £5,000/month", "Medium", 4.0, "Bi-weekly", ["Bank Transfer", "PayPal"], "https://www.onbuy.com/gb/sell/"),
    _p("Shpock", "E-commerce", "UK marketplace app for selling second-hand items locally. Quick listings with photos from your phone.", "£50 - £600/month", "Easy", 3.9, "Cash/Bank", ["Cash", "Bank Transfer"], "https://www.shpock.com/"),

    # ---------------- Surveys & Research ----------------
    _p("PopulusLive", "Surveys & Research", "Well-paid UK survey panel run by a respected polling company. Fewer but higher-value surveys.", "£100 - £300/year", "Easy", 4.2, "£50", ["Bank Transfer"], "https://www.populuslive.com/"),
    _p("20Cogs", "Surveys & Research", "UK GPT site where completing a chain of free offers and surveys can pay out a meaningful lump sum.", "£20 - £200/month", "Easy", 4.0, "£20", ["PayPal", "Bank Transfer"], "https://www.20cogs.co.uk/"),
    _p("OnePoll", "Surveys & Research", "UK survey panel behind many news polls. Short surveys paid in real money rather than points.", "£20 - £80/month", "Easy", 4.0, "£40", ["PayPal", "Bank Transfer"], "https://www.onepoll.com/"),
    _p("Triaba", "Surveys & Research", "UK-focused survey panel paying cash per completed survey with PayPal cashouts.", "£15 - £60/month", "Easy", 3.9, "PayPal", ["PayPal"], "https://www.triaba.co.uk/"),
    _p("The OpinionPanel", "Surveys & Research", "UK research community aimed at students and young people, paying cash and vouchers for opinions.", "£20 - £100/month", "Easy", 4.1, "£25", ["Bank Transfer", "Vouchers"], "https://www.opinionpanel.co.uk/"),

    # ---------------- Remote Jobs ----------------
    _p("Reed.co.uk", "Remote Jobs", "One of the UK's biggest job boards. Search thousands of remote and flexible roles across every sector.", "£2,000 - £12,000/month", "Medium", 4.4, "Varies", ["Bank Transfer"], "https://www.reed.co.uk/jobs/remote-jobs", True),
    _p("CV-Library", "Remote Jobs", "Major UK job board with a large remote-working category and easy CV upload for employers to find you.", "£2,000 - £10,000/month", "Medium", 4.1, "Varies", ["Bank Transfer"], "https://www.cv-library.co.uk/remote-jobs"),
    _p("Totaljobs", "Remote Jobs", "Leading UK recruitment site listing remote, hybrid and home-based vacancies nationwide.", "£2,000 - £11,000/month", "Medium", 4.2, "Varies", ["Bank Transfer"], "https://www.totaljobs.com/jobs/remote"),
    _p("Otta", "Remote Jobs", "Curated UK and European tech job platform (now part of Welcome to the Jungle) with personalised remote roles.", "£3,000 - £15,000/month", "Medium", 4.4, "Varies", ["Bank Transfer"], "https://app.welcometothejungle.com/"),

    # ---------------- Digital Creators/Innovators ----------------
    _p("Buy Me a Coffee", "Digital Creators/Innovators", "Simple way for UK creators to take one-off tips, memberships and sell digital products to supporters.", "£20 - £2,000/month", "Easy", 4.4, "Instant", ["Bank Transfer", "PayPal"], "https://www.buymeacoffee.com/"),
    _p("Fanvue", "Digital Creators/Innovators", "UK-founded subscription platform where creators earn from fans through monthly subs, tips and messages.", "£50 - £5,000/month", "Medium", 4.0, "Weekly", ["Bank Transfer"], "https://www.fanvue.com/"),
]


try:
    from uk_long_descriptions import LONG_DESCRIPTIONS
except Exception:  # pragma: no cover
    LONG_DESCRIPTIONS = {}


def _norm(name: str) -> str:
    return (name or "").strip().lower()


async def reconcile_uk_platforms(db):
    """Idempotent UK directory reconciliation. Returns a summary dict."""
    # 1) Remove platforms not available to UK residents.
    del_result = await db.platforms.delete_many({"name": {"$in": list(NON_UK_REMOVE)}})
    removed_non_uk = del_result.deleted_count

    # 2) De-duplicate: keep the lowest id per (case-insensitive) name.
    seen = {}
    dup_ids = []
    cursor = db.platforms.find({}, {"_id": 1, "id": 1, "name": 1})
    async for doc in cursor:
        key = _norm(doc.get("name"))
        cur_id = doc.get("id", 10**9)
        if key not in seen:
            seen[key] = (cur_id, doc["_id"])
        else:
            kept_id, kept_oid = seen[key]
            # keep the smaller numeric id, drop the other
            if cur_id < kept_id:
                dup_ids.append(kept_oid)
                seen[key] = (cur_id, doc["_id"])
            else:
                dup_ids.append(doc["_id"])
    removed_dupes = 0
    if dup_ids:
        r = await db.platforms.delete_many({"_id": {"$in": dup_ids}})
        removed_dupes = r.deleted_count

    # 3) Insert UK replacements (skip any name that already exists).
    existing_names = set()
    async for doc in db.platforms.find({}, {"name": 1}):
        existing_names.add(_norm(doc.get("name")))

    last = await db.platforms.find_one(sort=[("id", -1)])
    next_id = (last["id"] if last else 0) + 1

    added = 0
    for tpl in UK_REPLACEMENTS:
        if _norm(tpl["name"]) in existing_names:
            continue
        doc = dict(tpl)
        doc["id"] = next_id
        await db.platforms.insert_one(doc)
        existing_names.add(_norm(tpl["name"]))
        next_id += 1
        added += 1

    # 3b) Backfill ~100-word UK precis (longDescription) for UK platforms.
    long_set = 0
    for name, precis in LONG_DESCRIPTIONS.items():
        r = await db.platforms.update_one(
            {"name": name}, {"$set": {"longDescription": precis}}
        )
        long_set += r.modified_count

    # 4) Recompute category counts.
    categories = await db.categories.find({}).to_list(100)
    for cat in categories:
        count = await db.platforms.count_documents({"category": cat["name"]})
        await db.categories.update_one(
            {"name": cat["name"]}, {"$set": {"count": count}}
        )

    total = await db.platforms.count_documents({})
    non_uk_left = await db.platforms.count_documents({"ukAvailable": False})

    return {
        "removed_non_uk": removed_non_uk,
        "removed_duplicates": removed_dupes,
        "added_uk_platforms": added,
        "long_descriptions_set": long_set,
        "total_platforms": total,
        "non_uk_remaining": non_uk_left,
    }
