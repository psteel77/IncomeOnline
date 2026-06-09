"""
Premium Pack bundler — $12.99 product.

Creates a single ZIP containing:
  - All 10 free MoneyRules guides (.docx)
  - 2 EXCLUSIVE premium-only guides (.docx) not available free
  - 5 Excel spreadsheet templates (.xlsx) the user can edit
  - A welcome/readme PDF
"""
import io
import os
import zipfile
from datetime import datetime, timezone

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from moneyrules_template import (
    create_moneyrules_document, add_title_page, add_styled_heading,
    add_body_text, add_highlight_box, add_branded_table, add_closing_page,
    save_to_buffer, PURPLE, BODY_TEXT, GREY
)
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')
PREMIUM_FILE = 'MoneyRules_Premium_Pack.zip'
PREMIUM_PATH = os.path.join(STATIC_DIR, PREMIUM_FILE)

# Style palette
PURPLE_HEX = '7C3AED'
PINK_HEX = 'DB2777'
AMBER_HEX = 'F59E0B'
DARK_HEX = '1F2937'


# ---------------------------------------------------------------
# Helpers for the Excel templates
# ---------------------------------------------------------------

def _header_style(cell, fill_hex=PURPLE_HEX):
    cell.font = Font(name='Calibri', size=12, bold=True, color='FFFFFF')
    cell.fill = PatternFill('solid', fgColor=fill_hex)
    cell.alignment = Alignment(horizontal='center', vertical='center')
    thin = Side(border_style='thin', color='CCCCCC')
    cell.border = Border(left=thin, right=thin, top=thin, bottom=thin)


def _title_row(ws, row, text, col_span, fill_hex=PURPLE_HEX):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=col_span)
    c = ws.cell(row=row, column=1, value=text)
    c.font = Font(name='Georgia', size=16, bold=True, color='FFFFFF')
    c.fill = PatternFill('solid', fgColor=fill_hex)
    c.alignment = Alignment(horizontal='center', vertical='center')
    ws.row_dimensions[row].height = 28


def _autosize(ws, widths):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w


# ---------------------------------------------------------------
# Spreadsheet 1 — 50/30/20 Budget Tracker
# ---------------------------------------------------------------

def _spreadsheet_budget_tracker():
    wb = Workbook(); ws = wb.active; ws.title = '50-30-20 Budget'
    _title_row(ws, 1, 'MoneyRules · 50/30/20 Budget Tracker', 4)
    headers = ['Category', 'Monthly Amount £', 'Target £', 'Status']
    for i, h in enumerate(headers, 1):
        c = ws.cell(row=3, column=i, value=h); _header_style(c)

    ws['A4'] = 'Monthly take-home pay'; ws['B4'] = 2500
    ws['A4'].font = Font(bold=True)
    for r, label, formula in [
        (6, 'NEEDS (target 50%)', '=B4*0.5'),
        (7, 'WANTS (target 30%)', '=B4*0.3'),
        (8, 'SAVINGS (target 20%)', '=B4*0.2'),
    ]:
        ws.cell(row=r, column=1, value=label).font = Font(bold=True, color=PURPLE_HEX)
        ws.cell(row=r, column=3, value=formula).number_format = '£#,##0.00'

    needs_rows = [('Rent / Mortgage',), ('Council tax',), ('Utilities',), ('Groceries',), ('Transport',), ('Insurance',), ('Minimum debt payments',)]
    wants_rows = [('Eating out',), ('Subscriptions',), ('Shopping',), ('Entertainment',), ('Travel',)]
    savings_rows = [('Emergency fund',), ('ISA / Pension',), ('Goal-specific savings',)]

    row = 10
    for section, color, items in [('NEEDS', PURPLE_HEX, needs_rows), ('WANTS', PINK_HEX, wants_rows), ('SAVINGS', AMBER_HEX, savings_rows)]:
        ws.cell(row=row, column=1, value=section).font = Font(bold=True, size=12, color=color)
        row += 1
        start = row
        for (name,) in items:
            ws.cell(row=row, column=1, value=name)
            ws.cell(row=row, column=2, value=0).number_format = '£#,##0.00'
            row += 1
        # Subtotal
        ws.cell(row=row, column=1, value=f'  {section} total').font = Font(italic=True, bold=True)
        ws.cell(row=row, column=2, value=f'=SUM(B{start}:B{row-1})').number_format = '£#,##0.00'
        row += 2

    _autosize(ws, [28, 18, 18, 18])
    buf = io.BytesIO(); wb.save(buf); buf.seek(0); return buf


