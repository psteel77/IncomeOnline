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
    },
    'budget-503020': {
        'title': 'The 50/30/20 Rule — Budget Guide',
        'download_path': '/api/pdf/budget-503020',
    },
}


class ResourceRequest(BaseModel):
    email: EmailStr
    resource: str
    consent: bool = False


@router.post("/resources/request-download")
async def request_resource_download(payload: ResourceRequest):
    """
    Email-capture gateway: stores the visitor's email against the requested
    Free Resource and returns the direct download URL. Newsletter opt-in is
    tracked via the `consent` flag so downloads never accidentally mail users.
    """
    from server import db

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
        'created_at': now,
    })

    return {
        'success': True,
        'resource': payload.resource,
        'title': resource['title'],
        'download_url': resource['download_path'],
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
