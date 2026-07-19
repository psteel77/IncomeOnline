"""
PILLAR 1 — "The Complete Beginner's Guide to Making Money Online".

Regenerates the flagship guide through the branded MoneyRules template so it
obeys the IncomeOnline house rules: Montserrat 11pt, purple/pink/orange scheme,
branded chapter panels (each chapter on a new page), page borders, and coloured
Expert Tip / Action Checklist / Common Mistake / Example / Case Study callouts
that are kept together and never split or orphaned at the bottom of a page.

Content is verbatim from the client's supplied guide.
"""
from moneyrules_template import (
    create_moneyrules_document, add_title_page, add_styled_heading,
    add_body_text, add_expert_tip, add_action_checklist, add_common_mistake,
    add_example_box, add_case_study, add_closing_page, save_to_buffer, BODY_TEXT,
)
from docx.shared import Pt


def _bullets(doc, items):
    for it in items:
        p = doc.add_paragraph(it, style='List Bullet')
        for r in p.runs:
            r.font.size = Pt(11)
            r.font.color.rgb = BODY_TEXT


# Block grammar:
#   ('chapter', text)  branded purple panel, starts on a new page
#   ('h2', text)       pink sub-heading
#   ('body', text)     paragraph
#   ('bullets', [..])  bullet list
#   ('tip', str|[..])  purple Expert Tip callout
#   ('checklist', [..])pink Action Checklist callout
#   ('mistake', str|[..]) orange Common Mistake callout
#   ('example', str|[..]) purple Example callout
#   ('case', str|[..])  pink Case Study callout
BLOCKS = [
    ('chapter', 'Introduction'),
    ('body', "If you've searched online for ways to make money, you've probably been overwhelmed by bold promises, exaggerated income claims and videos telling you that you can become wealthy with little effort. The truth is different."),
    ('body', "Making money online is real. Every day, millions of people around the world earn part-time incomes, full-time salaries or build businesses that provide financial freedom. However, very few achieve success overnight. Those who do succeed usually have one thing in common — they treat earning online as building a real business rather than chasing the latest 'get rich quick' trend."),
    ('body', "This guide has one purpose and one purpose only: to help you avoid the mistakes that waste most people's time and money, while showing you practical, proven methods that work."),
    ('body', "Whether your goal is an extra £200 each month, to replace your salary or to create a business you can sell, the principles are exactly the same."),
    ('body', "Success online isn't about finding one magical opportunity."),
    ('body', "It's about building an Income Stack — several reliable income streams that work together to create financial security for you."),
    ('body', "That is exactly what you'll learn in this guide."),

    ('chapter', 'Chapter 1 – The Biggest Myth About Making Money Online'),
    ('body', "The internet is full of people promising effortless wealth."),
    ('body', '"Earn £10,000 a month."'),
    ('body', '"Work one hour a day."'),
    ('body', '"Copy my system."'),
    ('body', "Most of these claims are designed to sell courses rather than teach genuine business skills."),
    ('body', "The reality is much simpler."),
    ('body', "There are thousands of legitimate ways to earn online, but every successful method requires one or more of the following:"),
    ('bullets', ['Time', 'Skill', 'Money', 'Consistency']),
    ('body', "You can sometimes compensate for having less of one by investing more of another."),
    ('body', "For example, someone with very little money can still build a successful online business by investing time and learning new skills. Someone with significant capital may be able to grow much faster by investing in staff, advertising or software."),
    ('body', "Neither approach is right or wrong. The important thing is understanding that there is no shortcut that removes effort from the process."),
    ('tip', 'Whenever someone tells you that making money online is "easy", ask yourself one question: why are they trying to sell the concept to me instead of quietly making millions themselves? Answering that single question will protect you from many expensive mistakes.'),
    ('checklist', [
        'Before continuing, write down your personal objective.',
        'A little extra spending money?',
        'To replace your salary?',
        'A business that could eventually be sold?',
        'Greater financial security?',
    ]),
    ('body', "Having a clear destination makes the journey easier."),

    ('chapter', 'Chapter 2 – Understanding the Income Stack'),
    ('body', "Many people believe they need one brilliant business idea. In reality, successful online entrepreneurs usually build several income streams over time."),
    ('body', "Imagine a table with only one leg. If that leg breaks, the entire table collapses. Now imagine a table with six strong legs. If one weakens, the others continue supporting it."),
    ('body', "Your online income works exactly the same way. A typical Income Stack could include:"),
    ('bullets', ['Affiliate commissions', 'Digital products', 'Advertising revenue', 'Subscription income', 'Freelance work', 'Investments', 'Cashback and rewards', 'Referral bonuses']),
    ('body', "Each income stream may appear relatively small on its own. Together they create stability."),
    ('body', "This approach also reduces risk. If one platform changes its rules or one income source dries up, your entire business doesn't disappear overnight."),
    ('example', [
        'Sarah earns:',
        '•  £300 per month from affiliate marketing.',
        '•  £250 from digital downloads.',
        '•  £450 from freelance work.',
        '•  £180 from advertising.',
        '•  £120 from cashback and referrals.',
        'None of these figures are life-changing on their own. Combined, they generate over £1,300 each month. As she develops each stream, the total continues to grow.',
    ]),
    ('mistake', [
        "Many beginners jump from one \"opportunity\" to another every few weeks. They give it a try, conclude it doesn't work and hop on to the next one. They never stay with one method long enough to see results.",
        'Choose one income stream. Learn about it properly. Then add another. That is how sustainable businesses are built.',
    ]),
    ('checklist', [
        'List three online income streams you would like to learn more about.',
        'Write them down NOW.',
    ]),
    ('body', "Don't worry about choosing perfectly. The aim is simply to start thinking seriously about building your own Income Stack."),

    ('chapter', 'Chapter 3 – Setting Realistic Expectations'),
    ('body', "One of the biggest reasons people fail online is unrealistic expectations. Many expect significant income within weeks. When it doesn't happen, they conclude that making money online doesn't work."),
    ('body', "In reality, every genuine business follows a similar pattern."),
    ('h2', 'Stage One — Learning'),
    ('body', "You spend time understanding the basics. Income is usually very small or non-existent."),
    ('h2', 'Stage Two — Implementation'),
    ('body', "You begin applying what you've learned. Mistakes happen. Income gradually appears."),
    ('h2', 'Stage Three — Momentum'),
    ('body', "Systems improve. Skills develop. Confidence grows. Income becomes more predictable."),
    ('h2', 'Stage Four — Scaling'),
    ('body', "You automate processes, outsource repetitive tasks and expand into additional income streams. This is where many businesses experience substantial growth."),
    ('h2', 'Think Long-Term'),
    ('body', "Imagine planting an oak tree. You wouldn't expect it to reach full height within a few weeks. Online businesses are no different."),
    ('body', "The people who succeed are often not the smartest. They're simply the ones who stick at it long enough to benefit from compound growth."),
    ('tip', 'Measure progress by skills acquired rather than money earned. Income almost always follows improved skills.'),
    ('checklist', [
        'Set yourself a realistic goal for the next twelve months. Examples might include:',
        'Launch my first website.',
        'Earn my first £100 online.',
        'Publish ten helpful articles.',
        'Join two affiliate programmes.',
        'Learn basic SEO.',
    ]),
    ('body', "Short-term achievements build long-term success."),

    ('chapter', 'Chapter 4 – Choosing the Right Starting Point'),
    ('body', "There are hundreds of ways to make money online. Trying to learn about them all leads to confusion. Instead, choose a starting point that matches your circumstances."),
    ('h2', 'If You Have More Time Than Money'),
    ('body', "Focus on:"),
    ('bullets', ['Content creation.', 'Affiliate marketing.', 'Freelancing.', 'Blogging.', 'Social media growth.']),
    ('body', "These methods require commitment rather than significant financial investment."),
    ('h2', 'If You Have Capital Available'),
    ('body', "Consider:"),
    ('bullets', ['Building niche websites.', 'Purchasing existing online businesses.', 'Paid advertising.', 'Creating digital products.', 'Subscription businesses.']),
    ('body', "Investment can accelerate growth, but it should never replace learning the fundamentals."),
    ('h2', 'If You Already Have Specialist Knowledge'),
    ('body', "Turn it into an asset. Examples include:"),
    ('bullets', ['Online courses.', 'E-books.', 'Consulting.', 'Coaching.', 'Membership communities.', 'Templates.', 'Calculators.', 'Premium guides.']),
    ('body', "Knowledge is often one of the easiest assets to monetise because it is difficult for competitors to copy."),
    ('h2', 'Avoid "Shiny Object Syndrome"'),
    ('body', "Every week a new platform, AI tool or business model appears. Do not be seduced by these. Constantly changing direction prevents meaningful progress."),
    ('body', "Choose one path and master it. Only then move to the next opportunity."),
    ('h2', 'End of Part One — Your First Action Plan'),
    ('body', "Before moving on to Chapter 5, complete these five tasks:"),
    ('bullets', [
        'Define your income goal.',
        'Decide how many hours each week you can realistically commit.',
        'Select one primary income method.',
        'Ignore every new "get rich quick" opportunity for the next 90 days.',
        'Commit to thinking long-term and building a business rather than chasing short-term wins.',
    ]),
    ('h2', 'Looking Ahead'),
    ('body', "In the next section, you'll learn how to identify genuine opportunities, recognise scams before they cost you money, and develop the mindset needed to build a sustainable online income."),

    ('chapter', 'Chapter 5 – Spotting Genuine Opportunities (and Avoiding Scams!)'),
    ('body', "One of the greatest advantages of the internet is that almost anyone can start a business with relatively little money. Unfortunately, that same accessibility has attracted thousands of scammers whose business model depends on separating honest people from their savings."),
    ('body', "The good news is that most scams follow predictable patterns. Once you know what to look for, they become much easier to recognise."),
    ('h2', 'The Biggest Warning Signs'),
    ('body', "Be cautious if you see phrases such as:"),
    ('bullets', ['"Guaranteed income."', '"Risk-free investment."', '"Earn thousands with no experience."', '"Limited spaces available."', '"Secret system."', '"Only available today."']),
    ('body', "These phrases are designed to create urgency rather than provide useful information. A genuine business opportunity should still make sense after you've taken time to research it."),
    ('h2', 'If It Sounds Too Good to Be True…'),
    ('body', "IT USUALLY IS!!"),
    ('body', "Imagine somebody approached you on the high street and offered to double your money in a week. Most people would walk away. Yet online, attractive websites and polished videos can make the same unrealistic promises seem believable."),
    ('body', "Always ask yourself:"),
    ('bullets', ['Where does the money actually come from?', 'Is the business model easy to understand?', 'Would this opportunity still exist if nobody bought the course explaining it?']),
    ('body', "If you cannot easily understand how the business generates income, don't invest your money."),
    ('body', "The Incomeonline.info proposal is simple: you pay a single subscription for 12 months' access to curated online earning opportunities along with numerous guides, calculators and helpful information. That's it!"),
    ('tip', 'The internet rewards people who create value (like IncomeOnline.info!) — not people who chase shortcuts. We know from experience: the more genuine value you provide, the more opportunities you create for yourself.'),
    ('checklist', [
        'Before joining any online programme:',
        'Look for long-term customer experiences (like the Success Stories on incomeonline.info).',
        'Understand exactly how the business earns money.',
        'Never invest money you cannot afford to lose.',
        'Take at least 24 hours before making expensive decisions.',
    ]),

    ('chapter', 'Chapter 6 – Choosing Your First Income Stream'),
    ('body', "Beginners often make the mistake of trying five or six different methods simultaneously. They start a YouTube channel, launch a blog, open an Etsy shop, try affiliate marketing and experiment with dropshipping."),
    ('body', "They don't give any of them enough attention to produce results and give up within a few weeks."),
    ('body', "A much better strategy is to initially choose one primary income stream and give it your full attention."),
    ('h2', 'Questions to Ask Yourself'),
    ('body', "Do you enjoy writing? A blog or affiliate website could be ideal."),
    ('body', "Do you enjoy speaking? YouTube or podcasting may suit you."),
    ('body', "Are you creative? Selling digital products or printables could be a natural fit."),
    ('body', "Do you already have professional skills? Freelancing or consulting can often generate income much faster than building a website from scratch."),
    ('h2', 'There Is No Perfect Choice'),
    ('body', "Many successful entrepreneurs eventually build several businesses. The important thing is simply making a start."),
    ('body', "Your first business probably won't be your last. It is the experience you gain that becomes your greatest asset."),
    ('example', [
        'David wanted to build an affiliate website.',
        'Instead of trying to learn everything at once, he focused solely on publishing one high-quality article every week.',
        'Twelve months later he had over fifty helpful articles attracting search traffic from Google.',
        'That website became the foundation for several additional income streams.',
    ]),
    ('mistake', 'Changing direction every month. Progress comes from consistency.'),
    ('checklist', [
        'Choose one of the following Sectors:',
        'Freelancing', 'Surveys & Research', 'Digital Creators', 'E-commerce',
        'Teaching & Tutoring', 'Trading & Investing', 'Remote Jobs', 'Gig Economy',
    ]),
    ('body', "Write it down!! For the next 30 days, make your chosen Sector your primary focus."),

    ('chapter', 'Chapter 7 – Understanding Active and Passive Income'),
    ('body', "One of the most misunderstood phrases online is \"passive income.\" Many people believe passive income means earning money while doing absolutely nothing. That rarely happens."),
    ('body', "In reality, passive income usually begins with a large amount of active work. You create something once and, ideally, it continues producing income long afterwards."),
    ('h2', 'Examples of Active Income'),
    ('bullets', ['Freelancing', 'Consulting', 'Coaching', 'Virtual assistance', 'Graphic design', 'Web development']),
    ('body', "You are exchanging time for money. When you stop working, the income usually stops too."),
    ('h2', 'Examples of Passive or Semi-Passive Income'),
    ('bullets', ['Affiliate websites', 'Digital products', 'Online courses', 'Membership websites', 'Books', 'Mobile apps', 'Advertising revenue']),
    ('body', "These still require maintenance, updates and marketing, but they can continue earning long after the initial work has been completed."),
    ('h2', 'Why Both Matter'),
    ('body', "Active income provides immediate cash flow. Passive income builds long-term financial security. Many successful entrepreneurs deliberately use active income to finance the creation of passive income."),
    ('body', "For example, a freelance designer earns £2,000 each month. They use part of that income to build an online course. Over time the course begins generating recurring income. Eventually they become less dependent on freelance work."),
    ('tip', "Think of active income as funding your future. Use today's (active) earnings to build tomorrow's (passive) freedom."),
    ('checklist', [
        'List three active income ideas.',
        'List three passive income ideas.',
        'Which one will you begin building first?',
    ]),

    ('chapter', 'Chapter 8 – Building the Right Mindset'),
    ('body', "Most online businesses fail long before money becomes the problem. They fail because people lose confidence, their self-belief shrinks and they become disillusioned with the whole Income Online thing. Remember:"),
    ('bullets', [
        'Every entrepreneur experiences setbacks.',
        'Almost everyone publishes articles that receive no visitors.',
        'Videos with very few views.',
        'Great products that don\'t sell.',
        'Applications that are rejected.',
        'Brilliant emails that go unanswered.',
    ]),
    ('body', "These are not signs of failure. They are part of learning. Don't take it personally — if it was that easy, everyone would do it."),
    ('body', "There is no avoiding the pain of learning the hard way. IncomeOnline.info will take away some of that pain and save you huge amounts of time and frustration, but YOU have to put in the work."),
    ('h2', 'Success Is Rarely Instant'),
    ('body', "The websites generating thousands of visitors today often published hundreds of articles before gaining momentum. The YouTube channel with one million subscribers probably spent years uploading videos that hardly anyone watched."),
    ('body', "Every successful business has an invisible history that most people never see. People see the What, but they don't see the How."),
    ('h2', 'Focus on Improvement'),
    ('body', "Instead of asking \"Why isn't this working?\", ask \"What can I improve?\" Small improvements made consistently create extraordinary results over time."),
    ('h2', 'Build Habits'),
    ('body', "Rather than waiting for motivation, develop routines. Discipline trumps skill every time. For example:"),
    ('bullets', ['Write for one hour every morning.', 'Learn one new skill every week.', 'Publish consistently.', 'Review your progress every month.']),
    ('body', "Habits outperform motivation because they continue even on difficult days — and there will be many of those!"),
    ('mistake', "Comparing your beginning with someone else's tenth year. Social media shows the highlights, not the heartache. It rarely shows the years of hard work that came before success."),
    ('h2', 'Your 90-Day Commitment'),
    ('body', "Over the next three months:"),
    ('bullets', ['Focus on learning.', 'Publish consistently.', 'Ignore distractions.', 'Keep improving.']),
    ('body', "Do not judge your success by this week's income. Judge it by how much stronger your business has become compared with three months ago."),
    ('h2', 'End of Part Two — Your Progress Check'),
    ('body', "By now you should have defined your financial goals, chosen your first income stream, understood the difference between active and passive income, learnt how to recognise scams, developed realistic expectations and committed to building long-term habits."),
    ('body', "You now have the mindset and foundation needed to start creating genuine online income."),
    ('body', "In Chapters 9–12, we'll move from principles to action by exploring the first practical business models, how to choose the right niche, validate ideas before investing time or money, and avoid the mistakes that prevent most new online businesses from gaining traction."),

    ('chapter', 'Chapter 9 – Choosing a Profitable Niche'),
    ('body', "One of the first decisions you'll make is what your business is going to be about. This is known as your niche — a specific topic or market that you'll focus on."),
    ('body', "Many beginners believe they need to find a completely original idea. You don't. You can work within or alongside any number of the opportunities listed on www.incomeonline.info. You don't need to reinvent the wheel."),
    ('body', "In fact, some of the most successful online businesses operate in markets that have existed for decades."),
    ('body', "The secret isn't finding a market with no competition. The secret is finding a market where people are already spending money, and providing information, products or services that people evidently want."),
    ('h2', 'The Three Ingredients of a Great Niche'),
    ('body', "A strong niche normally has three characteristics."),
    ('h2', '1. People Are Searching For It'),
    ('body', "If nobody is looking for information, it's difficult to build traffic. Examples include:"),
    ('bullets', ['Personal finance', 'Gardening', 'Travel', 'Pets', 'Fitness', 'Home improvement', 'Technology', 'Food and cooking']),
    ('h2', '2. People Spend Money'),
    ('body', "Visitors are valuable, but customers build businesses. Ask yourself:"),
    ('bullets', ['Do people buy products in this market?', 'Are there affiliate programmes?', 'Are businesses advertising?', 'Are books, courses or memberships available?']),
    ('body', "If the answer is yes, there's likely money flowing through that market."),
    ('h2', '3. You Can Add Value'),
    ('body', "You don't have to be the world's leading expert. You simply need to be able to research thoroughly, explain clearly and help people solve real problems — whether it's a firm needing a freelance article, a survey completed or offering specialist advice."),
    ('tip', "Don't choose a niche simply because it's profitable. Choose one you'll still enjoy writing about two years from now. Consistency beats short-term enthusiasm."),
    ('checklist', [
        'Write down three niche ideas. For each one ask:',
        'Are people searching for it?',
        'Do people spend money?',
        'Can I create genuinely helpful content?',
    ]),
    ('body', "The niche that scores highest is usually your best starting point."),

    ('chapter', 'Chapter 10 – Solving Problems Creates Income'),
    ('body', "Every successful business solves a problem. Sometimes it's a large problem. Sometimes it's a very small inconvenience. Either way, people are willing to pay for solutions."),
    ('body', "Think about some of the businesses you already use. Streaming services solve boredom. Food delivery apps solve convenience. Comparison websites save time. Navigation apps reduce stress."),
    ('body', "Their products may be different, but the principle is identical. They solve problems."),
    ('h2', 'Apply the Same Thinking Online'),
    ('body', "Before creating any content, ask yourself: what problem is this helping somebody solve? Examples include:"),
    ('bullets', ['How to save money.', 'How to repair something.', 'How to choose between two products.', 'How to earn extra income.', 'How to learn a new skill.']),
    ('body', "Content that solves genuine problems is far more likely to rank well in search engines and be shared by readers."),
    ('h2', 'The IncomeOnline Formula'),
    ('body', "Identify the Problem  →  Create the Solution  →  Build Trust  →  Income."),
    ('body', "Miss one of those steps and your business becomes much harder to grow."),
    ('example', [
        'Imagine two articles.',
        'Article One: "The Best Laptops."',
        'Article Two: "Which Laptop Should You Buy for Working from Home? A Complete Buyer\'s Guide."',
        'Which one is more likely to answer a real question? The second article provides context, guidance and confidence. People remember businesses that genuinely help them.',
    ]),
    ('mistake', 'Creating content because you find it interesting instead of because your audience needs it. Always write for your reader — not for yourself.'),
    ('checklist', [
        'Look within your chosen Sector at IncomeOnline.info and list ten questions people regularly ask within your chosen niche.',
    ]),
    ('body', "Those questions are the foundation of your future content strategy."),

    ('chapter', 'Chapter 11 – Validating an Idea Before Investing Time'),
    ('body', "One of the biggest advantages of online business is that ideas can often be tested quickly and cheaply. Before spending weeks creating a website or product, make sure there is evidence that people actually want it."),
    ('h2', 'Ask Yourself Four Questions'),
    ('body', "Is there demand? Are people actively searching for information?"),
    ('body', "Is there competition? Competition isn't something to fear. It usually proves there is a market."),
    ('body', "Can I improve on what's already available? Perhaps existing articles are outdated. Maybe videos are too complicated. Could you explain the subject more clearly?"),
    ('body', "Can I make money ethically? Income should be the result of helping people — not misleading them."),
    ('h2', 'Test Before You Build'),
    ('body', "Instead of creating fifty articles immediately, publish five. Instead of recording an entire online course, create one lesson. Instead of building a large shop, offer a small selection first."),
    ('body', "Small tests save enormous amounts of time."),
    ('tip', 'Never become emotionally attached to an idea. Become attached to solving problems. Ideas change. Successful businesses adapt.'),
    ('checklist', [
        'Before investing significant time:',
        'Check search demand.',
        'Study competitors.',
        'Identify what you can improve.',
        'Decide how the business will generate income.',
    ]),
    ('body', "If you can answer all four confidently, you're ready to move forward."),

    ('chapter', 'Chapter 12 – Building Your First Business Asset'),
    ('body', "Many beginners think they're building websites. They're not. They're building assets."),
    ('body', "An asset is something that continues providing value over time. A high-quality website can become an asset. An email list is an asset. A YouTube channel is an asset. A digital course is an asset. A membership community is an asset."),
    ('body', "Each one can continue generating visitors, income and opportunities long after it has been created."),
    ('h2', 'Assets Grow in Value'),
    ('body', "Imagine writing one helpful article every week. After one year you have around fifty articles. After three years you have over 150. You can licence these to numerous websites. Each article has the potential to attract visitors every single day."),
    ('body', "Unlike many traditional jobs, your previous work continues working for you."),
    ('h2', 'Build Once, Improve Forever'),
    ('body', "The best online businesses are never finished. Successful owners regularly:"),
    ('bullets', ['Update content.', 'Improve SEO.', 'Add new resources.', 'Replace outdated information.', 'Expand their products and services.']),
    ('body', "Every improvement increases the value of the asset."),
    ('case', [
        'Think about the vision behind IncomeOnline. It isn\'t simply a website. By constantly checking the market and reviewing what we offer, we are building faith amongst our subscribers. By never accepting third-party payments or selling subscriber information, we are building trust.',
        'It\'s becoming a growing collection of valuable assets:',
        '•  An extensive business directory.',
        '•  Step-by-step guides.',
        '•  Practical calculators.',
        '•  Downloadable templates.',
        '•  Premium resources.',
        '•  A trusted membership community.',
        'Each new piece of high-quality content strengthens every other part of the platform. Over time, this creates a library that becomes increasingly difficult for competitors to replicate. By remaining independent and unbiased in our selection of potential income platforms, we ensure the Success Stories keep coming in. That is exactly how long-term authority is built.',
    ]),
    ('mistake', 'Many people focus entirely on earning today\'s income. Successful entrepreneurs spend equal time building assets that will continue producing value for years to come.'),
    ('checklist', [
        'Ask yourself:',
        'What asset am I building today?',
        'Will it still have value in three years?',
        'Can it be improved over time?',
        'Does it increase trust in my business?',
        'Does it help people solve a real problem?',
    ]),
    ('body', "If the answer is yes, you're building something worthwhile."),
    ('h2', 'End of Part Three — Your Foundation Is Taking Shape'),
    ('body', "You now understand how to choose a profitable niche, why solving problems should always come before making money, how to validate ideas before investing significant time, and why building long-term assets is the key to sustainable online success."),
    ('body', "The next section is where theory becomes practical. In Chapters 13–16, we'll explore the first major online income models in detail, beginning with affiliate marketing — one of the most accessible and scalable ways for beginners to start generating income online."),

    ('chapter', 'Chapter 13 – Affiliate Marketing: One of the Best Places to Start'),
    ('body', "If someone asked me to recommend one online business model for most beginners, affiliate marketing would be high on the list. Affiliate marketing can be found in several platforms on Income Online, perhaps the most well-known being Amazon Associates and Shopify."),
    ('h2', 'Why Is It a Good Place to Start?'),
    ('body', "Because you don't need to invent a product, hold stock, deal with deliveries or provide customer support. Instead, you recommend products or services that genuinely help people. If someone buys through your unique affiliate link, you receive a commission at no extra cost to the customer."),
    ('body', "It is a simple concept, but when approached professionally it can become a significant source of long-term income."),
    ('h2', 'How Affiliate Marketing Works'),
    ('body', "The process is straightforward:"),
    ('bullets', ['Join an affiliate programme.', 'Receive a unique tracking link.', 'Create genuinely helpful content.', 'A visitor clicks your link.', 'They make a purchase.', 'You receive a commission.']),
    ('body', "The important point is that the sale happens because you solved a problem, not because you pressured someone into buying."),
    ('h2', 'Why It Works'),
    ('body', "People search Google every day asking questions such as:"),
    ('bullets', ['Which is the best…', 'How do I…', "What's the difference between…", 'Is this product worth buying?']),
    ('body', "If your article provides an honest answer, readers naturally appreciate recommendations that help them make informed decisions."),
    ('h2', 'Build Trust First'),
    ('body', "Never recommend something purely because it pays a high commission. Your reputation is worth far more than a single sale. Whenever possible:"),
    ('bullets', ['Use products yourself.', 'Be honest about disadvantages.', "Explain who the product is suitable for and who it isn't.", 'Recommend alternatives where appropriate.']),
    ('body', "Readers remember honesty. That trust becomes one of your greatest business assets."),
    ('example', [
        'Imagine someone searching for "Best beginner\'s camera for wildlife photography." A useful guide could include:',
        '•  What features matter.',
        '•  Typical price ranges.',
        '•  Common buying mistakes.',
        '•  Recommended models.',
        '•  Links to trusted retailers.',
        'The visitor receives valuable advice. The retailer gains a customer. You receive a commission. Everyone benefits.',
    ]),
    ('mistake', 'Publishing hundreds of short articles filled with affiliate links but offering little useful information. Google increasingly rewards helpful, original content — not pages created purely to generate commissions.'),
    ('checklist', [
        'Choose a topic you\'re interested in and/or have knowledge of.',
        'Research available affiliate programmes.',
        'Write genuinely helpful content.',
        'Recommend products honestly.',
    ]),
    ('body', "You have to build trust before expecting income."),

    ('chapter', 'Chapter 14 – Creating Content That People Actually Want to Read'),
    ('body', "Content is the engine that drives most successful online businesses. Whether you're writing articles, creating videos or recording podcasts, your content should answer questions better than your competitors."),
    ('body', "The internet doesn't need more content. It needs better content."),
    ('h2', 'Write for One Person'),
    ('body', "Imagine you're sitting across the table from someone asking for advice. How would you explain the answer? Write in that style. Avoid unnecessary jargon. Use plain English. Keep paragraphs short. Guide the reader step by step."),
    ('h2', 'Focus on Helping'),
    ('body', "Ask yourself: \"What problem will my reader have solved after reading this?\" If you cannot answer that question, reconsider your content before publishing."),
    ('h2', 'A Simple Structure'),
    ('body', "Most successful articles follow a similar pattern:"),
    ('bullets', ['Introduce the problem.', 'Explain why it matters.', 'Present the solution.', 'Give practical examples.', 'Summarise the key points.', 'Suggest the next logical step.']),
    ('body', "Readers appreciate clarity. Search engines do too."),
    ('h2', 'Use Real Examples'),
    ('body', "Stories are memorable. Facts are easier to remember when supported by examples."),
    ('tip', 'Write the article you wish had existed when you started researching the subject. That mindset almost always produces useful content.'),
    ('checklist', [
        'Before publishing any article ask:',
        "Does it answer the reader's question?",
        'Is it easy to understand?',
        'Does it provide practical advice?',
        'Is it more useful than competing articles?',
        'Would I recommend this article to a friend?',
    ]),

    ('chapter', 'Chapter 15 – Understanding Search Intent'),
    ('body', "One of the biggest mistakes is writing articles that nobody is actually searching for. To succeed online, you need to understand why someone is typing a particular phrase into Google. This is called search intent."),
    ('h2', 'Four Common Types of Search'),
    ('body', "Informational — the visitor wants information."),
    ('example', '"How does affiliate marketing work?"'),
    ('body', "Comparative — the visitor is comparing options."),
    ('example', '"Shopify vs WooCommerce."'),
    ('body', "Commercial — the visitor is considering a purchase."),
    ('example', '"Best office chair under £300."'),
    ('body', "Transactional — the visitor is ready to take action."),
    ('example', '"Buy standing desk online."'),
    ('body', "Each type of search requires different content."),
    ('h2', "Match the Reader's Expectations"),
    ('body', "If someone searches \"How to start a blog\", they expect a guide — not a sales page. If someone searches \"Best website hosting\", they expect comparisons, reviews and recommendations."),
    ('body', "The better your content matches their intent, the more likely visitors are to stay, trust your advice and return in the future."),
    ('h2', 'Think Like Your Reader'),
    ('body', "Before writing anything ask:"),
    ('bullets', ['What is this person really trying to achieve?', 'What questions will they ask next?', 'What information will help them make a decision?']),
    ('body', "Great content anticipates those questions before they're asked."),
    ('mistake', 'Trying to sell immediately when the visitor simply wants information. Help comes first. Income will come later. That approach builds long-term trust.'),
    ('checklist', [
        'Choose five questions/problems within your niche. For each one write down:',
        'What is the search intent?',
        'What type of content would best answer it?',
        'What action would you like the reader to take afterwards?',
    ]),

    ('chapter', 'Chapter 16 – Why Email Lists Still Matter'),
    ('body', "Many beginners focus entirely on attracting website visitors. Traffic is important. But there's something even more valuable: an email list."),
    ('body', "Think about it. Visitors arrive. They read one page. Then they leave. Unless they remember your website, you may never see them again."),
    ('body', "An email list changes that. It allows you to build an ongoing relationship with people who have chosen to hear from you."),
    ('h2', 'Why Email Outperforms Social Media'),
    ('body', "Social media algorithms change constantly. Platforms rise and fall. Your followers can disappear overnight if a platform changes its rules."),
    ('body', "An email list is different. It belongs to your business. You can communicate directly with subscribers whenever you have something genuinely useful to share."),
    ('h2', 'Give People a Good Reason to Subscribe'),
    ('body', "Very few people join a mailing list simply to receive \"updates.\" Offer something valuable. Examples include:"),
    ('bullets', ['A free guide.', 'A downloadable checklist.', 'A calculator.', 'A template.', 'A resource library.', "A beginner's toolkit."]),
    ('body', "Always provide something worth exchanging an email address for."),
    ('h2', 'Build Trust With Every Email'),
    ('body', "Don't send constant sales messages. Everyone (me included!) gets way too many irrelevant emails, so make sure you:"),
    ('bullets', ['Share useful advice.', 'Recommend genuinely helpful resources.', 'Tell stories.', 'Answer common questions.', 'Introduce new content.']),
    ('body', "When you occasionally recommend a product or service, subscribers are far more likely to trust your recommendation."),
    ('example', [
        'Our very own "IncomeOnline" example:',
        'Someone downloads a free checklist, "10 Ways to Start Making Money Online." Over the following weeks they receive practical tips, links to helpful articles and invitations to explore the IncomeOnline directory.',
        'Eventually they decide that becoming a Member gives them access to tools and resources that will save them time and potentially make them money. The sale happened because trust was built first.',
    ]),
    ('checklist', [
        'Plan your first email incentive. Ask yourself:',
        'What would my ideal reader find genuinely useful?',
        'Could I create it in one afternoon?',
        'Would it encourage people to return to my website?',
    ]),
    ('body', "If the answer is yes, you've taken another important step towards building a sustainable online business."),
    ('h2', 'End of Part Four — From Visitor to Customer'),
    ('body', "You now understand how affiliate marketing works, why helpful content always outperforms sales-driven content, how search intent influences SEO, and why an email list is one of the most valuable assets any online business can build."),
    ('body', "In the next section (Chapters 17–20), we'll bring everything together by looking at diversification, avoiding common mistakes, measuring progress and creating a practical long-term action plan that will help turn knowledge into consistent results."),

    ('chapter', 'Chapter 17 – Diversify Your Income Before You Need To'),
    ('body', "One of the biggest mistakes online business owners make is becoming dependent on a single source of income."),
    ('body', "If all your visitors come from Google, a search algorithm update could kill your traffic overnight. If all your income comes from one affiliate programme, a commission cut could dramatically reduce your earnings. If your business relies on one social media platform, changes to that platform could significantly affect your reach."),
    ('body', "Successful online businesses spread their risk."),
    ('h2', 'Build Your Income Stack'),
    ('body', "Think of each income stream as another pillar supporting your business. For example:"),
    ('bullets', ['Affiliate commissions', 'Membership subscriptions', 'Premium guides', 'Digital downloads', 'Online courses', 'Display advertising', 'Sponsorships', 'Consulting', 'Freelance work', 'Software tools', 'Email promotions']),
    ('body', "You don't need all of these, but over time you should aim to have several complementary income sources."),
    ('h2', 'Diversify Your Traffic Too'),
    ('body', "Don't rely solely on one source of visitors. A healthy online business attracts people from:"),
    ('bullets', ['Google Search', 'Bing', 'Email marketing', 'YouTube', 'Social media', 'Referrals from other websites', 'Direct visitors']),
    ('body', "If one source declines, the others continue supporting your business."),
    ('example', [
        'IncomeOnline isn\'t designed to rely on one product. Instead it combines:',
        '•  Free educational content that attracts visitors.',
        '•  Member-only resources.',
        '•  Premium Member guides, calculators and templates.',
        '•  A comprehensive directory.',
        '•  Downloadable tools.',
        '•  Email newsletters.',
        '•  Future partnerships and affiliate opportunities.',
        'Each element strengthens the others. That creates a far more resilient business than relying on a single source of income.',
    ]),
    ('checklist', [
        'Write down your current income sources.',
        'Write down your current traffic sources.',
        'Now ask: "If my biggest source disappeared tomorrow, would my business survive?"',
    ]),
    ('body', "Diversification should become one of your key priorities."),

    ('chapter', 'Chapter 18 – The Ten Mistakes That Prevent Most People From Succeeding'),
    ('body', "After studying successful online businesses, the same mistakes appear repeatedly. Avoiding them won't guarantee success — but it will dramatically improve your chances."),
    ('h2', 'Mistake 1 — Expecting instant results'),
    ('body', "Businesses take time to grow."),
    ('h2', 'Mistake 2 — Jumping from one opportunity to another'),
    ('body', "Consistency almost always beats constant change."),
    ('h2', 'Mistake 3 — Buying online courses without taking action'),
    ('body', "Knowledge only becomes valuable when applied."),
    ('h2', 'Mistake 4 — Copying competitors instead of creating something better'),
    ('body', "Original thinking builds authority."),
    ('h2', 'Mistake 5 — Ignoring SEO'),
    ('body', "Even the best content needs to be discoverable."),
    ('h2', 'Mistake 6 — Selling before building trust'),
    ('body', "Help people first. Income follows trust."),
    ('h2', 'Mistake 7 — Failing to collect email subscribers'),
    ('body', "Visitors come and go. Subscribers can become long-term relationships."),
    ('h2', 'Mistake 8 — Publishing inconsistently'),
    ('body', "One excellent article every week is better than ten articles followed by months of silence."),
    ('h2', 'Mistake 9 — Giving up too early'),
    ('body', "Many successful websites receive very little traffic during their first year. Persistence matters. Nothing can stand in the way of persistence."),
    ('h2', 'Mistake 10 — Treating online business as a hobby'),
    ('body', "Successful entrepreneurs set goals, measure progress, review results and seek to improve continuously."),
    ('tip', "Don't compare yourself with businesses that have existed for ten years. Compare yourself with where you were six months ago. That's the comparison that matters."),
    ('checklist', [
        'Review these ten mistakes.',
        'Which three are you most likely to make?',
        "Write down how you'll avoid them.",
    ]),

    ('chapter', 'Chapter 19 – Measuring Success'),
    ('body', "If you don't measure your progress, it's impossible to know whether your business is improving. Many beginners only monitor one figure: income. While income is important, it isn't the only measurement that matters."),
    ('h2', 'Key Numbers Worth Tracking'),
    ('bullets', ['Website visitors.', 'Returning visitors.', 'Email subscribers.', 'Search rankings.', 'Articles published.', 'Conversion rates.', 'Member sign-ups.', 'Premium Member upgrades.', 'Affiliate income.', 'Digital product sales.']),
    ('body', "Tracking these numbers each month gives you a much clearer picture of how your business is developing."),
    ('h2', 'Celebrate Small Wins'),
    ('body', "Your first website visitor. Your first subscriber. Your first affiliate commission. Your first paying Member. Your first Premium Member."),
    ('body', "Every successful business began with these milestones. Recognising and celebrating progress keeps motivation high."),
    ('h2', 'Review Monthly'),
    ('body', "Ask yourself:"),
    ('bullets', ['What worked well?', "What didn't work?", 'Which content performed best?', 'Which pages attracted the most visitors?', 'What will I improve next month?']),
    ('body', "Continuous improvement beats dramatic change."),
    ('checklist', [
        'Create a simple monthly business dashboard containing:',
        'Visitors.', 'Subscribers.', 'Revenue.', 'New content published.', 'Membership growth.', 'Goals for next month.',
    ]),
    ('body', "Review it on the same day every month."),

    ('chapter', 'Chapter 20 – Your Long-Term Action Plan'),
    ('body', "Congratulations. You've reached the end of this guide. More importantly, you've reached the beginning of your online business journey."),
    ('body', "Knowledge alone changes nothing. Action changes everything."),
    ('h2', 'Your First 30 Days'),
    ('bullets', ['Choose your niche.', 'Create your website.', 'Publish your first articles.', 'Join relevant affiliate programmes.', 'Start collecting email subscribers.', 'Learn basic SEO.']),
    ('body', "Focus on building momentum — not perfection."),
    ('h2', 'Days 31–90'),
    ('bullets', ['Publish consistently.', 'Improve existing content.', 'Build backlinks naturally.', 'Grow your email list.', 'Study your visitors.', 'Make small improvements every week.']),
    ('h2', 'Months 4–12'),
    ('bullets', ['Expand your content library.', 'Develop downloadable resources.', 'Create your first digital product.', 'Introduce membership features.', 'Diversify your income streams.', 'Measure your results monthly.']),
    ('body', "By the end of your first year you'll have built something far more valuable than income alone. You'll have built experience — and experience compounds."),
    ('h2', 'Your IncomeOnline Journey'),
    ('body', "The purpose of this guide has never been to promise overnight wealth. Instead, it has shown you the principles behind building a genuine online business."),
    ('body', "Thousands of people will continue searching for shortcuts. A much smaller group will quietly build valuable assets, help other people, improve every month and create businesses that continue generating income year after year."),
    ('body', "Decide today which group you want to join."),
    ('h2', 'Your Final Checklist'),
    ('body', "Before closing this guide, ask yourself:"),
    ('checklist', [
        'Have I chosen my niche?',
        'Have I committed to a long-term approach?',
        'Do I understand the importance of trust?',
        'Am I creating value before expecting income?',
        'Have I started building my Income Stack?',
        'Am I treating this as a real business?',
    ]),
    ('body', "If you can answer \"yes\" to those questions, you're already ahead of many people who never move beyond reading about success."),
    ('h2', 'Thank You'),
    ('body', "Thank you for investing your time in reading this guide. I genuinely hope it has helped you see that making money online isn't about luck, secret systems or overnight riches."),
    ('body', "It's about solving problems, building trust and creating valuable assets that continue working for you long into the future."),
    ('body', "Wherever you are today, take the first step. One article. One customer. One subscriber. One improvement. Those small steps, repeated consistently, are how successful online businesses are built."),
    ('h2', "What's Next?"),
    ('body', "This guide is only the beginning. Continue your journey by exploring the resources available within IncomeOnline."),
    ('body', "Members (£9.99/month) gain access to the full online income directory, exclusive resources and regularly updated content designed to save time and help you make better decisions."),
    ('body', "Premium Members (£14.99/month) receive everything included with Membership, plus advanced guides, premium calculators, downloadable templates, planning tools and in-depth business resources created to help accelerate your progress."),
    ('body', "Whether you're looking to earn your first £100 online or build a full-time digital business, IncomeOnline is designed to support you at every stage of your journey."),
    ('h2', 'Final Thought'),
    ('expert_tip_final', 'The best time to start building your online business was 5 years ago. The second-best time is today. Take action, stay consistent, keep learning, and let every piece of content, every new skill and every improvement become another brick in the business you\'re building.'),
]


def generate_pillar1_document():
    from pillar_cover import generate_cover
    cover = generate_cover(
        'Pillar 1',
        ["The Complete Beginner's Guide", 'to Making Money Online'],
        '/tmp/pillar1_cover.png',
    )
    doc = create_moneyrules_document(
        title="The Complete Beginner's Guide to Making Money Online",
        subtitle='PILLAR 1',
        cover_image=cover,
    )

    first_chapter_done = False
    for kind, val in BLOCKS:
        if kind == 'chapter':
            if first_chapter_done:
                doc.add_page_break()
            first_chapter_done = True
            add_styled_heading(doc, val, level=1)
        elif kind == 'h2':
            add_styled_heading(doc, val, level=2)
        elif kind == 'body':
            add_body_text(doc, val)
        elif kind == 'bullets':
            _bullets(doc, val)
        elif kind == 'tip':
            add_expert_tip(doc, val)
        elif kind == 'checklist':
            add_action_checklist(doc, val)
        elif kind == 'mistake':
            add_common_mistake(doc, val)
        elif kind == 'example':
            add_example_box(doc, val)
        elif kind == 'case':
            add_case_study(doc, val)
        elif kind == 'expert_tip_final':
            add_expert_tip(doc, val)

    add_closing_page(doc)
    return save_to_buffer(doc)


if __name__ == '__main__':
    buf = generate_pillar1_document()
    with open('/app/backend/static/Pillar_1_Making_Money_Online.docx', 'wb') as f:
        f.write(buf.read())
    print('Pillar 1 document generated successfully!')
