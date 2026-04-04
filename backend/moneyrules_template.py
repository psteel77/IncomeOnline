"""
MoneyRules - Reusable branded Word document template for Income Online.
Features: pink/purple page border, 'IncomeOnline' branding bottom-right, page numbers.
"""
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from io import BytesIO


# Brand colors
PURPLE = RGBColor(0x6B, 0x21, 0xA8)
PINK = RGBColor(0xDB, 0x27, 0x77)
ORANGE = RGBColor(0xEA, 0x58, 0x0C)
DARK = RGBColor(0x1E, 0x1B, 0x4B)
GREY = RGBColor(0x4B, 0x55, 0x63)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

# Border color for pages (pink-purple)
BORDER_COLOR = 'DB2777'


def set_cell_shading(cell, color_hex):
    """Set background color of a table cell"""
    shading = cell._element.get_or_add_tcPr()
    shading_elem = shading.makeelement(qn('w:shd'), {
        qn('w:fill'): color_hex,
        qn('w:val'): 'clear'
    })
    shading.append(shading_elem)


def _add_page_borders(section):
    """Add pink/purple decorative borders to the page."""
    sectPr = section._sectPr
    pgBorders = sectPr.makeelement(qn('w:pgBorders'), {
        qn('w:offsetFrom'): 'page'
    })
    for edge in ['top', 'left', 'bottom', 'right']:
        border = pgBorders.makeelement(qn(f'w:{edge}'), {
            qn('w:val'): 'single',
            qn('w:sz'): '24',
            qn('w:space'): '24',
            qn('w:color'): BORDER_COLOR,
        })
        pgBorders.append(border)
    sectPr.append(pgBorders)


def _add_footer(section):
    """Add footer with page number (left) and IncomeOnline branding (right)."""
    footer = section.footer
    footer.is_linked_to_previous = False
    para = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    para.clear()
    para.alignment = WD_ALIGN_PARAGRAPH.LEFT

    # Create a tab stop at the right margin for right-aligned text
    pPr = para._element.get_or_add_pPr()
    tabs = pPr.makeelement(qn('w:tabs'), {})
    tab_right = tabs.makeelement(qn('w:tab'), {
        qn('w:val'): 'right',
        qn('w:pos'): '9360',  # ~6.5 inches in twips
    })
    tabs.append(tab_right)
    pPr.append(tabs)

    # Page number on left
    run_label = para.add_run('Page ')
    run_label.font.size = Pt(9)
    run_label.font.color.rgb = GREY

    # Insert page number field
    fldChar1 = run_label._element.makeelement(qn('w:fldChar'), {qn('w:fldCharType'): 'begin'})
    run_pg = para.add_run()
    run_pg._element.append(fldChar1)
    instrText = run_pg._element.makeelement(qn('w:instrText'), {qn('xml:space'): 'preserve'})
    instrText.text = ' PAGE '
    run_pg2 = para.add_run()
    run_pg2._element.append(instrText)
    fldChar2 = run_pg2._element.makeelement(qn('w:fldChar'), {qn('w:fldCharType'): 'end'})
    run_pg3 = para.add_run()
    run_pg3._element.append(fldChar2)

    # Tab to right side
    run_tab = para.add_run('\t')
    run_tab.font.size = Pt(9)

    # IncomeOnline branding on right
    run_brand = para.add_run('www.incomeonline.info')
    run_brand.font.size = Pt(9)
    run_brand.font.color.rgb = PINK
    run_brand.font.bold = True


def create_moneyrules_document(title, subtitle=''):
    """
    Create a branded MoneyRules document with borders, page numbers, and branding.

    Args:
        title: The main document title (e.g. "The Rule of 72")
        subtitle: Optional subtitle

    Returns:
        A python-docx Document object ready for content to be added.
    """
    doc = Document()

    # Set default font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = DARK

    # Set margins and add borders/footer to all sections
    for section in doc.sections:
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)
        _add_page_borders(section)
        _add_footer(section)

    return doc


def add_title_page(doc, title, subtitle, tagline=''):
    """Add a branded title page."""
    for _ in range(5):
        doc.add_paragraph()

    # MoneyRules series label
    series = doc.add_paragraph()
    series.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = series.add_run('MONEYRULES SERIES')
    run.font.size = Pt(14)
    run.font.color.rgb = PINK
    run.font.bold = True
    run.font.letter_spacing = Pt(3)

    doc.add_paragraph()

    # Title
    title_para = doc.add_paragraph()
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title_para.add_run(title.upper())
    run.font.size = Pt(40)
    run.font.color.rgb = PURPLE
    run.bold = True

    # Subtitle
    if subtitle:
        sub_para = doc.add_paragraph()
        sub_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = sub_para.add_run(subtitle)
        run.font.size = Pt(18)
        run.font.color.rgb = PINK

    # Tagline
    if tagline:
        doc.add_paragraph()
        tag_para = doc.add_paragraph()
        tag_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = tag_para.add_run(tagline)
        run.font.size = Pt(12)
        run.font.color.rgb = GREY
        run.italic = True

    for _ in range(5):
        doc.add_paragraph()

    # Branding
    brand = doc.add_paragraph()
    brand.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = brand.add_run('Brought to you by Income Online')
    run.font.size = Pt(14)
    run.font.color.rgb = PURPLE
    run.bold = True

    url = doc.add_paragraph()
    url.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = url.add_run('www.incomeonline.info')
    run.font.size = Pt(11)
    run.font.color.rgb = ORANGE

    doc.add_page_break()


def add_styled_heading(doc, text, level=1):
    """Add a heading with branded colors."""
    heading = doc.add_heading(text, level=level)
    for run in heading.runs:
        if level == 1:
            run.font.color.rgb = PURPLE
            run.font.size = Pt(26)
        elif level == 2:
            run.font.color.rgb = PINK
            run.font.size = Pt(18)
        elif level == 3:
            run.font.color.rgb = ORANGE
            run.font.size = Pt(14)
    return heading


def add_body_text(doc, text, bold=False, italic=False, size=Pt(11)):
    """Add styled body paragraph."""
    para = doc.add_paragraph()
    para.paragraph_format.space_after = Pt(8)
    para.paragraph_format.line_spacing = 1.4
    run = para.add_run(text)
    run.font.size = size
    run.font.color.rgb = DARK
    run.bold = bold
    run.italic = italic
    return para


def add_highlight_box(doc, text):
    """Add a purple highlighted box."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.cell(0, 0)
    set_cell_shading(cell, 'F3E8FF')
    para = cell.paragraphs[0]
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = para.add_run(text)
    run.font.size = Pt(12)
    run.font.color.rgb = PURPLE
    run.bold = True
    tc = cell._element
    tcPr = tc.get_or_add_tcPr()
    borders = tcPr.makeelement(qn('w:tcBorders'), {})
    for edge in ['top', 'left', 'bottom', 'right']:
        border = borders.makeelement(qn(f'w:{edge}'), {
            qn('w:val'): 'single',
            qn('w:sz'): '12',
            qn('w:color'): '6B21A8',
            qn('w:space'): '0'
        })
        borders.append(border)
    tcPr.append(borders)
    doc.add_paragraph()


def add_branded_table(doc, headers, data, header_color='6B21A8'):
    """Add a branded table with colored headers."""
    table = doc.add_table(rows=1 + len(data), cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    for i, header in enumerate(headers):
        cell = table.cell(0, i)
        cell.text = ''
        para = cell.paragraphs[0]
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = para.add_run(header)
        run.font.size = Pt(10)
        run.font.color.rgb = WHITE
        run.bold = True
        set_cell_shading(cell, header_color)

    for row_idx, row_data in enumerate(data):
        for col_idx, cell_text in enumerate(row_data):
            cell = table.cell(row_idx + 1, col_idx)
            cell.text = ''
            para = cell.paragraphs[0]
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = para.add_run(str(cell_text))
            run.font.size = Pt(10)
            run.font.color.rgb = DARK
            if row_idx % 2 == 0:
                set_cell_shading(cell, 'F3E8FF')

    doc.add_paragraph()
    return table


def add_closing_page(doc):
    """Add the standard closing page with branding."""
    doc.add_paragraph()
    doc.add_paragraph()

    final = doc.add_paragraph()
    final.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = final.add_run('Thank you for reading!')
    run.font.size = Pt(16)
    run.font.color.rgb = PURPLE
    run.bold = True

    brand_final = doc.add_paragraph()
    brand_final.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = brand_final.add_run('Income Online — Your Guide to Earning More')
    run.font.size = Pt(13)
    run.font.color.rgb = PINK

    url_final = doc.add_paragraph()
    url_final.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = url_final.add_run('www.incomeonline.info')
    run.font.size = Pt(12)
    run.font.color.rgb = ORANGE
    run.bold = True

    doc.add_paragraph()

    copyright_para = doc.add_paragraph()
    copyright_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = copyright_para.add_run(
        '© 2025 Income Online. All Rights Reserved.\n'
        'This document is for educational purposes only and does not constitute financial advice.'
    )
    run.font.size = Pt(9)
    run.font.color.rgb = GREY
    run.italic = True


def save_to_buffer(doc):
    """Save document to a BytesIO buffer and return it."""
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer
