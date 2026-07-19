"""
PILLAR 2 — "Affiliate Marketing: Building Your First Passive Income Stream".

Regenerates the client's Pillar 2 guide through the branded MoneyRules template,
formatted identically to Pillar 1 (Montserrat bold, purple/pink/orange scheme,
branded chapter panels on new pages, page borders, coloured Expert Tip / Example /
Action Checklist / Common Mistake / Case Study callouts that never split or orphan).

Content is verbatim from the client's supplied .docx.
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


BLOCKS = [
    ('chapter', 'Introduction'),
    ('body', "Affiliate marketing is one of the simplest and most accessible ways to begin earning money online."),
    ('body', "You recommend products or services that genuinely help other people and earn a commission when someone purchases through your referral link. Success comes from solving problems and building trust rather than chasing quick commissions."),

    ('chapter', 'Chapter 1 – What Affiliate Marketing Actually Is'),
    ('body', "Affiliate marketing connects customers with businesses. The business gains a customer, the customer finds a solution and you earn a commission."),
    ('tip', 'Think like a trusted adviser, not a salesperson.'),
    ('example', 'A helpful camera buying guide can earn commissions by genuinely helping readers.'),
    ('checklist', ['List three subjects you already know well.']),

    ('chapter', 'Chapter 2 – How Affiliate Marketing Works'),
    ('body', "Join an affiliate programme, receive your tracking link, create useful content, attract visitors and earn commissions when they buy."),
    ('mistake', 'Chasing commission rates instead of helping readers.'),

    ('chapter', 'Chapter 3 – Choosing the Right Niche'),
    ('body', "A good niche has demand, products to recommend and is a subject you enjoy."),
    ('tip', 'Choose a niche you can still enjoy in three years.'),

    ('chapter', 'Chapter 4 – Creating Helpful Content'),
    ('body', "Useful content solves specific problems better than competitors."),
    ('example', "'Which Laptop Should You Buy for Working from Home?' is stronger than 'Best Laptops'."),
    ('checklist', ['Ask if every article genuinely helps the reader.']),

    ('chapter', 'Chapter 5 – Building Trust Before Income'),
    ('body', "Trust is your greatest long-term asset."),
    ('tip', 'Reputation compounds faster than commissions.'),

    ('chapter', 'Chapter 6 – The Best Affiliate Programmes for Beginners'),
    ('body', "Consider Amazon Associates, Awin, CJ Affiliate, Impact, PartnerStack, Shopify, Canva, Fiverr, Adobe and SEMrush."),
    ('mistake', 'Joining too many programmes immediately.'),

    ('chapter', 'Chapter 7 – SEO for Affiliate Websites'),
    ('body', "SEO brings visitors. Focus on useful articles that answer real questions."),
    ('checklist', ['Write five articles answering five common questions.']),

    ('chapter', 'Chapter 8 – Your First 90-Day Affiliate Plan'),
    ('body', "Month 1: Choose a niche and publish four articles."),
    ('body', "Month 2: Publish weekly and build an email list."),
    ('body', "Month 3: Improve existing content and monitor results."),
    ('tip', 'Experience is your greatest competitive advantage.'),

    ('chapter', 'End of Pillar 2'),
    ('body', "You now understand the fundamentals of affiliate marketing and are ready to build your first long-term affiliate business."),
]


def generate_pillar2_document():
    from pillar_cover import generate_cover
    cover = generate_cover(
        'Pillar 2',
        ['Affiliate Marketing', 'Building Your First', 'Passive Income Stream'],
        '/tmp/pillar2_cover.png',
    )
    doc = create_moneyrules_document(
        title='Affiliate Marketing',
        subtitle='PILLAR 2',
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

    add_closing_page(doc)
    return save_to_buffer(doc)


if __name__ == '__main__':
    buf = generate_pillar2_document()
    with open('/app/backend/static/Pillar_2_Affiliate_Marketing.docx', 'wb') as f:
        f.write(buf.read())
    print('Pillar 2 document generated successfully!')
