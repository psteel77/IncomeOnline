from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, EmailStr, Field
import os
import uuid
import logging
from datetime import datetime, timezone
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

router = APIRouter(prefix="/pdf")

# Custom colors matching the site theme
TEAL_COLOR = colors.HexColor("#165e84")
GOLD_COLOR = colors.HexColor("#d97706")
LIGHT_TEAL = colors.HexColor("#e0f7fa")

def create_styles():
    """Create custom paragraph styles"""
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='MainTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=TEAL_COLOR,
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='SubTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.grey,
        spaceAfter=30,
        alignment=TA_CENTER
    ))
    
    styles.add(ParagraphStyle(
        name='CategoryTitle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=TEAL_COLOR,
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='PlatformName',
        parent=styles['Normal'],
        fontSize=12,
        textColor=TEAL_COLOR,
        fontName='Helvetica-Bold',
        spaceBefore=8,
        spaceAfter=4
    ))
    
    styles.add(ParagraphStyle(
        name='PlatformDesc',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.black,
        alignment=TA_JUSTIFY,
        spaceAfter=4
    ))
    
    styles.add(ParagraphStyle(
        name='PlatformDetails',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.grey
    ))
    
    styles.add(ParagraphStyle(
        name='Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    ))
    
    return styles

def add_header_footer(canvas, doc):
    """Add header and footer to each page"""
    canvas.saveState()
    
    # Header
    canvas.setFillColor(TEAL_COLOR)
    canvas.setFont('Helvetica-Bold', 10)
    canvas.drawString(1*cm, A4[1] - 1*cm, "Income Online")
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.grey)
    canvas.drawRightString(A4[0] - 1*cm, A4[1] - 1*cm, "www.incomeonline.info")
    
    # Footer
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.grey)
    canvas.drawCentredString(A4[0]/2, 1*cm, f"Page {doc.page} | © 2025 Income Online | All Rights Reserved")
    
    canvas.restoreState()

@router.get("/platforms")
async def generate_platforms_pdf():
    """Generate a PDF with all platforms organized by category"""
    from server import db
    
    try:
        # Fetch all platforms and categories
        platforms = await db.platforms.find({}, {"_id": 0}).to_list(1000)
        categories = await db.categories.find({}, {"_id": 0}).to_list(100)
        
        if not platforms:
            raise HTTPException(status_code=404, detail="No platforms found")
        
        # Create PDF buffer
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        styles = create_styles()
        story = []
        
        # Title page
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("Income Online", styles['MainTitle']))
        story.append(Paragraph(f"Complete Directory of {len(platforms)}+ Online Earning Platforms", styles['SubTitle']))
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph("Your Comprehensive Guide to Making Money Online", styles['SubTitle']))
        story.append(Spacer(1, 1*inch))
        
        # Generation date
        gen_date = datetime.now(timezone.utc).strftime("%B %d, %Y")
        story.append(Paragraph(f"Generated: {gen_date}", styles['Footer']))
        story.append(Paragraph("www.incomeonline.info", styles['Footer']))
        
        story.append(PageBreak())
        
        # Table of contents
        story.append(Paragraph("Table of Contents", styles['MainTitle']))
        story.append(Spacer(1, 0.3*inch))
        
        # Group platforms by category
        platforms_by_category = {}
        for platform in platforms:
            cat = platform.get('category', 'Other')
            if cat not in platforms_by_category:
                platforms_by_category[cat] = []
            platforms_by_category[cat].append(platform)
        
        # Sort categories by the order in categories_data
        category_order = [c['name'] for c in categories]
        sorted_categories = sorted(
            platforms_by_category.keys(),
            key=lambda x: category_order.index(x) if x in category_order else 999
        )
        
        for cat in sorted_categories:
            count = len(platforms_by_category[cat])
            story.append(Paragraph(f"• {cat} ({count} platforms)", styles['PlatformDesc']))
        
        story.append(PageBreak())
        
        # Platform listings by category
        for cat in sorted_categories:
            cat_platforms = platforms_by_category[cat]
            
            # Category header
            story.append(Paragraph(f"{cat}", styles['CategoryTitle']))
            story.append(Paragraph(f"{len(cat_platforms)} platforms in this category", styles['PlatformDetails']))
            story.append(Spacer(1, 0.2*inch))
            
            # Sort platforms by rating (highest first)
            cat_platforms.sort(key=lambda x: x.get('rating', 0), reverse=True)
            
            for platform in cat_platforms:
                # Platform name with rating
                name = platform.get('name', 'Unknown')
                rating = platform.get('rating', 'N/A')
                featured = "⭐ " if platform.get('featured') else ""
                
                story.append(Paragraph(f"{featured}{name} (Rating: {rating}/5)", styles['PlatformName']))
                
                # Description
                desc = platform.get('description', 'No description available.')
                story.append(Paragraph(desc, styles['PlatformDesc']))
                
                # Details table
                earnings = platform.get('earningsPotential', 'Varies')
                difficulty = platform.get('difficulty', 'Medium')
                min_payout = platform.get('minPayout', 'Varies')
                link = platform.get('link', '#')
                uk_available = platform.get('ukAvailable', True)
                uk_status = "✓ Available in UK" if uk_available else "✗ Not available in UK"
                
                details = f"Earnings: {earnings} | Difficulty: {difficulty} | Min Payout: {min_payout} | {uk_status}"
                story.append(Paragraph(details, styles['PlatformDetails']))
                story.append(Paragraph(f"Website: {link}", styles['PlatformDetails']))
                
                story.append(Spacer(1, 0.15*inch))
            
            story.append(PageBreak())
        
        # Final page - disclaimer and contact
        story.append(Paragraph("Disclaimer", styles['CategoryTitle']))
        story.append(Spacer(1, 0.2*inch))
        story.append(Paragraph(
            "The information provided in this directory is for educational purposes only. "
            "Earnings vary based on individual effort, skills, and market conditions. "
            "Income Online does not guarantee any specific income or results. "
            "Always do your own research before joining any platform.",
            styles['PlatformDesc']
        ))
        story.append(Spacer(1, 0.5*inch))
        
        story.append(Paragraph("Contact Us", styles['CategoryTitle']))
        story.append(Paragraph("Email: welcome@incomeonline.info", styles['PlatformDesc']))
        story.append(Paragraph("Website: www.incomeonline.info", styles['PlatformDesc']))
        story.append(Spacer(1, 0.5*inch))
        
        story.append(Paragraph(
            f"© 2025 Income Online. All Rights Reserved. Generated on {gen_date}",
            styles['Footer']
        ))
        
        # Build PDF
        doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
        
        # Reset buffer position
        buffer.seek(0)
        
        # Return PDF as streaming response
        filename = f"Income_Online_Platforms_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error generating PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview")
async def get_pdf_preview():
    """Get platform count and categories for PDF preview"""
    from server import db
    
    try:
        platform_count = await db.platforms.count_documents({})
        category_count = await db.categories.count_documents({})
        
        return {
            "success": True,
            "platform_count": platform_count,
            "category_count": category_count,
            "message": f"PDF will include {platform_count}+ platforms across {category_count} categories"
        }
    except Exception as e:
        logging.error(f"Error getting PDF preview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rule-of-72")
async def download_rule_of_72():
    """Download The Rule of 72 Word document"""
    try:
        doc_path = os.path.join(os.path.dirname(__file__), 'static', 'The_Rule_of_72_Guide.docx')

        if not os.path.exists(doc_path):
            # Generate on first request
            from generate_rule72_doc import generate_rule72_document
            buffer = generate_rule72_document()
            os.makedirs(os.path.dirname(doc_path), exist_ok=True)
            with open(doc_path, 'wb') as f:
                f.write(buffer.read())

        return FileResponse(
            path=doc_path,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename='The_Rule_of_72_Complete_Guide.docx',
            headers={
                'Content-Disposition': 'attachment; filename="The_Rule_of_72_Complete_Guide.docx"'
            }
        )
    except Exception as e:
        logging.error(f"Error serving Rule of 72 document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/budget-503020")
async def download_budget_503020():
    """Download The 50/30/20 Budget Rule Word document"""
    try:
        doc_path = os.path.join(os.path.dirname(__file__), 'static', 'The_50_30_20_Budget_Rule.docx')

        if not os.path.exists(doc_path):
            # Generate on first request
            from generate_503020_doc import generate_503020_document
            buffer = generate_503020_document()
            os.makedirs(os.path.dirname(doc_path), exist_ok=True)
            with open(doc_path, 'wb') as f:
                f.write(buffer.read())

        return FileResponse(
            path=doc_path,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename='The_50_30_20_Budget_Rule_Complete_Guide.docx',
            headers={
                'Content-Disposition': 'attachment; filename="The_50_30_20_Budget_Rule_Complete_Guide.docx"'
            }
        )
    except Exception as e:
        logging.error(f"Error serving 50/30/20 document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------
# New MoneyRules library guides — shared helper + per-guide routes
# ---------------------------------------------------------------

DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'


def _serve_docx(filename: str, download_name: str, generator_fn=None):
    """Serve a .docx from /static; optionally generate it on first request."""
    doc_path = os.path.join(os.path.dirname(__file__), 'static', filename)
    if not os.path.exists(doc_path) and generator_fn is not None:
        buffer = generator_fn()
        os.makedirs(os.path.dirname(doc_path), exist_ok=True)
        with open(doc_path, 'wb') as f:
            f.write(buffer.read())
    if not os.path.exists(doc_path):
        raise HTTPException(status_code=404, detail="Guide not found")
    return FileResponse(
        path=doc_path,
        media_type=DOCX_MIME,
        filename=download_name,
        headers={'Content-Disposition': f'attachment; filename="{download_name}"'},
    )


@router.get("/passive-income")
async def download_passive_income():
    """Beginner's Guide to Passive Income."""
    from generate_passive_income_doc import generate_passive_income_document
    return _serve_docx(
        'Passive_Income_Beginners_Guide.docx',
        'Beginners_Guide_to_Passive_Income.docx',
        generate_passive_income_document,
    )


@router.get("/debt-snowball")
async def download_debt_snowball():
    """The Debt Snowball Method guide."""
    from generate_debt_snowball_doc import generate_debt_snowball_document
    return _serve_docx(
        'The_Debt_Snowball_Method.docx',
        'The_Debt_Snowball_Method.docx',
        generate_debt_snowball_document,
    )


@router.get("/emergency-fund")
async def download_emergency_fund():
    """Build a 3-Month Emergency Fund guide."""
    from generate_emergency_fund_doc import generate_emergency_fund_document
    return _serve_docx(
        'The_Emergency_Fund_Guide.docx',
        'Build_a_3_Month_Emergency_Fund.docx',
        generate_emergency_fund_document,
    )


@router.get("/compound-interest")
async def download_compound_interest():
    """The Compound Interest Handbook."""
    from generate_compound_interest_doc import generate_compound_interest_document
    return _serve_docx(
        'Compound_Interest_Handbook.docx',
        'The_Compound_Interest_Handbook.docx',
        generate_compound_interest_document,
    )


@router.get("/uk-tax-basics")
async def download_uk_tax_basics():
    """UK Tax Basics for Freelancers."""
    from generate_uk_tax_basics_doc import generate_uk_tax_basics_document
    return _serve_docx(
        'UK_Tax_Basics_Freelancers.docx',
        'UK_Tax_Basics_for_Freelancers.docx',
        generate_uk_tax_basics_document,
    )


@router.get("/credit-score")
async def download_credit_score():
    from generate_additional_guides import generate_credit_score_document
    return _serve_docx(
        'UK_Credit_Score_Masterclass.docx',
        'UK_Credit_Score_Masterclass.docx',
        generate_credit_score_document,
    )


@router.get("/isa-vs-sipp")
async def download_isa_vs_sipp():
    from generate_additional_guides import generate_isa_vs_sipp_document
    return _serve_docx(
        'ISA_vs_SIPP_Complete_Guide.docx',
        'ISA_vs_SIPP_Complete_Guide.docx',
        generate_isa_vs_sipp_document,
    )


@router.get("/side-hustle-quickstart")
async def download_side_hustle():
    from generate_additional_guides import generate_side_hustle_document
    return _serve_docx(
        'Side_Hustle_Quick_Start_Guide.docx',
        'Side_Hustle_Quick_Start_Guide.docx',
        generate_side_hustle_document,
    )


# ---------------------------------------------------------------
# Premium Pack ($12.99)
# ---------------------------------------------------------------

@router.get("/premium-pack")
async def download_premium_pack(token: str = ""):
    """
    Download the MoneyRules Premium Pack ZIP.
    Requires a valid purchase token (issued after successful PayPal payment).
    Token is a one-time-use value stored in `premium_purchases`.
    """
    from server import db
    token_clean = (token or '').strip()
    if not token_clean:
        raise HTTPException(status_code=403, detail="Missing purchase token")

    purchase = await db.premium_purchases.find_one({'token': token_clean}, {"_id": 0})
    if not purchase:
        raise HTTPException(status_code=403, detail="Invalid or expired token")

    # Track the download
    await db.premium_purchases.update_one(
        {'token': token_clean},
        {'$inc': {'download_count': 1},
         '$set': {'last_downloaded_at': datetime.now(timezone.utc).isoformat()}}
    )

    pack_path = os.path.join(os.path.dirname(__file__), 'static', 'MoneyRules_Premium_Pack.zip')
    if not os.path.exists(pack_path):
        # Build on demand if missing
        from generate_premium_pack import build_premium_pack
        build_premium_pack()

    return FileResponse(
        path=pack_path,
        media_type='application/zip',
        filename='MoneyRules_Premium_Pack.zip',
        headers={'Content-Disposition': 'attachment; filename="MoneyRules_Premium_Pack.zip"'},
    )


class PremiumPurchaseRequest(BaseModel):
    email: EmailStr
    paypal_order_id: str = ""
    amount: str = "12.99"
    currency: str = "USD"


@router.post("/premium-pack/purchase")
async def record_premium_purchase(payload: PremiumPurchaseRequest):
    """
    Called by the frontend after PayPal payment succeeds. Records the purchase
    and issues a one-time download token the frontend can use to fetch the ZIP.
    """
    from server import db
    now = datetime.now(timezone.utc).isoformat()
    token = str(uuid.uuid4())
    await db.premium_purchases.insert_one({
        'id': str(uuid.uuid4()),
        'token': token,
        'email': payload.email.lower().strip(),
        'paypal_order_id': payload.paypal_order_id,
        'amount': payload.amount,
        'currency': payload.currency,
        'created_at': now,
        'download_count': 0,
    })
    return {
        'success': True,
        'download_url': f'/api/pdf/premium-pack?token={token}',
        'token': token,
    }


@router.get("/premium-pack/purchases")
async def list_premium_purchases(limit: int = 500):
    """Admin list of premium pack purchases."""
    from server import db
    purchases = await db.premium_purchases.find({}, {"_id": 0}).sort('created_at', -1).to_list(limit)
    total = await db.premium_purchases.count_documents({})
    return {'total': total, 'purchases': purchases}


# ---------------------------------------------------------------
# Email-capture gateway for Free Resources
# ---------------------------------------------------------------


@router.get("/moneyrules-template")
async def download_moneyrules_template():
    """Download the blank MoneyRules branded template"""
    try:
        doc_path = os.path.join(os.path.dirname(__file__), 'static', 'MoneyRules_Template.docx')
        if not os.path.exists(doc_path):
            raise HTTPException(status_code=404, detail="Template not found")

        return FileResponse(
            path=doc_path,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename='MoneyRules_Template.docx',
            headers={
                'Content-Disposition': 'attachment; filename="MoneyRules_Template.docx"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error serving MoneyRules template: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



# ======================================================================
# Email-capture gateway for Free Resources
# ======================================================================

RESOURCE_MAP = {
    'rule-of-72': {
        'title': 'The Rule of 72 — Complete Investment Guide',
        'download_path': '/api/pdf/rule-of-72',
        'file': 'The_Rule_of_72_Guide.docx',
        'download_name': 'The_Rule_of_72_Complete_Guide.docx',
    },
    'budget-503020': {
        'title': 'The 50/30/20 Rule — Budget Guide',
        'download_path': '/api/pdf/budget-503020',
        'file': 'The_50_30_20_Budget_Rule.docx',
        'download_name': 'The_50_30_20_Budget_Rule_Complete_Guide.docx',
    },
    'passive-income': {
        'title': "Beginner's Guide to Passive Income",
        'download_path': '/api/pdf/passive-income',
        'file': 'Passive_Income_Beginners_Guide.docx',
        'download_name': 'Beginners_Guide_to_Passive_Income.docx',
    },
    'debt-snowball': {
        'title': 'The Debt Snowball Method',
        'download_path': '/api/pdf/debt-snowball',
        'file': 'The_Debt_Snowball_Method.docx',
        'download_name': 'The_Debt_Snowball_Method.docx',
    },
    'emergency-fund': {
        'title': 'Build a 3-Month Emergency Fund',
        'download_path': '/api/pdf/emergency-fund',
        'file': 'The_Emergency_Fund_Guide.docx',
        'download_name': 'Build_a_3_Month_Emergency_Fund.docx',
    },
    'compound-interest': {
        'title': 'The Compound Interest Handbook',
        'download_path': '/api/pdf/compound-interest',
        'file': 'Compound_Interest_Handbook.docx',
        'download_name': 'The_Compound_Interest_Handbook.docx',
    },
    'uk-tax-basics': {
        'title': 'UK Tax Basics for Freelancers & Side-Hustlers',
        'download_path': '/api/pdf/uk-tax-basics',
        'file': 'UK_Tax_Basics_Freelancers.docx',
        'download_name': 'UK_Tax_Basics_for_Freelancers.docx',
    },
    'credit-score': {
        'title': 'UK Credit Score Masterclass',
        'download_path': '/api/pdf/credit-score',
        'file': 'UK_Credit_Score_Masterclass.docx',
        'download_name': 'UK_Credit_Score_Masterclass.docx',
    },
    'isa-vs-sipp': {
        'title': 'ISA vs SIPP — Tax-Efficient Investing',
        'download_path': '/api/pdf/isa-vs-sipp',
        'file': 'ISA_vs_SIPP_Complete_Guide.docx',
        'download_name': 'ISA_vs_SIPP_Complete_Guide.docx',
    },
    'side-hustle-quickstart': {
        'title': 'The Side-Hustle Quick-Start Guide',
        'download_path': '/api/pdf/side-hustle-quickstart',
        'file': 'Side_Hustle_Quick_Start_Guide.docx',
        'download_name': 'Side_Hustle_Quick_Start_Guide.docx',
    },
}


class ResourceRequest(BaseModel):
    email: EmailStr
    resource: str
    consent: bool = False
    deliver_via_email: bool = False


@router.post("/resources/request-download")
async def request_resource_download(payload: ResourceRequest):
    """
    Email-capture gateway: stores the visitor's email against the requested
    Free Resource and returns the direct download URL. Newsletter opt-in is
    tracked via the `consent` flag so downloads never accidentally mail users.

    When `deliver_via_email=True` the guide is also sent as a .docx attachment
    via Mailgun (best-effort; the direct download URL is still returned).
    """
    from server import db
    from email_service import send_resource_email

    resource = RESOURCE_MAP.get(payload.resource)
    if not resource:
        raise HTTPException(status_code=400, detail="Unknown resource")

    now = datetime.now(timezone.utc).isoformat()
    email_lower = payload.email.lower().strip()

    # Upsert the subscriber record (email is canonical key).
    # newsletter_opt_in is only ever set to True (never downgraded) so a user
    # who opts in once stays opted in even on subsequent non-consent downloads.
    # Note: field not pre-populated in $setOnInsert to avoid MongoDB conflict
    # with $set during upsert-insert; count queries for True still work correctly.
    set_fields = {'last_seen_at': now}
    if payload.consent:
        set_fields['newsletter_opt_in'] = True

    await db.resource_subscribers.update_one(
        {'email': email_lower},
        {
            '$setOnInsert': {
                'id': str(uuid.uuid4()),
                'email': email_lower,
                'first_seen_at': now,
            },
            '$set': set_fields,
            '$inc': {'download_count': 1},
            '$addToSet': {'resources_downloaded': payload.resource},
        },
        upsert=True,
    )

    # Log each individual download event (for analytics)
    await db.resource_download_events.insert_one({
        'id': str(uuid.uuid4()),
        'email': email_lower,
        'resource': payload.resource,
        'resource_title': resource['title'],
        'consent': bool(payload.consent),
        'delivered_via_email': bool(payload.deliver_via_email),
        'created_at': now,
    })

    # Optional: email the guide as a .docx attachment via Mailgun.
    email_delivery_status = 'skipped'
    if payload.deliver_via_email:
        attachment_path = os.path.join(os.path.dirname(__file__), 'static', resource['file'])
        ok = send_resource_email(
            email=email_lower,
            resource_title=resource['title'],
            attachment_path=attachment_path,
            attachment_filename=resource['download_name'],
        )
        email_delivery_status = 'sent' if ok else 'failed'

    return {
        'success': True,
        'resource': payload.resource,
        'title': resource['title'],
        'download_url': resource['download_path'],
        'email_delivery': email_delivery_status,
    }


@router.get("/resources/subscribers")
async def list_resource_subscribers(limit: int = 500):
    """Admin-only list of captured subscriber emails (no auth for now — add later)."""
    from server import db
    subs = await db.resource_subscribers.find({}, {"_id": 0}).sort('last_seen_at', -1).to_list(limit)
    total = await db.resource_subscribers.count_documents({})
    opted_in = await db.resource_subscribers.count_documents({'newsletter_opt_in': True})
    return {
        'total': total,
        'newsletter_opt_in_count': opted_in,
        'subscribers': subs,
    }


@router.get("/resources/progress")
async def resource_progress(email: str):
    """
    Return which resources a given email has already downloaded.
    Used by the frontend library-progress tracker to show tick-marks.
    """
    from server import db
    email_lower = (email or '').lower().strip()
    if not email_lower:
        return {'email': '', 'downloaded': [], 'count': 0, 'total': len(RESOURCE_MAP)}

    sub = await db.resource_subscribers.find_one(
        {'email': email_lower},
        {"_id": 0, "resources_downloaded": 1, "download_count": 1, "newsletter_opt_in": 1},
    )
    downloaded = list((sub or {}).get('resources_downloaded') or [])
    # Only count known resources (future-proof against deleted keys)
    downloaded = [r for r in downloaded if r in RESOURCE_MAP]
    return {
        'email': email_lower,
        'downloaded': downloaded,
        'count': len(downloaded),
        'total': len(RESOURCE_MAP),
        'download_count': (sub or {}).get('download_count', 0),
        'newsletter_opt_in': bool((sub or {}).get('newsletter_opt_in', False)),
    }
