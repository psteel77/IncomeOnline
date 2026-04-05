"""
MoneyRules - Professional branded Word document template for Income Online.
Designed to look like a printed brochure, not a Word document.
Features: double-line page borders with shadow effect, professional serif typography,
'IncomeOnline' branding, page numbers.
"""
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Emu, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from io import BytesIO


# Brand colors — refined for print
DEEP_PURPLE = RGBColor(0x4C, 0x1D, 0x95)     # purple-900
PURPLE = RGBColor(0x6B, 0x21, 0xA8)           # purple-800
MEDIUM_PURPLE = RGBColor(0x7C, 0x3A, 0xED)    # purple-600
PINK = RGBColor(0xBE, 0x18, 0x5D)             # pink-700
ROSE = RGBColor(0xDB, 0x27, 0x77)             # pink-600
DARK_TEXT = RGBColor(0x1E, 0x1B, 0x4B)         # indigo-950
BODY_TEXT = RGBColor(0x33, 0x33, 0x3D)         # near-black warm
GREY = RGBColor(0x64, 0x74, 0x8B)             # slate-500
LIGHT_GREY = RGBColor(0x94, 0xA3, 0xB8)       # slate-400
ACCENT_GOLD = RGBColor(0xB4, 0x5D, 0x09)      # amber-700
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

# Border hex
BORDER_OUTER = '4C1D95'   # deep purple
BORDER_INNER = 'BE185D'   # pink


def set_cell_shading(cell, color_hex):
    """Set background color of a table cell."""
    shading = cell._element.get_or_add_tcPr()
    shading_elem = shading.makeelement(qn('w:shd'), {
        qn('w:fill'): color_hex,
        qn('w:val'): 'clear'
    })
    shading.append(shading_elem)


def _set_cell_borders(cell, color='4C1D95', size='4'):
    """Set subtle borders on a table cell."""
    tc = cell._element
    tcPr = tc.get_or_add_tcPr()
    borders = tcPr.makeelement(qn('w:tcBorders'), {})
    for edge in ['top', 'left', 'bottom', 'right']:
        border = borders.makeelement(qn(f'w:{edge}'), {
            qn('w:val'): 'single',
            qn('w:sz'): size,
            qn('w:color'): color,
            qn('w:space'): '0'
        })
        borders.append(border)
    tcPr.append(borders)


def _add_page_borders(section):
    """
    Add professional double-line page borders with shadow effect.
    Uses thinThickSmallGap for a 3D shadow-like appearance.
    """
    sectPr = section._sectPr

    pgBorders = sectPr.makeelement(qn('w:pgBorders'), {
        qn('w:offsetFrom'): 'page'
    })

    # Outer border: thick + thin combo = shadow illusion
    border_configs = {
        'top':    {'val': 'thinThickSmallGap', 'sz': '36', 'space': '20', 'color': BORDER_OUTER},
        'bottom': {'val': 'thickThinSmallGap', 'sz': '36', 'space': '20', 'color': BORDER_OUTER},
        'left':   {'val': 'thinThickSmallGap', 'sz': '36', 'space': '20', 'color': BORDER_OUTER},
        'right':  {'val': 'thickThinSmallGap', 'sz': '36', 'space': '20', 'color': BORDER_OUTER},
    }

    for edge, cfg in border_configs.items():
        border = pgBorders.makeelement(qn(f'w:{edge}'), {
            qn('w:val'): cfg['val'],
            qn('w:sz'): cfg['sz'],
            qn('w:space'): cfg['space'],
            qn('w:color'): cfg['color'],
        })
        pgBorders.append(border)

    sectPr.append(pgBorders)


