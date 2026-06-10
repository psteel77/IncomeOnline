# Initial content for the CMS
# This will be seeded into the database on first run.
# Existing production records are preserved — new fields fall back to defaults
# in the frontend when the admin hasn't set them yet.

content_sections = [
    {
        "section_id": "hero",
        "content": {
            # Legacy fields (kept for back-compat with older CMS payloads)
            "title": "Discover the Best UK Ways to Make Money Online",
            "subtitle": "Your comprehensive directory of legitimate online earning opportunities. From freelancing to passive income, find the perfect way to make money online.",
            "cta_text": "Get Started",
            # New granular fields (editable via admin)
            "badge": "199+ Verified Earning Platforms",
            "headline_line1": "Discover the Best UK Ways to",
            "headline_line2": "Make Money Online",
            "subtitle_line1": "Your comprehensive directory of legitimate online earning opportunities",
            "subtitle_line2": "From Freelancing to Passive Income • One Time to Full Time",
            # Hero "Free MoneyRules Guides" pill (CMS-editable)
            "pill_enabled": True,
            "pill_label": "Free MoneyRules Guides",
            "pill_target": "free-resources",
            # When True, clicking the pill asks for an email (lead capture) before scrolling
            "pill_capture_email": False,
        }
    },
    {
        "section_id": "library_banner",
        "content": {
            "badge": "100% Free · MoneyRules Library",
            "headline": "10 FREE Financial Guides, Yours to Keep",
            "description": "Download print-ready PDF guides on investing, budgeting, debt, tax, passive income, credit, ISAs and more — no payment, no catch.",
            "cta_primary": "Get My Free Guides",
            "cta_secondary": "or grab the £14.99 Premium Pack →",
        }
    },
    {
        "section_id": "free_resources",
        "content": {
            "title": "MoneyRules Library — 10 Free Guides",
            "subtitle": "Professional PDF guides you can download, print and keep",
        }
    },
    {
        "section_id": "donation",
        "content": {
            "title": "Support Our Mission",
            "description": "Make a donation to unlock access to all earning platforms with detailed information, ratings, and direct links.",
            "features": [
                "Access to 50+ verified earning platforms with detailed information",
                "Ratings, reviews, and earning potential for each platform",
                "Direct links to start earning immediately",
                "Search and filter tools to find your perfect opportunity",
                "Lifetime access to all current and future platforms"
            ],
            "why_donate_title": "Why Your Support Matters",
            "why_donate_description": "Your donation helps us maintain and expand our platform, bringing more earning opportunities to people worldwide.",
            "impact_items": [
                {
                    "title": "Research & Verification",
                    "description": "Your donations fund new features like reviews, comparisons, and earnings calculators"
                },
                {
                    "title": "Platform Updates",
                    "description": "We continuously update our database to ensure you have access to the latest opportunities"
                },
                {
                    "title": "Free Resources",
                    "description": "Help us create guides, tutorials, and success stories for the community"
                }
            ]
        }
    },
    {
        "section_id": "categories",
        "content": {
            "title": "Browse by Category",
            "subtitle": "Choose your preferred way to earn money online"
        }
    },
    {
        "section_id": "platforms_featured",
        "content": {
            "title": "Featured Platforms",
            "subtitle": "Top-rated opportunities to start earning today",
            "locked_title": "🔒 Platforms Locked",
            "locked_description": "Support us with a donation to unlock full access to all 50+ earning platforms with detailed reviews and direct links."
        }
    },
    {
        "section_id": "platforms_all",
        "content": {
            "title": "All Platforms",
            "subtitle": "Explore our comprehensive directory and find opportunities that match your skills and interests.",
            "locked_title": "🔒 Content Locked",
            "locked_description": "Make a donation to view all platforms and start your earning journey today."
        }
    },
    {
        "section_id": "footer",
        "content": {
            "tagline": "Your trusted guide to legitimate online earning opportunities",
            "copyright": "© 2025 Income Online. All rights reserved."
        }
    },
    {
        "section_id": "how_it_works",
        "content": {
            "title": "How It Works",
            "subtitle": "Join the IncomeOnline community and start earning online in three simple steps",
            "steps": [
                {
                    "title": "1. Browse & Search",
                    "description": "Explore our comprehensive directory and find opportunities that match your skills and interests.",
                    "image": "https://images.unsplash.com/photo-1629184510982-cf91280c1d53?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzExMnww&ixlib=rb-4.1.0&q=85"
                },
                {
                    "title": "2. Choose Verified Platforms",
                    "description": "Select from our curated list of legitimate, trusted platforms with real earning potential and user reviews.",
                    "image": "https://images.unsplash.com/photo-1758611971587-ddc6656822d9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHw0fHxmcmVlbGFuY2VyJTIwd29ya2luZyUyMGNvbXB1dGVyfGVufDB8fHx8MTc2NDA3MzExMnww&ixlib=rb-4.1.0&q=85"
                },
                {
                    "title": "3. Start Earning",
                    "description": "Sign up on your chosen platforms and begin your online earning journey with confidence and clarity.",
                    "image": "https://images.unsplash.com/photo-1551727974-8af20a3322f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHN1Y2Nlc3NmdWx8ZW58MHx8fHwxNzY0MDczMTE3fDA&ixlib=rb-4.1.0&q=85"
                }
            ]
        }
    },
    {
        "section_id": "success_stories",
        "content": {
            "title": "Success Stories",
            "subtitle": "Real people earning real money online",
            "stories": [
                {
                    "quote": "I went from struggling to find work to earning £5,000+ monthly through freelancing platforms. This directory helped me discover legitimate opportunities I never knew existed!",
                    "author": "Freelance Designer",
                    "category": "Freelancing",
                    "image": "https://images.unsplash.com/photo-1758518731027-78a22c8852ec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxzdWNjZXNzJTIwY2VsZWJyYXRpb258ZW58MHx8fHwxNzY0MDczMTg4fDA&ixlib=rb-4.1.0&q=85"
                },
                {
                    "quote": "Teaching online changed my life! I now reach students worldwide and earn consistently while working from home. The flexibility is incredible!",
                    "author": "Online Educator",
                    "category": "Teaching & Tutoring",
                    "image": "https://images.unsplash.com/photo-1758519290801-c07424a5142a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHw0fHxhY2hpZXZlbWVudCUyMGJ1c2luZXNzfGVufDB8fHx8MTc2NDA3MzE5NHww&ixlib=rb-4.1.0&q=85"
                }
            ]
        }
    },
    {
        "section_id": "cta",
        "content": {
            "title": "Ready to Start Your Online Earning Journey?",
            "subtitle": "Join thousands of people already earning money online through our platform",
            "button_primary": "Explore All Platforms",
            "button_secondary": "Read Success Stories"
        }
    }
]
