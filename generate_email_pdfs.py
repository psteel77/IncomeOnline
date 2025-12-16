import asyncio
from playwright.async_api import async_playwright
import os

async def generate_email_templates_pdf():
    """Generate PDF of email templates 3 and 4"""
    output_dir = "/app/website_pdfs"
    os.makedirs(output_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        await page.set_viewport_size({"width": 800, "height": 1000})
        
        # Generate PDF for Template 3 (Expired)
        print("Generating Email Template 3 PDF (Expired Subscription)...")
        template3_path = "/app/backend/email_templates/template_3_expired.html"
        await page.goto(f"file://{template3_path}", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        
        template3_pdf = os.path.join(output_dir, "email_template_3_expired.pdf")
        await page.pdf(
            path=template3_pdf,
            format="A4",
            print_background=True,
            margin={"top": "10mm", "bottom": "10mm", "left": "10mm", "right": "10mm"}
        )
        print(f"✓ Template 3 saved: {template3_pdf}")
        
        # Generate PDF for Template 4 (7-day Warning)
        print("Generating Email Template 4 PDF (7-Day Warning)...")
        template4_path = "/app/backend/email_templates/template_4_expiry_warning.html"
        await page.goto(f"file://{template4_path}", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        
        template4_pdf = os.path.join(output_dir, "email_template_4_warning.pdf")
        await page.pdf(
            path=template4_pdf,
            format="A4",
            print_background=True,
            margin={"top": "10mm", "bottom": "10mm", "left": "10mm", "right": "10mm"}
        )
        print(f"✓ Template 4 saved: {template4_pdf}")
        
        await browser.close()
        
        # Get file sizes
        t3_size = os.path.getsize(template3_pdf) / 1024
        t4_size = os.path.getsize(template4_pdf) / 1024
        
        print(f"\n✅ Email Template PDFs generated!")
        print(f"📄 Template 3 (Expired): {t3_size:.1f} KB")
        print(f"📄 Template 4 (Warning): {t4_size:.1f} KB")
        
        return [template3_pdf, template4_pdf]

if __name__ == "__main__":
    asyncio.run(generate_email_templates_pdf())