def _add_footer(section):
    """Add a professional footer with thin rule, page number and branding."""
    footer = section.footer
    footer.is_linked_to_previous = False

    # Add a thin purple rule above the footer
    rule_para = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    rule_para.clear()
    pPr = rule_para._element.get_or_add_pPr()
    pBdr = pPr.makeelement(qn('w:pBdr'), {})
    top_border = pBdr.makeelement(qn('w:top'), {
        qn('w:val'): 'single',
        qn('w:sz'): '6',
        qn('w:space'): '4',
        qn('w:color'): BORDER_OUTER,
    })
    pBdr.append(top_border)
    pPr.append(pBdr)

    rule_para.paragraph_format.space_before = Pt(0)
    rule_para.paragraph_format.space_after = Pt(2)

    # Tab stops: center + right
    tabs = pPr.makeelement(qn('w:tabs'), {})
    tab_center = tabs.makeelement(qn('w:tab'), {
        qn('w:val'): 'center',
        qn('w:pos'): '4680',
    })
    tab_right = tabs.makeelement(qn('w:tab'), {
        qn('w:val'): 'right',
        qn('w:pos'): '9360',
    })
    tabs.append(tab_center)
    tabs.append(tab_right)
    pPr.append(tabs)

    # Left: page number
    run_pg_label = rule_para.add_run('Page ')
    run_pg_label.font.size = Pt(8)
    run_pg_label.font.color.rgb = GREY
    run_pg_label.font.name = 'Georgia'

    fldChar1 = run_pg_label._element.makeelement(qn('w:fldChar'), {qn('w:fldCharType'): 'begin'})
    run_pg = rule_para.add_run()
    run_pg._element.append(fldChar1)
    run_pg.font.size = Pt(8)
    run_pg.font.color.rgb = GREY
    run_pg.font.name = 'Georgia'

    instrText = run_pg._element.makeelement(qn('w:instrText'), {qn('xml:space'): 'preserve'})
    instrText.text = ' PAGE '
    run_pg2 = rule_para.add_run()
    run_pg2._element.append(instrText)
    run_pg2.font.size = Pt(8)
    run_pg2.font.color.rgb = GREY

    fldChar2 = run_pg2._element.makeelement(qn('w:fldChar'), {qn('w:fldCharType'): 'end'})
    run_pg3 = rule_para.add_run()
    run_pg3._element.append(fldChar2)

    # Center: MoneyRules series
    run_tab1 = rule_para.add_run('\t')
    run_series = rule_para.add_run('MoneyRules Series')
    run_series.font.size = Pt(7)
    run_series.font.color.rgb = LIGHT_GREY
    run_series.font.name = 'Georgia'
    run_series.font.italic = True

    # Right: branding
    run_tab2 = rule_para.add_run('\t')
    run_brand = rule_para.add_run('www.incomeonline.info')
    run_brand.font.size = Pt(8)
    run_brand.font.color.rgb = PINK
    run_brand.font.name = 'Georgia'
    run_brand.font.bold = True


def create_moneyrules_document(title='', subtitle=''):
    """
    Create a professional MoneyRules document with print-quality borders and typography.
    Returns a python-docx Document object.
    """
    doc = Document()

    # Default style: Georgia body text (serif = published feel)
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Georgia'
    font.size = Pt(10.5)
    font.color.rgb = BODY_TEXT

    # Paragraph spacing
    pf = style.paragraph_format
    pf.space_after = Pt(6)
    pf.line_spacing = 1.35

    # Heading styles
    for level, (size, color, spacing) in {
        1: (Pt(22), DEEP_PURPLE, Pt(24)),
        2: (Pt(15), PINK, Pt(16)),
        3: (Pt(12), ACCENT_GOLD, Pt(10)),
    }.items():
        h_style = doc.styles[f'Heading {level}']
        h_font = h_style.font
        h_font.name = 'Georgia'
        h_font.size = size
        h_font.color.rgb = color
        h_font.bold = True
        h_pf = h_style.paragraph_format
        h_pf.space_before = spacing
        h_pf.space_after = Pt(8)

    # Configure sections
    for section in doc.sections:
        section.top_margin = Cm(2.8)
        section.bottom_margin = Cm(2.5)
        section.left_margin = Cm(2.8)
        section.right_margin = Cm(2.8)
        _add_page_borders(section)
        _add_footer(section)

    return doc


def add_title_page(doc, title, subtitle='', tagline=''):
    """Add a professionally typeset title page."""
    for _ in range(3):
        doc.add_paragraph()

    # Thin decorative rule
    rule = doc.add_paragraph()
    rule.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pPr = rule._element.get_or_add_pPr()
    pBdr = pPr.makeelement(qn('w:pBdr'), {})
    bottom_border = pBdr.makeelement(qn('w:bottom'), {
        qn('w:val'): 'single',
        qn('w:sz'): '6',
        qn('w:space'): '1',
        qn('w:color'): BORDER_OUTER,
    })
    pBdr.append(bottom_border)
    pPr.append(pBdr)
    rule.paragraph_format.space_after = Pt(24)

    # Series label
    series = doc.add_paragraph()
    series.alignment = WD_ALIGN_PARAGRAPH.CENTER
    series.paragraph_format.space_after = Pt(4)
    run = series.add_run('M O N E Y R U L E S   S E R I E S')
    run.font.size = Pt(10)
    run.font.color.rgb = PINK
    run.font.name = 'Georgia'
    run.font.bold = True

    # Title
    title_para = doc.add_paragraph()
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_para.paragraph_format.space_after = Pt(8)
    run = title_para.add_run(title)
    run.font.size = Pt(36)
    run.font.color.rgb = DEEP_PURPLE
    run.font.name = 'Georgia'
    run.bold = True

    # Subtitle
    if subtitle:
        sub_para = doc.add_paragraph()
        sub_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        sub_para.paragraph_format.space_after = Pt(6)
        run = sub_para.add_run(subtitle)
        run.font.size = Pt(15)
        run.font.color.rgb = ROSE
        run.font.name = 'Georgia'
        run.italic = True

    # Tagline
    if tagline:
        doc.add_paragraph()
        tag_para = doc.add_paragraph()
        tag_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        tag_para.paragraph_format.space_after = Pt(4)
        run = tag_para.add_run(tagline)
        run.font.size = Pt(10)
        run.font.color.rgb = GREY
        run.font.name = 'Georgia'
        run.italic = True

    # Bottom decorative rule
    rule2 = doc.add_paragraph()
    rule2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pPr2 = rule2._element.get_or_add_pPr()
    pBdr2 = pPr2.makeelement(qn('w:pBdr'), {})
    top_border2 = pBdr2.makeelement(qn('w:top'), {
        qn('w:val'): 'single',
        qn('w:sz'): '6',
        qn('w:space'): '1',
        qn('w:color'): BORDER_OUTER,
    })
    pBdr2.append(top_border2)
    pPr2.append(pBdr2)

    for _ in range(4):
        doc.add_paragraph()

    # Branding block
    brand = doc.add_paragraph()
    brand.alignment = WD_ALIGN_PARAGRAPH.CENTER
    brand.paragraph_format.space_after = Pt(2)
    run = brand.add_run('Brought to you by')
    run.font.size = Pt(9)
    run.font.color.rgb = GREY
    run.font.name = 'Georgia'
    run.italic = True

    name = doc.add_paragraph()
    name.alignment = WD_ALIGN_PARAGRAPH.CENTER
    name.paragraph_format.space_after = Pt(2)
    run = name.add_run('Income Online')
    run.font.size = Pt(14)
    run.font.color.rgb = DEEP_PURPLE
    run.font.name = 'Georgia'
    run.bold = True

    url = doc.add_paragraph()
    url.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = url.add_run('www.incomeonline.info')
    run.font.size = Pt(9)
    run.font.color.rgb = PINK
    run.font.name = 'Georgia'

    doc.add_page_break()


def add_styled_heading(doc, text, level=1):
    """Add a heading using the document's configured heading styles."""
    heading = doc.add_heading(text, level=level)
    # Heading styles are already configured in create_moneyrules_document
    return heading


def add_body_text(doc, text, bold=False, italic=False, size=None):
    """Add a body paragraph with Georgia serif font."""
    para = doc.add_paragraph()
    para.paragraph_format.space_after = Pt(7)
    para.paragraph_format.line_spacing = 1.4
    run = para.add_run(text)
    run.font.size = size or Pt(10.5)
    run.font.color.rgb = BODY_TEXT
    run.font.name = 'Georgia'
    run.bold = bold
    run.italic = italic
    return para


