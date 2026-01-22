import asyncio
from playwright.async_api import async_playwright
import os

BASE_URL = "https://work-from-home-6.preview.emergentagent.com"

# Main pages to capture (excluding admin and verify which need auth)
# Note: Donate section is now integrated into the Home page
PAGES = [
    {"name": "Home", "path": "/", "filename": "01_home.pdf"},
    {"name": "Success Stories", "path": "/success-stories", "filename": "02_success_stories.pdf"},
]

async def generate_pdfs():
    output_dir = "/app/website_pdfs"
    os.makedirs(output_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        pdf_files = []
        
        for page_info in PAGES:
            print(f"Generating PDF for: {page_info['name']}...")
            
            page = await browser.new_page()
            await page.set_viewport_size({"width": 1280, "height": 900})
            
            url = f"{BASE_URL}{page_info['path']}"
            await page.goto(url, wait_until="networkidle", timeout=60000)
            
            # Wait for content to load
            await page.wait_for_timeout(3000)
            
            # Scroll down to load lazy content
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(2000)
            await page.evaluate("window.scrollTo(0, 0)")
            await page.wait_for_timeout(1000)
            
            output_path = os.path.join(output_dir, page_info['filename'])
            
            await page.pdf(
                path=output_path,
                format="A4",
                print_background=True,
                margin={"top": "20px", "bottom": "20px", "left": "20px", "right": "20px"}
            )
            
            pdf_files.append(output_path)
            print(f"  ✓ Saved: {output_path}")
            
            await page.close()
        
        await browser.close()
        
        print(f"\n✅ All PDFs generated successfully!")
        print(f"📁 Location: {output_dir}")
        print(f"📄 Files created:")
        for f in pdf_files:
            print(f"   - {f}")
        
        return pdf_files

if __name__ == "__main__":
    asyncio.run(generate_pdfs())