# ---------------------------------------------------------------
# Spreadsheet 2 — Debt Snowball Tracker
# ---------------------------------------------------------------

def _spreadsheet_debt_snowball():
    wb = Workbook(); ws = wb.active; ws.title = 'Debt Snowball'
    _title_row(ws, 1, 'MoneyRules · Debt Snowball Tracker', 6, fill_hex=PINK_HEX)

    headers = ['Debt Name', 'Starting Balance £', 'Minimum £/mo', 'APR %', 'Extra £/mo', 'Months to Pay Off']
    for i, h in enumerate(headers, 1):
        c = ws.cell(row=3, column=i, value=h); _header_style(c, PINK_HEX)
    # Sample rows
    samples = [
        ('Store card',         380,  25,  29.9, 250),
        ('Credit card A',     1200,  40,  19.9, 0),
        ('Overdraft',         1500,  30,  35.0, 0),
        ('Personal loan',     5400, 180,  12.5, 0),
    ]
    for i, (n, bal, mn, apr, extra) in enumerate(samples, start=4):
        ws.cell(row=i, column=1, value=n)
        ws.cell(row=i, column=2, value=bal).number_format = '£#,##0.00'
        ws.cell(row=i, column=3, value=mn).number_format = '£#,##0.00'
        ws.cell(row=i, column=4, value=apr).number_format = '0.0'
        ws.cell(row=i, column=5, value=extra).number_format = '£#,##0.00'
        # Months = ceil(balance / (min + extra))
        ws.cell(row=i, column=6, value=f'=ROUNDUP(B{i}/(C{i}+E{i}),0)')

    total_row = 4 + len(samples) + 1
    ws.cell(row=total_row, column=1, value='TOTAL DEBT').font = Font(bold=True)
    ws.cell(row=total_row, column=2, value=f'=SUM(B4:B{3+len(samples)})').number_format = '£#,##0.00'
    ws.cell(row=total_row, column=2).font = Font(bold=True)

    ws.cell(row=total_row + 2, column=1, value='Sort rows SMALLEST balance first. Pay minimums on all + extra on the top. As each clears, roll its payment into the next.').font = Font(italic=True, color='6B7280', size=10)
    ws.merge_cells(start_row=total_row+2, start_column=1, end_row=total_row+2, end_column=6)

    _autosize(ws, [22, 20, 18, 12, 18, 20])
    buf = io.BytesIO(); wb.save(buf); buf.seek(0); return buf


# ---------------------------------------------------------------
# Spreadsheet 3 — Compound Interest Calculator
# ---------------------------------------------------------------

def _spreadsheet_compound_calc():
    wb = Workbook(); ws = wb.active; ws.title = 'Compound Calc'
    _title_row(ws, 1, 'MoneyRules · Compound Interest Calculator', 5)

    inputs = [('Starting amount (P) £', 10000), ('Monthly contribution £', 200), ('Annual rate (%)', 7), ('Years', 25)]
    for i, (lbl, val) in enumerate(inputs, start=3):
        ws.cell(row=i, column=1, value=lbl).font = Font(bold=True)
        ws.cell(row=i, column=2, value=val)
    ws['B3'].number_format = '£#,##0.00'
    ws['B4'].number_format = '£#,##0.00'
    ws['B5'].number_format = '0.00'

    ws['A8'] = 'Year'; ws['B8'] = 'Deposits £'; ws['C8'] = 'Interest £'; ws['D8'] = 'Balance £'
    for col in range(1, 5):
        _header_style(ws.cell(row=8, column=col))

    # 30 year projection
    ws['A9'] = 0
    ws['B9'] = '=$B$3'
    ws['C9'] = 0
    ws['D9'] = '=$B$3'
    for r in range(10, 39):
        ws.cell(row=r, column=1, value=f'=A{r-1}+1')
        ws.cell(row=r, column=2, value=f'=B{r-1}+$B$4*12')
        ws.cell(row=r, column=3, value=f'=D{r-1}*($B$5/100)+$B$4*12*0.5*($B$5/100)')  # approximation
        ws.cell(row=r, column=4, value=f'=D{r-1}*(1+$B$5/100)+$B$4*12*(1+$B$5/200)')
        ws.cell(row=r, column=2).number_format = '£#,##0.00'
        ws.cell(row=r, column=3).number_format = '£#,##0.00'
        ws.cell(row=r, column=4).number_format = '£#,##0.00'

    _autosize(ws, [22, 18, 18, 18])
    buf = io.BytesIO(); wb.save(buf); buf.seek(0); return buf


# ---------------------------------------------------------------
# Spreadsheet 4 — Emergency Fund Progress Tracker
# ---------------------------------------------------------------

def _spreadsheet_emergency_fund():
    wb = Workbook(); ws = wb.active; ws.title = 'Emergency Fund'
    _title_row(ws, 1, 'MoneyRules · Emergency Fund Progress', 4, fill_hex=AMBER_HEX)

    ws['A3'] = 'Monthly essentials £'; ws['B3'] = 1500; ws['B3'].number_format = '£#,##0.00'
    ws['A4'] = 'Target (3 months)';     ws['B4'] = '=B3*3'; ws['B4'].number_format = '£#,##0.00'
    for r in [3, 4]:
        ws.cell(row=r, column=1).font = Font(bold=True)

    headers = ['Month', 'Contribution £', 'Running Total £', '% of Target']
    for i, h in enumerate(headers, 1):
        c = ws.cell(row=6, column=i, value=h); _header_style(c, AMBER_HEX)
    for i in range(1, 25):
        r = 6 + i
        ws.cell(row=r, column=1, value=f'Month {i}')
        ws.cell(row=r, column=2, value=0).number_format = '£#,##0.00'
        if i == 1:
            ws.cell(row=r, column=3, value=f'=B{r}').number_format = '£#,##0.00'
        else:
            ws.cell(row=r, column=3, value=f'=C{r-1}+B{r}').number_format = '£#,##0.00'
        ws.cell(row=r, column=4, value=f'=C{r}/$B$4').number_format = '0.0%'

    _autosize(ws, [14, 18, 20, 14])
    buf = io.BytesIO(); wb.save(buf); buf.seek(0); return buf


# ---------------------------------------------------------------
# Spreadsheet 5 — Net Worth Statement
# ---------------------------------------------------------------

def _spreadsheet_net_worth():
    wb = Workbook(); ws = wb.active; ws.title = 'Net Worth'
    _title_row(ws, 1, 'MoneyRules · Net Worth Statement', 3)

    ws['A3'] = 'ASSETS'; ws['A3'].font = Font(bold=True, color=PURPLE_HEX, size=12)
    asset_rows = ['Cash & savings', 'ISA investments', 'SIPP / pension', 'Property value', 'Vehicle value', 'Other assets']
    r = 4
    for a in asset_rows:
        ws.cell(row=r, column=1, value=a)
        ws.cell(row=r, column=2, value=0).number_format = '£#,##0.00'
        r += 1
    asset_total_row = r
    ws.cell(row=r, column=1, value='  TOTAL ASSETS').font = Font(bold=True)
    ws.cell(row=r, column=2, value=f'=SUM(B4:B{r-1})').number_format = '£#,##0.00'
    ws.cell(row=r, column=2).font = Font(bold=True, color=PURPLE_HEX)

    r += 2
    ws.cell(row=r, column=1, value='LIABILITIES').font = Font(bold=True, color=PINK_HEX, size=12)
    r += 1
    liab_start = r
    for l in ['Mortgage', 'Credit cards', 'Personal loans', 'Car finance', 'Student loan', 'Other debt']:
        ws.cell(row=r, column=1, value=l)
        ws.cell(row=r, column=2, value=0).number_format = '£#,##0.00'
        r += 1
    liab_total_row = r
    ws.cell(row=r, column=1, value='  TOTAL LIABILITIES').font = Font(bold=True)
    ws.cell(row=r, column=2, value=f'=SUM(B{liab_start}:B{r-1})').number_format = '£#,##0.00'
    ws.cell(row=r, column=2).font = Font(bold=True, color=PINK_HEX)

    r += 2
    ws.cell(row=r, column=1, value='NET WORTH').font = Font(bold=True, size=14, color='FFFFFF')
    ws.cell(row=r, column=1).fill = PatternFill('solid', fgColor=DARK_HEX)
    ws.cell(row=r, column=2, value=f'=B{asset_total_row}-B{liab_total_row}').number_format = '£#,##0.00'
    ws.cell(row=r, column=2).font = Font(bold=True, size=14, color='FFFFFF')
    ws.cell(row=r, column=2).fill = PatternFill('solid', fgColor=DARK_HEX)

    _autosize(ws, [24, 20])
    buf = io.BytesIO(); wb.save(buf); buf.seek(0); return buf


