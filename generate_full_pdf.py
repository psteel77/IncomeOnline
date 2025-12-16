import asyncio
from playwright.async_api import async_playwright
import os

BASE_URL = "https://moneyguide-2.preview.emergentagent.com"
VERIFY_TOKEN = "ra2bopgkjY2OVpVgOzdmJS2UCwwwiJmKp6exg8IteRI"

async def generate_full_pdf():
    output_dir = "/app/website_pdfs"
    os.makedirs(output_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()
        
        await page.set_viewport_size({"width": 1280, "height": 900})
        
        # First, verify the user to get authenticated access
        print("Authenticating user...")
        verify_url = f"{BASE_URL}/verify/{VERIFY_TOKEN}"
        await page.goto(verify_url, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(3000)
        
        # Now navigate to home page (should be authenticated)
        print("Navigating to authenticated home page...")
        await page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(3000)
        
        # Scroll through the entire page to load all lazy content
        print("Loading all content...")
        
        # Get page height and scroll incrementally
        for i in range(20):
            await page.evaluate(f"window.scrollTo(0, {i * 1000})")
            await page.wait_for_timeout(500)
        
        # Scroll back to top
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(1000)
        
        # Generate PDF of authenticated home page
        output_path = os.path.join(output_dir, "complete_website_full.pdf")
        print(f"Generating PDF...")
        
        await page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            margin={"top": "20px", "bottom": "20px", "left": "20px", "right": "20px"}
        )
        
        print(f"✓ Saved: {output_path}")
        
        # Also generate success stories page
        print("Generating Success Stories PDF...")
        await page.goto(f"{BASE_URL}/success-stories", wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)
        
        success_path = os.path.join(output_dir, "success_stories.pdf")
        await page.pdf(
            path=success_path,
            format="A4",
            print_background=True,
            margin={"top": "20px", "bottom": "20px", "left": "20px", "right": "20px"}
        )
        print(f"✓ Saved: {success_path}")
        
        await browser.close()
        
        print(f"\n✅ All PDFs generated successfully!")
        print(f"📁 Location: {output_dir}")
        
        # Get file sizes
        home_size = os.path.getsize(output_path) / (1024 * 1024)
        success_size = os.path.getsize(success_path) / (1024 * 1024)
        print(f"📄 complete_website_full.pdf: {home_size:.1f} MB")
        print(f"📄 success_stories.pdf: {success_size:.1f} MB")
        
        return [output_path, success_path]

if __name__ == "__main__":
    asyncio.run(generate_full_pdf())
