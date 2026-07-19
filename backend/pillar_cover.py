"""
Generates the branded IncomeOnline "Pillar" cover page as a full-page image,
matching the client's reference: deep-purple bleed background with soft colour
blobs, a centred white rounded card, the INCOME ONLINE logo in a purple/white
framed square, a pink "PILLAR N" label, a bold dark title and a short orange rule.

Output is a Letter-aspect PNG (8.5:11) suitable for a full-bleed page-1 image.
"""
import os
from PIL import Image, ImageDraw, ImageFont

# Letter aspect at 200 dpi
W, H = 1700, 2200

BG_PURPLE = (75, 31, 134)       # #4B1F86
BLOB_PURPLE = (139, 92, 246)    # #8B5CF6
BLOB_PURPLE_DK = (91, 42, 158)  # deeper purple
ORANGE = (255, 122, 24)         # #FF7A18
PINK_BLOB = (241, 91, 135)      # #F15B87
PINK_LABEL = (232, 53, 109)     # #E8356D
TITLE_DARK = (26, 22, 40)       # near-black
RULE_ORANGE = (249, 115, 22)    # #F97316
WHITE = (255, 255, 255)

FONT_DIR = '/usr/share/fonts/truetype/montserrat'
LOGO_PATH = '/app/frontend/public/earnhub-logo.png'


def _font(size, weight='700'):
    for name in (f'Montserrat-{weight}-normal.ttf', 'Montserrat-Bold.ttf',
                 'Montserrat-Regular.ttf'):
        p = os.path.join(FONT_DIR, name)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def _rounded(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def _text_w(draw, text, font):
    b = draw.textbbox((0, 0), text, font=font)
    return b[2] - b[0], b[3] - b[1]


def _autocrop_logo():
    img = Image.open(LOGO_PATH).convert('RGBA')
    # crop away near-white margins
    rgb = img.convert('RGB')
    px = rgb.load()
    w, h = rgb.size
    minx, miny, maxx, maxy = w, h, 0, 0
    step = 2
    for y in range(0, h, step):
        for x in range(0, w, step):
            r, g, b = px[x, y]
            if not (r > 244 and g > 244 and b > 244):
                minx = min(minx, x); miny = min(miny, y)
                maxx = max(maxx, x); maxy = max(maxy, y)
    pad = 12
    box = (max(0, minx - pad), max(0, miny - pad),
           min(w, maxx + pad), min(h, maxy + pad))
    return img.crop(box)


def generate_cover(pillar_label, title_lines, out_path):
    img = Image.new('RGB', (W, H), BG_PURPLE)
    draw = ImageDraw.Draw(img)

    # ---- decorative blobs (bleed off edges) ----
    draw.ellipse([-260, -300, 470, 430], fill=BLOB_PURPLE)          # top-left light purple
    draw.ellipse([-360, 470, 220, 1080], fill=BLOB_PURPLE)          # mid-left light purple
    _rounded(draw, [W - 560, -260, W + 260, 470], 300, ORANGE)      # top-right orange
    _rounded(draw, [W - 560, H - 620, W + 300, H + 300], 300, PINK_BLOB)  # bottom-right pink
    draw.ellipse([-320, H - 520, 360, H + 260], fill=BLOB_PURPLE_DK)      # bottom-left deep purple

    # ---- white card ----
    m_x, m_top, m_bot = int(W * 0.085), int(H * 0.05), int(H * 0.05)
    card = [m_x, m_top, W - m_x, H - m_bot]
    _rounded(draw, card, 46, WHITE)
    card_cx = (card[0] + card[2]) // 2
    card_inner_w = (card[2] - card[0]) - 220

    # ---- logo inside purple/white framed square ----
    logo = _autocrop_logo()
    frame = 300
    fx0 = card_cx - frame // 2
    fy0 = card[1] + int((card[3] - card[1]) * 0.11)
    # outer purple rounded square (frame), then white inner
    _rounded(draw, [fx0, fy0, fx0 + frame, fy0 + frame], 34, BG_PURPLE)
    inset = 12
    _rounded(draw, [fx0 + inset, fy0 + inset, fx0 + frame - inset, fy0 + frame - inset], 26, WHITE)
    # paste logo scaled to fit the white area
    avail = frame - 2 * inset - 44
    lw, lh = logo.size
    scale = min(avail / lw, avail / lh)
    logo = logo.resize((max(1, int(lw * scale)), max(1, int(lh * scale))), Image.LANCZOS)
    lx = fx0 + (frame - logo.size[0]) // 2
    ly = fy0 + (frame - logo.size[1]) // 2
    img.paste(logo, (lx, ly), logo)

    y = fy0 + frame + 120

    # ---- PILLAR label ----
    label_font = _font(46, '700')
    lab_txt = pillar_label.upper()
    _, lh_ = _text_w(draw, lab_txt, label_font)
    _draw_tracked(draw, lab_txt, label_font, card_cx, y, PINK_LABEL, tracking=9)
    y += lh_ + 66

    # ---- title (auto-fit) ----
    size = 108
    title_font = _font(size, '700')
    while size > 48:
        title_font = _font(size, '700')
        if max(_text_w(draw, ln, title_font)[0] for ln in title_lines) <= card_inner_w:
            break
        size -= 4
    line_h = int(size * 1.18)
    for ln in title_lines:
        tw, _ = _text_w(draw, ln, title_font)
        draw.text((card_cx - tw // 2, y), ln, font=title_font, fill=TITLE_DARK)
        y += line_h

    # ---- orange rule ----
    y += 34
    rule_w = int(card_inner_w * 0.42)
    draw.rounded_rectangle([card_cx - rule_w // 2, y, card_cx + rule_w // 2, y + 9],
                           radius=5, fill=RULE_ORANGE)

    img.save(out_path, 'PNG')
    return out_path


def _draw_tracked(draw, text, font, cx, y, fill, tracking=6):
    widths = [_text_w(draw, ch, font)[0] for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = cx - total // 2
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=font, fill=fill)
        x += w + tracking


if __name__ == '__main__':
    generate_cover('Pillar 1',
                   ["The Complete Beginner's Guide", 'to Making Money Online'],
                   '/tmp/test_cover.png')
    print('ok')
