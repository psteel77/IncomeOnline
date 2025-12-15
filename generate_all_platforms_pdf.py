import asyncio
from playwright.async_api import async_playwright
import os

BASE_URL = "http://localhost:3000"

async def generate_full_platform_pdf():
    """Generate PDF from the special PDF view page showing all platforms"""
    output_dir = "/app/website_pdfs"
    os.makedirs(output_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        await page.set_viewport_size({"width": 1280, "height": 900})
        
        # Go to the PDF view page
        print("Loading PDF view page with all platforms...")
        await page.goto(f"{BASE_URL}/pdf-view", wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(5000)
        
        # Scroll through to load all content
        print("Scrolling to load all content...")
        for i in range(30):
            await page.evaluate(f"window.scrollTo(0, {i * 800})")
            await page.wait_for_timeout(300)
        
        # Scroll back to top
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(1000)
        
        # Take screenshot to verify
        await page.screenshot(path="/tmp/pdf_view_check.png")
        print("Screenshot saved to /tmp/pdf_view_check.png")
        
        # Generate PDF
        output_path = os.path.join(output_dir, "all_platforms_complete.pdf")
        print(f"Generating complete PDF with all platforms...")
        
        await page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            margin={"top": "20px", "bottom": "20px", "left": "20px", "right": "20px"}
        )
        
        print(f"✓ Saved: {output_path}")
        
        # Get file size
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"📄 File size: {size_mb:.1f} MB")
        
        await browser.close()
        
        return output_path

if __name__ == "__main__":
    asyncio.run(generate_full_platform_pdf())