def add_highlight_box(doc, text):
    """Add a professional key-takeaway box with left accent border."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Set table width
    tbl = table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else tbl.makeelement(qn('w:tblPr'), {})
    tblW = tblPr.makeelement(qn('w:tblW'), {qn('w:w'): '5000', qn('w:type'): 'pct'})
    tblPr.append(tblW)

    cell = table.cell(0, 0)
    set_cell_shading(cell, 'F5F3FF')  # very light purple

    para = cell.paragraphs[0]
    para.alignment = WD_ALIGN_PARAGRAPH.LEFT
    para.paragraph_format.space_before = Pt(10)
    para.paragraph_format.space_after = Pt(10)

    # Add left indent for breathing room
    pPr = para._element.get_or_add_pPr()
    ind = pPr.makeelement(qn('w:ind'), {qn('w:left'): '120', qn('w:right'): '120'})
    pPr.append(ind)

    run = para.add_run(text)
    run.font.size = Pt(10.5)
    run.font.color.rgb = DEEP_PURPLE
    run.font.name = 'Georgia'
    run.bold = True
    run.italic = True

    # Cell borders: thick left accent, subtle others
    tc = cell._element
    tcPr = tc.get_or_add_tcPr()
    borders = tcPr.makeelement(qn('w:tcBorders'), {})

    left_border = borders.makeelement(qn('w:left'), {
        qn('w:val'): 'single', qn('w:sz'): '36',
        qn('w:color'): BORDER_OUTER, qn('w:space'): '0'
    })
    borders.append(left_border)
    for edge in ['top', 'bottom', 'right']:
        b = borders.makeelement(qn(f'w:{edge}'), {
            qn('w:val'): 'single', qn('w:sz'): '4',
            qn('w:color'): 'D8B4FE', qn('w:space'): '0'  # light purple
        })
        borders.append(b)
    tcPr.append(borders)

    # Cell margins for padding
    tcMar = tcPr.makeelement(qn('w:tcMar'), {})
    for side in ['top', 'bottom', 'start', 'end']:
        m = tcMar.makeelement(qn(f'w:{side}'), {
            qn('w:w'): '160', qn('w:type'): 'dxa'
        })
        tcMar.append(m)
    tcPr.append(tcMar)

    doc.add_paragraph()  # spacing


def add_branded_table(doc, headers, data, header_color='4C1D95'):
    """Add a professional table with refined styling."""
    table = doc.add_table(rows=1 + len(data), cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Style header row
    for i, header in enumerate(headers):
        cell = table.cell(0, i)
        cell.text = ''
        set_cell_shading(cell, header_color)
        _set_cell_borders(cell, color=header_color, size='4')

        para = cell.paragraphs[0]
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        para.paragraph_format.space_before = Pt(5)
        para.paragraph_format.space_after = Pt(5)
        run = para.add_run(header)
        run.font.size = Pt(9)
        run.font.color.rgb = WHITE
        run.font.name = 'Georgia'
        run.bold = True

    # Style data rows
    for row_idx, row_data in enumerate(data):
        for col_idx, cell_text in enumerate(row_data):
            cell = table.cell(row_idx + 1, col_idx)
            cell.text = ''

            # Alternating subtle background
            if row_idx % 2 == 0:
                set_cell_shading(cell, 'F5F3FF')  # very light purple
            else:
                set_cell_shading(cell, 'FFFFFF')

            _set_cell_borders(cell, color='E9D5FF', size='2')  # light purple border

            para = cell.paragraphs[0]
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            para.paragraph_format.space_before = Pt(4)
            para.paragraph_format.space_after = Pt(4)
            run = para.add_run(str(cell_text))
            run.font.size = Pt(9)
            run.font.color.rgb = BODY_TEXT
            run.font.name = 'Georgia'

    doc.add_paragraph()
    return table


def add_closing_page(doc):
    """Add a professional closing page."""
    doc.add_paragraph()

    # Decorative rule
    rule = doc.add_paragraph()
    rule.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pPr = rule._element.get_or_add_pPr()
    pBdr = pPr.makeelement(qn('w:pBdr'), {})
    bottom_border = pBdr.makeelement(qn('w:bottom'), {
        qn('w:val'): 'single', qn('w:sz'): '6',
        qn('w:space'): '1', qn('w:color'): BORDER_OUTER,
    })
    pBdr.append(bottom_border)
    pPr.append(pBdr)

    doc.add_paragraph()

    final = doc.add_paragraph()
    final.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = final.add_run('Thank you for reading.')
    run.font.size = Pt(14)
    run.font.color.rgb = DEEP_PURPLE
    run.font.name = 'Georgia'
    run.italic = True

    doc.add_paragraph()

    brand_final = doc.add_paragraph()
    brand_final.alignment = WD_ALIGN_PARAGRAPH.CENTER
    brand_final.paragraph_format.space_after = Pt(2)
    run = brand_final.add_run('Income Online')
    run.font.size = Pt(12)
    run.font.color.rgb = DEEP_PURPLE
    run.font.name = 'Georgia'
    run.bold = True

    tagline = doc.add_paragraph()
    tagline.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tagline.paragraph_format.space_after = Pt(2)
    run = tagline.add_run('Your Guide to Earning More')
    run.font.size = Pt(10)
    run.font.color.rgb = PINK
    run.font.name = 'Georgia'
    run.italic = True

    url_final = doc.add_paragraph()
    url_final.alignment = WD_ALIGN_PARAGRAPH.CENTER
    url_final.paragraph_format.space_after = Pt(20)
    run = url_final.add_run('www.incomeonline.info')
    run.font.size = Pt(10)
    run.font.color.rgb = PINK
    run.font.name = 'Georgia'
    run.bold = True

    # Decorative rule
    rule2 = doc.add_paragraph()
    rule2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pPr2 = rule2._element.get_or_add_pPr()
    pBdr2 = pPr2.makeelement(qn('w:pBdr'), {})
    top_border2 = pBdr2.makeelement(qn('w:top'), {
        qn('w:val'): 'single', qn('w:sz'): '6',
        qn('w:space'): '1', qn('w:color'): BORDER_OUTER,
    })
    pBdr2.append(top_border2)
    pPr2.append(pBdr2)

    doc.add_paragraph()

    copyright_para = doc.add_paragraph()
    copyright_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = copyright_para.add_run(
        '\u00A9 2025 Income Online. All Rights Reserved.\n'
        'This document is for educational purposes only and does not constitute financial advice.'
    )
    run.font.size = Pt(7.5)
    run.font.color.rgb = LIGHT_GREY
    run.font.name = 'Georgia'
    run.italic = True


def save_to_buffer(doc):
    """Save document to a BytesIO buffer and return it."""
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer
