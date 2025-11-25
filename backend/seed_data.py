categories_data = [
    {
        "id": 1,
        "name": "Freelancing",
        "description": "Offer your skills and services to clients worldwide",
        "count": 2,
        "color": "from-emerald-50 to-teal-50",
        "borderColor": "border-emerald-200",
        "textColor": "text-emerald-700"
    },
    {
        "id": 2,
        "name": "Surveys & Research",
        "description": "Share your opinions and get paid for your time",
        "count": 1,
        "color": "from-blue-50 to-cyan-50",
        "borderColor": "border-blue-200",
        "textColor": "text-blue-700"
    },
    {
        "id": 3,
        "name": "Content Creation",
        "description": "Create videos, blogs, and content for income",
        "count": 2,
        "color": "from-orange-50 to-amber-50",
        "borderColor": "border-orange-200",
        "textColor": "text-orange-700"
    },
    {
        "id": 4,
        "name": "Trading & Investing",
        "description": "Grow your wealth through stocks, crypto, and forex",
        "count": 1,
        "color": "from-indigo-50 to-violet-50",
        "borderColor": "border-indigo-200",
        "textColor": "text-indigo-700"
    },
    {
        "id": 5,
        "name": "E-commerce",
        "description": "Sell products online through various platforms",
        "count": 2,
        "color": "from-rose-50 to-pink-50",
        "borderColor": "border-rose-200",
        "textColor": "text-rose-700"
    },
    {
        "id": 6,
        "name": "Teaching & Tutoring",
        "description": "Share your knowledge and teach students online",
        "count": 2,
        "color": "from-green-50 to-lime-50",
        "borderColor": "border-green-200",
        "textColor": "text-green-700"
    },
    {
        "id": 7,
        "name": "Remote Jobs",
        "description": "Find full-time or part-time remote employment",
        "count": 1,
        "color": "from-slate-50 to-gray-50",
        "borderColor": "border-slate-200",
        "textColor": "text-slate-700"
    },
    {
        "id": 8,
        "name": "Gig Economy",
        "description": "Complete short tasks and micro-jobs for quick cash",
        "count": 1,
        "color": "from-yellow-50 to-amber-50",
        "borderColor": "border-yellow-200",
        "textColor": "text-yellow-700"
    }
]

platforms_data = [
    {
        "id": 1,
        "name": "Upwork",
        "category": "Freelancing",
        "description": "Global freelancing platform connecting businesses with independent professionals",
        "earningsPotential": "$1,000 - $10,000+/month",
        "difficulty": "Medium",
        "rating": 4.5,
        "minPayout": "$10",
        "paymentMethods": ["PayPal", "Bank Transfer", "Payoneer"],
        "featured": True,
        "link": "https://upwork.com"
    },
    {
        "id": 2,
        "name": "Fiverr",
        "category": "Freelancing",
        "description": "Marketplace for freelance services starting at $5",
        "earningsPotential": "$500 - $5,000+/month",
        "difficulty": "Easy",
        "rating": 4.3,
        "minPayout": "$5",
        "paymentMethods": ["PayPal", "Bank Transfer"],
        "featured": True,
        "link": "https://fiverr.com"
    },
    {
        "id": 3,
        "name": "Swagbucks",
        "category": "Surveys & Research",
        "description": "Earn rewards for surveys, shopping, and watching videos",
        "earningsPotential": "$50 - $300/month",
        "difficulty": "Easy",
        "rating": 4.0,
        "minPayout": "$3",
        "paymentMethods": ["PayPal", "Gift Cards"],
        "featured": False,
        "link": "https://swagbucks.com"
    },
    {
        "id": 4,
        "name": "YouTube",
        "category": "Content Creation",
        "description": "Create and monetize video content for millions of viewers",
        "earningsPotential": "$100 - $100,000+/month",
        "difficulty": "Hard",
        "rating": 4.7,
        "minPayout": "$100",
        "paymentMethods": ["AdSense", "Bank Transfer"],
        "featured": True,
        "link": "https://youtube.com"
    },
    {
        "id": 5,
        "name": "Coinbase",
        "category": "Trading & Investing",
        "description": "Buy, sell, and trade cryptocurrencies securely",
        "earningsPotential": "Variable (High Risk)",
        "difficulty": "Medium",
        "rating": 4.2,
        "minPayout": "No minimum",
        "paymentMethods": ["Bank Transfer", "Crypto Wallet"],
        "featured": False,
        "link": "https://coinbase.com"
    },
    {
        "id": 6,
        "name": "Amazon FBA",
        "category": "E-commerce",
        "description": "Sell products on Amazon with fulfillment by Amazon",
        "earningsPotential": "$1,000 - $50,000+/month",
        "difficulty": "Hard",
        "rating": 4.4,
        "minPayout": "Bi-weekly payouts",
        "paymentMethods": ["Bank Transfer"],
        "featured": True,
        "link": "https://sell.amazon.com"
    },
    {
        "id": 7,
        "name": "VIPKid",
        "category": "Teaching & Tutoring",
        "description": "Teach English to Chinese students online",
        "earningsPotential": "$500 - $2,000/month",
        "difficulty": "Medium",
        "rating": 4.1,
        "minPayout": "$50",
        "paymentMethods": ["Bank Transfer", "PayPal"],
        "featured": False,
        "link": "https://vipkid.com"
    },
    {
        "id": 8,
        "name": "FlexJobs",
        "category": "Remote Jobs",
        "description": "Curated remote and flexible job opportunities",
        "earningsPotential": "$2,000 - $10,000+/month",
        "difficulty": "Medium",
        "rating": 4.6,
        "minPayout": "Varies by employer",
        "paymentMethods": ["Direct Deposit"],
        "featured": True,
        "link": "https://flexjobs.com"
    },
    {
        "id": 9,
        "name": "TaskRabbit",
        "category": "Gig Economy",
        "description": "Complete local tasks and errands for people in your area",
        "earningsPotential": "$300 - $2,000/month",
        "difficulty": "Easy",
        "rating": 4.2,
        "minPayout": "$25",
        "paymentMethods": ["Direct Deposit"],
        "featured": False,
        "link": "https://taskrabbit.com"
    },
    {
        "id": 10,
        "name": "Medium Partner Program",
        "category": "Content Creation",
        "description": "Write articles and earn based on reader engagement",
        "earningsPotential": "$100 - $5,000+/month",
        "difficulty": "Medium",
        "rating": 4.3,
        "minPayout": "$10",
        "paymentMethods": ["Stripe"],
        "featured": False,
        "link": "https://medium.com"
    },
    {
        "id": 11,
        "name": "Etsy",
        "category": "E-commerce",
        "description": "Sell handmade, vintage items, and craft supplies",
        "earningsPotential": "$200 - $10,000+/month",
        "difficulty": "Medium",
        "rating": 4.5,
        "minPayout": "No minimum",
        "paymentMethods": ["PayPal", "Bank Transfer"],
        "featured": True,
        "link": "https://etsy.com"
    },
    {
        "id": 12,
        "name": "Udemy",
        "category": "Teaching & Tutoring",
        "description": "Create and sell online courses to students worldwide",
        "earningsPotential": "$100 - $10,000+/month",
        "difficulty": "Hard",
        "rating": 4.4,
        "minPayout": "$50",
        "paymentMethods": ["PayPal", "Payoneer"],
        "featured": False,
        "link": "https://udemy.com"
    },
    {
        "id": 13,
        "name": "Reed.co.uk",
        "category": "Remote Jobs",
        "description": "UK's leading job board featuring thousands of remote and work from home opportunities",
        "earningsPotential": "$1,500 - $8,000+/month",
        "difficulty": "Medium",
        "rating": 4.5,
        "minPayout": "Varies by employer",
        "paymentMethods": ["Direct Deposit"],
        "featured": True,
        "link": "https://www.reed.co.uk/jobs/remote-jobs"
    },
    {
        "id": 14,
        "name": "Indeed",
        "category": "Remote Jobs",
        "description": "World's largest job site with extensive remote work listings across all industries",
        "earningsPotential": "$2,000 - $10,000+/month",
        "difficulty": "Medium",
        "rating": 4.6,
        "minPayout": "Varies by employer",
        "paymentMethods": ["Direct Deposit"],
        "featured": True,
        "link": "https://www.indeed.com/q-remote-jobs.html"
    }
]