# ---------------------------------------------------------------
# Premium-exclusive Word guide: Wealth Building Roadmap
# ---------------------------------------------------------------

def _premium_guide_wealth_roadmap():
    doc = create_moneyrules_document(title='Wealth Building Roadmap', subtitle='From Age 20s to 60s — Your Decade-by-Decade Plan')
    add_title_page(doc, title='Wealth Roadmap',
        subtitle='Age-Appropriate Financial Moves for Every Decade',
        tagline='What to prioritise in your 20s, 30s, 40s, 50s and 60s\n— and what to stop worrying about.')

    add_styled_heading(doc, 'Introduction — Different Decades, Different Priorities', level=1)
    add_body_text(doc, 'Financial advice is often generic — "max your ISA!", "build an emergency fund!" — but the right move at 25 is dangerous at 55, and vice versa. This guide walks through each decade, covering what matters most, what to ignore, and the biggest mistakes specific to that age.')
    add_highlight_box(doc, 'Right strategy + right decade = compounding.\nRight strategy + wrong decade = wasted time.')
    doc.add_page_break()

    for decade_heading, priority, body, mistakes in [
        ('Your 20s — Build the Foundation', 'HABITS over returns',
         'Your 20s are NOT about getting rich quick. They\'re about building the habits and assets that compound silently for 40 years. Pay off high-interest debt, build your first £1,000 emergency fund, start any pension to claim employer match, begin investing £50-200/month in a global index fund ISA. The habit matters infinitely more than the amount.',
         ['Buying a new car on finance', 'Investing in individual stocks or crypto instead of index funds', 'Not claiming employer pension match — literally free money']),
        ('Your 30s — Capital + Real Estate', 'CAPITAL accumulation',
         'Your income should be growing meaningfully. Priorities shift to: 3-6 month emergency fund (now fully funded), first property (not necessarily a forever home), aggressive ISA + pension contributions, critical illness + life insurance if you have dependants. This is also when lifestyle creep quietly destroys most people — keep living below your rising income.',
         ['Upgrading lifestyle as income grows', 'Ignoring critical illness insurance', 'Buying "too much house" that locks in every £']),
        ('Your 40s — Peak Earnings Decade', 'SERIOUS acceleration',
         'For most people, 40s = peak earning years. This is when compound interest starts working visibly. Max your ISA (£20k) every year, seriously top up your pension (especially if higher-rate taxpayer — 40% relief). Review every insurance policy. Start thinking about kids\' university costs + parents\' care. Consider a second property or an income-producing asset.',
         ['Trying to help grown children financially before yourself', 'Ignoring will / estate planning', 'Chasing high-risk "catch-up" investments if you feel behind']),
        ('Your 50s — Consolidation & Clarity', 'DE-RISKING + legacy',
         'The finish line is finally visible. Reduce portfolio volatility gradually — shift some equities into bonds and cash. Clear all debt including mortgage if possible. Get will, LPA, and pension nominations water-tight. Consider the "bucket strategy": 2 yrs cash, 5 yrs bonds, rest in equities. Begin conversations with adult children about inheritance and care preferences.',
         ['Staying 100% equities 5 years before retirement', 'Neglecting tax-efficient withdrawal planning', 'Assuming state pension will be enough']),
        ('Your 60s — Decumulation & Joy', 'INCOME generation + lifestyle',
         'The investing game changes completely. Instead of accumulating, you\'re drawing down. Decide: annuity for safety, drawdown for flexibility, or a mix. Use ISA for flexible income (tax-free withdrawals), pension for tax-efficient main income (25% tax-free lump sum + taxed withdrawals). Travel, invest in health, and spend more than you think you "need" — you can\'t take it with you.',
         ['Drawing down pension too fast in the first 5 years', 'Ignoring inflation protection in annuity choice', 'Being too frugal — "final decade syndrome"']),
    ]:
        add_styled_heading(doc, decade_heading, level=1)
        add_body_text(doc, f'Priority: {priority}')
        add_body_text(doc, body)
        add_styled_heading(doc, 'Common Mistakes', level=2)
        for m in mistakes:
            p = doc.add_paragraph(m, style='List Bullet')
            for r in p.runs: r.font.size = Pt(11); r.font.color.rgb = BODY_TEXT
        doc.add_page_break()

    add_styled_heading(doc, 'Your Next 90 Days (Whatever Your Decade)', level=1)
    for t in [
        'Day 1: Identify your decade and the TWO top priorities above.',
        'Day 2-7: Fix anything critical (missed insurance, unclaimed pension match).',
        'Week 2-4: Review your ISA/SIPP contributions — are they in line with your decade?',
        'Month 2: Update your will, LPA, and pension nominations.',
        'Month 3: Set automated increases on all long-term contributions by 5%.',
    ]:
        p = doc.add_paragraph(t, style='List Number')
        for r in p.runs: r.font.size = Pt(11); r.font.color.rgb = BODY_TEXT

    add_closing_page(doc)
    return save_to_buffer(doc)


# ---------------------------------------------------------------
# Premium-exclusive Word guide: FIRE Playbook
# ---------------------------------------------------------------

def _premium_guide_fire_playbook():
    doc = create_moneyrules_document(title='The FIRE Playbook', subtitle='Financial Independence, Retire Early — A Complete Blueprint')
    add_title_page(doc, title='The FIRE Playbook',
        subtitle='Financial Independence, Retire Early',
        tagline='The 4% rule, the 25× target, lean vs fat FIRE,\nand the maths that makes early retirement possible.')

    add_styled_heading(doc, 'What is FIRE?', level=1)
    add_body_text(doc, 'FIRE stands for Financial Independence, Retire Early — a movement based on a simple observation: if you save aggressively while working, investment returns will eventually cover your living costs forever, freeing you from paid work decades before traditional retirement age.')
    add_highlight_box(doc, 'Financial Independence =\nPassive income > Your living expenses')
    doc.add_page_break()

    add_styled_heading(doc, 'The Two Rules Behind FIRE', level=1)
    add_styled_heading(doc, 'The 25× Rule', level=2)
    add_body_text(doc, 'Your FIRE number = 25 × your annual expenses. Spend £24,000/year? You need £600,000 invested. Spend £40,000/year? £1,000,000. The logic comes from the 4% Rule below.')
    add_styled_heading(doc, 'The 4% Rule', level=2)
    add_body_text(doc, 'Once you\'ve got 25× invested in diversified equities, you can safely withdraw 4% per year and your portfolio will typically last 30+ years, often growing rather than shrinking. Based on the "Trinity Study" of 1998, updated multiple times since.')
    doc.add_page_break()

    add_styled_heading(doc, 'FIRE Flavours', level=1)
    add_branded_table(doc,
        headers=['Flavour', 'Annual Spend', 'Target Number', 'Typical Timeline'],
        data=[
            ('Lean FIRE',   '£18,000',  '£450,000',    '10-15 years'),
            ('Regular FIRE','£30,000',  '£750,000',    '15-20 years'),
            ('Fat FIRE',    '£60,000',  '£1,500,000',  '20-25 years'),
            ('Coast FIRE',  'Varies',   'Enough to stop contributing', '8-12 years'),
            ('Barista FIRE','Partial',  '50-70% of full number',       '10-15 years'),
        ])
    doc.add_page_break()

    add_styled_heading(doc, 'Your Savings Rate Determines Your Timeline', level=1)
    add_body_text(doc, 'Assuming 7% real returns, the years to FIRE depend almost entirely on your SAVINGS RATE, not your income:')
    add_branded_table(doc,
        headers=['Savings Rate', 'Years to FIRE'],
        data=[
            ('10%',  '51 years'),
            ('20%',  '37 years'),
            ('30%',  '28 years'),
            ('40%',  '22 years'),
            ('50%',  '17 years'),
            ('60%',  '12.5 years'),
            ('70%',  '8.5 years'),
        ])
    add_highlight_box(doc, 'Doubling income has small effect on FIRE timeline.\nDoubling savings rate has huge effect.')
    doc.add_page_break()

    add_styled_heading(doc, 'The Six Levers', level=1)
    for lever in [
        '1. Earn more (side-hustles, career growth, negotiation).',
        '2. Spend less (housing + transport are 50-70% of most budgets).',
        '3. Save the difference aggressively.',
        '4. Invest in low-cost global index funds (0.1-0.25% expense ratio).',
        '5. Use tax wrappers (ISA + SIPP) to let compounding work undisturbed.',
        '6. Stay the course through market drops — they\'re features, not bugs.',
    ]:
        p = doc.add_paragraph(lever, style='List Bullet')
        for r in p.runs: r.font.size = Pt(11); r.font.color.rgb = BODY_TEXT
    doc.add_page_break()

    add_styled_heading(doc, 'Your FIRE Checklist', level=1)
    for t in [
        'Calculate your annual expenses honestly for 3 months.',
        'Multiply by 25 — that\'s your target number.',
        'Measure your current savings rate.',
        'Open an ISA and a SIPP if you haven\'t. Set direct debits.',
        'Choose your flavour (Lean / Regular / Fat / Coast / Barista).',
        'Check your timeline on the table above.',
        'Review every 6 months. Adjust as life changes.',
    ]:
        p = doc.add_paragraph(t, style='List Number')
        for r in p.runs: r.font.size = Pt(11); r.font.color.rgb = BODY_TEXT
    add_closing_page(doc)
    return save_to_buffer(doc)


