import asyncio
from playwright.async_api import async_playwright
import os

BASE_URL = "http://localhost:3000"
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBkZmdlbkBpbmNvbWVvbmxpbmUuaW5mbyIsImV4cCI6MTc2NTg4Nzc2MH0.RJnrVzeaqZRqLFKQZwY1mOq8deBZ3PZXxyaQRPNYLn8"

async def generate_real_website_pdf():
    """Generate PDF of the actual website with authentication"""
    output_dir = "/app/website_pdfs"
    os.makedirs(output_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()
        
        await page.set_viewport_size({"width": 1280, "height": 900})
        
        # Go to home page first to set up the context
        print("Loading home page...")
        await page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)
        
        # Set the real JWT token in localStorage (this is how the frontend stores auth)
        print("Setting authentication...")
        await page.evaluate(f'''
            localStorage.setItem('auth_token', '{JWT_TOKEN}');
        ''')
        
        # Reload to pick up the auth state
        print("Reloading with authentication...")
        await page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(4000)
        
        # Take a screenshot to check if authenticated view loaded
        await page.screenshot(path="/tmp/auth_home_check.png")
        print("Screenshot saved - checking authenticated state...")
        
        # Scroll through entire page to load all lazy content and images
        print("Loading all content (scrolling through page)...")
        
        # Get page height
        page_height = await page.evaluate("document.body.scrollHeight")
        print(f"Page height: {page_height}px")
        
        # Scroll incrementally
        scroll_position = 0
        scroll_step = 600
        while scroll_position < page_height:
            await page.evaluate(f"window.scrollTo(0, {scroll_position})")
            await page.wait_for_timeout(500)
            scroll_position += scroll_step
            # Update page height as content loads
            page_height = await page.evaluate("document.body.scrollHeight")
        
        # Scroll back to top
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(2000)
        
        # Generate the PDF
        output_path = os.path.join(output_dir, "incomeonline_complete.pdf")
        print(f"Generating PDF of entire website...")
        
        await page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            margin={"top": "10mm", "bottom": "10mm", "left": "10mm", "right": "10mm"}
        )
        
        # Get file size
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"✓ Main site PDF saved: {output_path} ({size_mb:.1f} MB)")
        
        # Also generate success stories page
        print("\nGenerating Success Stories page...")
        await page.goto(f"{BASE_URL}/success-stories", wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(3000)
        
        # Scroll through
        page_height = await page.evaluate("document.body.scrollHeight")
        scroll_position = 0
        while scroll_position < page_height:
            await page.evaluate(f"window.scrollTo(0, {scroll_position})")
            await page.wait_for_timeout(300)
            scroll_position += scroll_step
        
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(1000)
        
        success_path = os.path.join(output_dir, "success_stories.pdf")
        await page.pdf(
            path=success_path,
            format="A4",
            print_background=True,
            margin={"top": "10mm", "bottom": "10mm", "left": "10mm", "right": "10mm"}
        )
        
        success_size = os.path.getsize(success_path) / (1024 * 1024)
        print(f"✓ Success Stories PDF saved: {success_path} ({success_size:.1f} MB)")
        
        await browser.close()
        
        print(f"\n✅ All PDFs generated!")
        print(f"📄 Main site: {size_mb:.1f} MB")
        print(f"📄 Success Stories: {success_size:.1f} MB")
        
        return [output_path, success_path]

if __name__ == "__main__":
    asyncio.run(generate_real_website_pdf())
