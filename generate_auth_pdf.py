import asyncio
from playwright.async_api import async_playwright
import os

BASE_URL = "http://localhost:3000"

async def generate_authenticated_pdf():
    """Generate PDF by setting localStorage to simulate authenticated state"""
    output_dir = "/app/website_pdfs"
    os.makedirs(output_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()
        
        await page.set_viewport_size({"width": 1280, "height": 900})
        
        # Go to the home page first
        print("Loading home page...")
        await page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)
        
        # Set a fake JWT token in localStorage to simulate authenticated state
        # The frontend checks localStorage for the token
        print("Setting authentication token...")
        fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBkZnRlc3RAdGVzdC5jb20iLCJleHAiOjk5OTk5OTk5OTl9.test"
        await page.evaluate(f'''
            localStorage.setItem('earnhub_token', '{fake_token}');
            localStorage.setItem('earnhub_user', JSON.stringify({{email: 'pdftest@test.com', verified: true}}));
        ''')
        
        # Reload page to pick up the auth state
        print("Reloading with authenticated state...")
        await page.reload(wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(3000)
        
        # Scroll through to load all content
        print("Loading all platform content...")
        for i in range(25):
            await page.evaluate(f"window.scrollTo(0, {i * 800})")
            await page.wait_for_timeout(400)
        
        # Scroll back to top
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(1000)
        
        # Take a screenshot to verify authenticated content
        await page.screenshot(path="/tmp/auth_check.png")
        print("Screenshot saved to /tmp/auth_check.png")
        
        # Generate PDF
        output_path = os.path.join(output_dir, "complete_website_authenticated.pdf")
        print(f"Generating authenticated PDF...")
        
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
    asyncio.run(generate_authenticated_pdf())