# ---------------------------------------------------------------
# README / welcome letter
# ---------------------------------------------------------------

def _readme_docx():
    doc = create_moneyrules_document(title='MoneyRules Premium Pack', subtitle='Welcome & Contents')
    add_title_page(doc, title='Welcome',
        subtitle='MoneyRules Premium Pack',
        tagline='Thank you for supporting Income Online!\nHere\'s what\'s inside and how to use it.')

    add_styled_heading(doc, 'What\'s Inside', level=1)
    add_body_text(doc, 'This premium pack contains 12 print-ready PDF guides, 5 editable Excel spreadsheets, and this welcome letter. The guides are yours to keep, print, and refer back to as your financial journey evolves — and the spreadsheets are fully editable so you can plug in your own numbers.')

    add_styled_heading(doc, 'Guides (Print-ready PDF)', level=2)
    add_branded_table(doc,
        headers=['#', 'Title'],
        data=[
            ('1',  'The Rule of 72 — Investment Doubling'),
            ('2',  'The 50/30/20 Budget Rule'),
            ('3',  "Beginner's Guide to Passive Income"),
            ('4',  'The Debt Snowball Method'),
            ('5',  'Build a 3-Month Emergency Fund'),
            ('6',  'The Compound Interest Handbook'),
            ('7',  'UK Tax Basics for Freelancers'),
            ('8',  'UK Credit Score Masterclass'),
            ('9',  'ISA vs SIPP — Tax-Efficient Investing'),
            ('10', 'The Side-Hustle Quick-Start Guide'),
            ('11', 'Wealth Building Roadmap (PREMIUM-ONLY)'),
            ('12', 'The FIRE Playbook (PREMIUM-ONLY)'),
        ])

    add_styled_heading(doc, 'Excel Spreadsheet Templates', level=2)
    add_branded_table(doc,
        headers=['#', 'File', 'Use For'],
        data=[
            ('1', '50-30-20 Budget Tracker.xlsx',         'Track your monthly budget'),
            ('2', 'Debt Snowball Tracker.xlsx',           'Order debts, calculate payoff'),
            ('3', 'Compound Interest Calculator.xlsx',     'Model long-term investments'),
            ('4', 'Emergency Fund Progress.xlsx',         'Track fund building'),
            ('5', 'Net Worth Statement.xlsx',             'Quarterly net worth review'),
        ])

    add_styled_heading(doc, 'How to Use', level=1)
    add_body_text(doc, 'Start with the WELCOME LETTER (this file), then pick ONE PDF guide that speaks most to your current challenge — budget, debt, tax, investing. Read it, act on its 1-week action plan, then move to the next.')
    add_body_text(doc, 'Open the Excel templates in Microsoft Excel, Google Sheets, or Numbers. All formulas are live and editable.')
    add_highlight_box(doc, 'Your financial transformation is a marathon, not a sprint.\nOne guide per month = a complete overhaul in a year.')

    add_styled_heading(doc, 'Stay in Touch', level=1)
    add_body_text(doc, 'Visit www.incomeonline.info to discover 199+ platforms for earning online. New free guides ship every month — you\'ll be notified automatically as a Premium member.')
    add_closing_page(doc)
    return save_to_buffer(doc)


# ---------------------------------------------------------------
# Bundle everything into a single ZIP
# ---------------------------------------------------------------

def build_premium_pack():
    """
    Build the Premium Pack ZIP into /static.

    Guides are bundled as print-ready PDFs (built by build_guide_pdfs.py and
    committed to /static). Spreadsheets are generated fresh via openpyxl, so
    this function is runtime-safe (no LibreOffice needed in production). If a
    required PDF is missing, this raises so the build fails loudly rather than
    shipping an incomplete pack.
    """
    os.makedirs(STATIC_DIR, exist_ok=True)
    premium_dir = os.path.join(STATIC_DIR, 'premium')

    # archive name -> source PDF path
    pdf_members = [
        ('00_WELCOME_START_HERE.pdf',                 os.path.join(premium_dir, '00_WELCOME_START_HERE.pdf')),
        ('01_Rule_of_72.pdf',                          os.path.join(STATIC_DIR, 'The_Rule_of_72_Guide.pdf')),
        ('02_50-30-20_Budget.pdf',                     os.path.join(STATIC_DIR, 'The_50_30_20_Budget_Rule.pdf')),
        ('03_Passive_Income.pdf',                      os.path.join(STATIC_DIR, 'Passive_Income_Beginners_Guide.pdf')),
        ('04_Debt_Snowball.pdf',                       os.path.join(STATIC_DIR, 'The_Debt_Snowball_Method.pdf')),
        ('05_Emergency_Fund.pdf',                      os.path.join(STATIC_DIR, 'The_Emergency_Fund_Guide.pdf')),
        ('06_Compound_Interest.pdf',                   os.path.join(STATIC_DIR, 'Compound_Interest_Handbook.pdf')),
        ('07_UK_Tax_Basics.pdf',                       os.path.join(STATIC_DIR, 'UK_Tax_Basics_Freelancers.pdf')),
        ('08_UK_Credit_Score.pdf',                     os.path.join(STATIC_DIR, 'UK_Credit_Score_Masterclass.pdf')),
        ('09_ISA_vs_SIPP.pdf',                         os.path.join(STATIC_DIR, 'ISA_vs_SIPP_Complete_Guide.pdf')),
        ('10_Side_Hustle_Quick_Start.pdf',             os.path.join(STATIC_DIR, 'Side_Hustle_Quick_Start_Guide.pdf')),
        ('11_Wealth_Building_Roadmap_PREMIUM.pdf',     os.path.join(premium_dir, '11_Wealth_Building_Roadmap_PREMIUM.pdf')),
        ('12_The_FIRE_Playbook_PREMIUM.pdf',           os.path.join(premium_dir, '12_The_FIRE_Playbook_PREMIUM.pdf')),
    ]

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for archive_name, src_path in pdf_members:
            if not os.path.exists(src_path):
                raise FileNotFoundError(
                    f"Premium pack source PDF missing: {src_path}. "
                    f"Run `python build_guide_pdfs.py` first."
                )
            with open(src_path, 'rb') as f:
                zf.writestr(archive_name, f.read())

        # Spreadsheets — generated fresh (openpyxl works at runtime).
        zf.writestr('Spreadsheets/50-30-20_Budget_Tracker.xlsx',        _spreadsheet_budget_tracker().read())
        zf.writestr('Spreadsheets/Debt_Snowball_Tracker.xlsx',          _spreadsheet_debt_snowball().read())
        zf.writestr('Spreadsheets/Compound_Interest_Calculator.xlsx',    _spreadsheet_compound_calc().read())
        zf.writestr('Spreadsheets/Emergency_Fund_Progress.xlsx',         _spreadsheet_emergency_fund().read())
        zf.writestr('Spreadsheets/Net_Worth_Statement.xlsx',             _spreadsheet_net_worth().read())

    buf.seek(0)
    with open(PREMIUM_PATH, 'wb') as f:
        f.write(buf.read())

    size_mb = os.path.getsize(PREMIUM_PATH) / 1024 / 1024
    print(f'Premium Pack built: {PREMIUM_PATH} ({size_mb:.2f} MB)')
    return PREMIUM_PATH


if __name__ == '__main__':
    build_premium_pack()
