from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables FIRST before any other imports
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, Header, Depends, HTTPException
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging
import requests
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt as pyjwt
from seed_data import categories_data, platforms_data
from email_service import send_new_user_email, send_returning_user_email, send_expired_email, send_expiry_warning_email, send_abandoned_donation_email, send_premium_pack_email, pick_recovery_subject, RECOVERY_SUBJECT_VARIANTS
from cms_routes import router as cms_router, get_admin_user
from pdf_routes import router as pdf_router
from seo_routes import router as seo_router
from guides_routes import router as guides_router
from seed_content import content_sections
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Abandoned-donation recovery scheduler config (env-overridable)
RECOVERY_SCHEDULER_ENABLED = os.environ.get('RECOVERY_SCHEDULER_ENABLED', 'true').lower() == 'true'
RECOVERY_INTERVAL_HOURS = int(os.environ.get('RECOVERY_INTERVAL_HOURS', '1'))
RECOVERY_DELAY_HOURS = int(os.environ.get('RECOVERY_DELAY_HOURS', '2'))
RECOVERY_MAX_EMAILS = int(os.environ.get('RECOVERY_MAX_EMAILS', '50'))

# Subscription-expiry (7-day "renew" warning) scheduler config (env-overridable)
EXPIRY_SCHEDULER_ENABLED = os.environ.get('EXPIRY_SCHEDULER_ENABLED', 'true').lower() == 'true'
EXPIRY_INTERVAL_HOURS = int(os.environ.get('EXPIRY_INTERVAL_HOURS', '24'))

# Subscription duration in days
SUBSCRIPTION_DURATION_DAYS = 365

# Expected donation amount (GBP) — used to verify PayPal orders match what we charge.
# This is the BASIC PLATFORM ACCESS plan. (Constant name kept for stability; value is GBP.)
EXPECTED_DONATION_USD = "9.99"

# Premium Pack price (GBP). A SUPERSET of the basic plan: buying Premium grants
# the same 12-month platform access PLUS the Wealth Generator bundle (10 guides,
# 4 premium Strategy docs, 6 interactive calculators). Verified server-side.
PREMIUM_PACK_USD = "14.99"

# Public base URL of THIS backend (for absolute links in emails). Defaults to the
# production Railway host; override in preview/staging via env.
BACKEND_PUBLIC_URL = os.environ.get('BACKEND_PUBLIC_URL', 'https://incomeonline-production.up.railway.app').rstrip('/')

# PayPal REST API base. Default = LIVE. Override to "https://api-m.sandbox.paypal.com"
# in Railway env for sandbox testing.
PAYPAL_API_BASE = os.environ.get('PAYPAL_API_BASE', 'https://api-m.paypal.com').rstrip('/')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class LoginRequest(BaseModel):
    email: EmailStr

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post("/seed")
async def seed_database():
    """Seed database with initial data"""
    try:
        # Clear existing data
        await db.categories.delete_many({})
        await db.platforms.delete_many({})
        
        # Insert categories
        await db.categories.insert_many(categories_data)
        
        # Platforms NOT available in UK
        NOT_UK_PLATFORMS = [
            'VIPKid', 'Instacart Shopper', 'DoorDash', 'Lyft', 'Shipt', 'Favor', 
            'E*TRADE', 'Public.com', 'Mercari', 'Wyzant', 'Tutor.com', 
            'InboxDollars', 'Crowdtap', 'Bellhop', 'Wonolo'
        ]
        
        # Add ukAvailable field to all platforms
        platforms_with_uk = []
        for platform in platforms_data:
            platform_copy = platform.copy()
            platform_copy['ukAvailable'] = platform['name'] not in NOT_UK_PLATFORMS
            platforms_with_uk.append(platform_copy)
        
        # Insert platforms with ukAvailable field
        await db.platforms.insert_many(platforms_with_uk)
        
        # Update category counts based on actual data
        categories = await db.categories.find({}).to_list(100)
        for cat in categories:
            count = await db.platforms.count_documents({"category": cat["name"]})
            await db.categories.update_one(
                {"name": cat["name"]},
                {"$set": {"count": count}}
            )
        
        return {
            "message": "Database seeded successfully",
            "categories_added": len(categories_data),
            "platforms_added": len(platforms_with_uk)
        }
    except Exception as e:
        return {"error": str(e)}

async def add_uk_platforms():
    """Add additional UK-specific platforms to the database"""
    # Get current max ID
    last_platform = await db.platforms.find_one(sort=[("id", -1)])
    next_id = (last_platform["id"] if last_platform else 0) + 1
    
    # Additional platforms including UK-specific ones
    additional_platforms = [
        # More Gig Economy
        {"name": "DoorDash", "category": "Gig Economy", "description": "Food delivery platform popular in the US, Canada, and Australia. Flexible hours with competitive earnings.", "earningsPotential": "£500 - £2,500/month", "difficulty": "Easy", "rating": 4.2, "minPayout": "Weekly", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.doordash.com", "ukAvailable": False},
        {"name": "Lyft", "category": "Gig Economy", "description": "Rideshare platform operating in the United States. Earn by driving passengers.", "earningsPotential": "£1,000 - £4,000/month", "difficulty": "Easy", "rating": 4.0, "minPayout": "Weekly", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.lyft.com", "ukAvailable": False},
        {"name": "Uber", "category": "Gig Economy", "description": "Global rideshare and delivery platform. Drive passengers or deliver food with Uber Eats.", "earningsPotential": "£500 - £3,000/month", "difficulty": "Easy", "rating": 4.2, "minPayout": "Weekly", "paymentMethods": ["Bank Transfer"], "featured": True, "link": "https://www.uber.com", "ukAvailable": True},
        {"name": "Deliveroo", "category": "Gig Economy", "description": "UK-based food delivery platform. Become a rider and earn flexible income delivering food from restaurants to customers.", "earningsPotential": "£10-20/hour", "difficulty": "Easy", "rating": 4.2, "minPayout": "Weekly", "paymentMethods": ["Bank Transfer"], "featured": True, "link": "https://deliveroo.co.uk/apply", "ukAvailable": True},
        {"name": "Just Eat", "category": "Gig Economy", "description": "One of the UK's largest food delivery platforms. Deliver food from local restaurants with flexible hours.", "earningsPotential": "£8-15/hour", "difficulty": "Easy", "rating": 4.0, "minPayout": "Weekly", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://www.just-eat.co.uk/", "ukAvailable": True},
        {"name": "Shipt", "category": "Gig Economy", "description": "Grocery delivery service operating in the United States. Shop and deliver groceries.", "earningsPotential": "£500 - £2,000/month", "difficulty": "Easy", "rating": 4.0, "minPayout": "Weekly", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.shipt.com", "ukAvailable": False},
        {"name": "Favor", "category": "Gig Economy", "description": "Texas-based delivery platform. Deliver anything from restaurants to retail stores.", "earningsPotential": "£500 - £1,500/month", "difficulty": "Easy", "rating": 3.9, "minPayout": "Weekly", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.favordelivery.com", "ukAvailable": False},
        {"name": "Bellhop", "category": "Gig Economy", "description": "Moving labor platform in the US. Help people move furniture and belongings.", "earningsPotential": "£15 - £25/hour", "difficulty": "Medium", "rating": 4.0, "minPayout": "Weekly", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.getbellhops.com", "ukAvailable": False},
        {"name": "Wonolo", "category": "Gig Economy", "description": "On-demand staffing platform in the US. Find warehouse, retail, and event jobs.", "earningsPotential": "£500 - £2,000/month", "difficulty": "Easy", "rating": 4.0, "minPayout": "Weekly", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.wonolo.com", "ukAvailable": False},
        {"name": "Rover", "category": "Gig Economy", "description": "Pet sitting and dog walking platform. Care for pets in your area and earn.", "earningsPotential": "£300 - £1,500/month", "difficulty": "Easy", "rating": 4.4, "minPayout": "2 days after service", "paymentMethods": ["PayPal", "Bank Transfer"], "featured": False, "link": "https://www.rover.com", "ukAvailable": True},
        {"name": "Thumbtack", "category": "Gig Economy", "description": "Local services marketplace. Offer your skills in home improvement, events, and more.", "earningsPotential": "£500 - £3,000/month", "difficulty": "Medium", "rating": 4.1, "minPayout": "Varies", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://www.thumbtack.com", "ukAvailable": True},
        {"name": "Airtasker", "category": "Gig Economy", "description": "Task marketplace connecting people who need jobs done with local taskers.", "earningsPotential": "£10-30/hour", "difficulty": "Easy", "rating": 4.2, "minPayout": "£10", "paymentMethods": ["Bank Transfer", "PayPal"], "featured": False, "link": "https://www.airtasker.com/uk/", "ukAvailable": True},
        {"name": "Stuart", "category": "Gig Economy", "description": "On-demand delivery platform operating in UK cities. Deliver packages and food.", "earningsPotential": "£10-18/hour", "difficulty": "Easy", "rating": 4.1, "minPayout": "Weekly", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://stuart.com/", "ukAvailable": True},
        {"name": "Gopuff", "category": "Gig Economy", "description": "Instant delivery platform for everyday essentials. Available in UK after acquiring Fancy.", "earningsPotential": "£10-15/hour", "difficulty": "Easy", "rating": 4.0, "minPayout": "Weekly", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://www.gopuff.com", "ukAvailable": True},
        {"name": "Amazon Flex", "category": "Gig Economy", "description": "Deliver Amazon packages with your own vehicle. Flexible scheduling in UK cities.", "earningsPotential": "£13-17/hour", "difficulty": "Easy", "rating": 4.1, "minPayout": "Twice weekly", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://flex.amazon.co.uk", "ukAvailable": True},
        {"name": "Field Agent", "category": "Gig Economy", "description": "Complete retail audit tasks in stores. Take photos, check prices, and earn.", "earningsPotential": "£50-200/month", "difficulty": "Easy", "rating": 4.0, "minPayout": "£5", "paymentMethods": ["PayPal"], "featured": False, "link": "https://www.fieldagent.co.uk", "ukAvailable": True},
        {"name": "Gigwalk", "category": "Gig Economy", "description": "Complete local gigs and tasks. Available in UK, US, and Canada.", "earningsPotential": "£50-300/month", "difficulty": "Easy", "rating": 3.9, "minPayout": "Varies", "paymentMethods": ["PayPal"], "featured": False, "link": "https://www.gigwalk.com", "ukAvailable": True},
        # More E-commerce
        {"name": "Vinted", "category": "E-commerce", "description": "Popular UK marketplace for buying and selling pre-loved fashion. Zero selling fees.", "earningsPotential": "£50-500+/month", "difficulty": "Easy", "rating": 4.5, "minPayout": "£0.50", "paymentMethods": ["Bank Transfer", "PayPal"], "featured": True, "link": "https://www.vinted.co.uk/", "ukAvailable": True},
        {"name": "Depop", "category": "E-commerce", "description": "Fashion marketplace popular with Gen Z. Sell vintage and unique clothing items.", "earningsPotential": "£100 - £2,000/month", "difficulty": "Easy", "rating": 4.3, "minPayout": "£0", "paymentMethods": ["PayPal", "Bank Transfer"], "featured": False, "link": "https://www.depop.com", "ukAvailable": True},
        {"name": "Mercari", "category": "E-commerce", "description": "Selling app for almost anything. Closed UK operations, US and Japan only.", "earningsPotential": "£100 - £1,000/month", "difficulty": "Easy", "rating": 4.1, "minPayout": "£10", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.mercari.com", "ukAvailable": False},
        {"name": "eBay", "category": "E-commerce", "description": "Global marketplace for buying and selling new and used items. Strong UK presence.", "earningsPotential": "£200 - £5,000+/month", "difficulty": "Easy", "rating": 4.4, "minPayout": "Varies", "paymentMethods": ["PayPal", "Bank Transfer"], "featured": True, "link": "https://www.ebay.co.uk", "ukAvailable": True},
        {"name": "Facebook Marketplace", "category": "E-commerce", "description": "Buy and sell locally through Facebook. No selling fees for local pickup.", "earningsPotential": "£100 - £1,000/month", "difficulty": "Easy", "rating": 4.2, "minPayout": "N/A", "paymentMethods": ["Cash", "PayPal"], "featured": False, "link": "https://www.facebook.com/marketplace", "ukAvailable": True},
        {"name": "Printful", "category": "E-commerce", "description": "Print-on-demand dropshipping. Create custom products without inventory.", "earningsPotential": "£200 - £5,000/month", "difficulty": "Medium", "rating": 4.3, "minPayout": "Varies", "paymentMethods": ["PayPal", "Bank Transfer"], "featured": False, "link": "https://www.printful.com", "ukAvailable": True},
        {"name": "Shopify", "category": "E-commerce", "description": "Build your own online store. Comprehensive e-commerce platform.", "earningsPotential": "£500 - £50,000/month", "difficulty": "Medium", "rating": 4.7, "minPayout": "2 days", "paymentMethods": ["Bank Transfer"], "featured": True, "link": "https://www.shopify.com", "ukAvailable": True},
        {"name": "Teespring (Spring)", "category": "E-commerce", "description": "Design and sell custom merchandise. No upfront costs, print on demand.", "earningsPotential": "£100 - £5,000/month", "difficulty": "Easy", "rating": 4.0, "minPayout": "£10", "paymentMethods": ["PayPal", "Bank Transfer"], "featured": False, "link": "https://www.spri.ng", "ukAvailable": True},
        {"name": "Redbubble", "category": "E-commerce", "description": "Sell your designs on products. Artists earn royalties on every sale.", "earningsPotential": "£50 - £2,000/month", "difficulty": "Easy", "rating": 4.1, "minPayout": "£20", "paymentMethods": ["PayPal", "Bank Transfer"], "featured": False, "link": "https://www.redbubble.com", "ukAvailable": True},
        {"name": "Zazzle", "category": "E-commerce", "description": "Create and sell customized products. Design templates available.", "earningsPotential": "£50 - £1,500/month", "difficulty": "Easy", "rating": 4.0, "minPayout": "£25", "paymentMethods": ["PayPal", "Check"], "featured": False, "link": "https://www.zazzle.com", "ukAvailable": True},
        {"name": "Bonanza", "category": "E-commerce", "description": "Online marketplace for unique items. UK sellers can list with some limitations.", "earningsPotential": "£100 - £2,000/month", "difficulty": "Easy", "rating": 4.0, "minPayout": "Varies", "paymentMethods": ["PayPal", "Bank Transfer"], "featured": False, "link": "https://www.bonanza.com", "ukAvailable": True},
        # More Teaching & Tutoring
        {"name": "MyTutor", "category": "Teaching & Tutoring", "description": "UK's leading online tutoring platform. Help students with GCSE/A-Level subjects.", "earningsPotential": "£500-2,000/month", "difficulty": "Medium", "rating": 4.5, "minPayout": "Monthly", "paymentMethods": ["Bank Transfer"], "featured": True, "link": "https://www.mytutor.co.uk/", "ukAvailable": True},
        {"name": "Tutorful", "category": "Teaching & Tutoring", "description": "UK tutoring platform for online and in-person lessons across various subjects.", "earningsPotential": "£400-1,500/month", "difficulty": "Medium", "rating": 4.3, "minPayout": "Weekly", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://tutorful.co.uk/", "ukAvailable": True},
        {"name": "Preply", "category": "Teaching & Tutoring", "description": "Global language tutoring platform. Set your own rates and schedule.", "earningsPotential": "£500 - £3,000/month", "difficulty": "Medium", "rating": 4.3, "minPayout": "£5", "paymentMethods": ["PayPal", "Payoneer", "Skrill"], "featured": True, "link": "https://www.preply.com", "ukAvailable": True},
        {"name": "Cambly", "category": "Teaching & Tutoring", "description": "Chat with English learners worldwide. No teaching experience required.", "earningsPotential": "£300 - £1,000/month", "difficulty": "Easy", "rating": 4.1, "minPayout": "£20", "paymentMethods": ["PayPal"], "featured": False, "link": "https://www.cambly.com", "ukAvailable": True},
        {"name": "Wyzant", "category": "Teaching & Tutoring", "description": "Connect with students for in-person or online tutoring. US-based platform.", "earningsPotential": "£500 - £2,500/month", "difficulty": "Medium", "rating": 4.2, "minPayout": "£25", "paymentMethods": ["Direct Deposit", "PayPal"], "featured": False, "link": "https://www.wyzant.com", "ukAvailable": False},
        {"name": "Tutor.com", "category": "Teaching & Tutoring", "description": "Online tutoring platform requiring US residency and SSN.", "earningsPotential": "£500 - £2,000/month", "difficulty": "Medium", "rating": 4.1, "minPayout": "Varies", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.tutor.com", "ukAvailable": False},
        {"name": "Outschool", "category": "Teaching & Tutoring", "description": "Teach live online classes to kids. UK teachers welcome.", "earningsPotential": "£500 - £3,000/month", "difficulty": "Medium", "rating": 4.4, "minPayout": "Weekly", "paymentMethods": ["PayPal"], "featured": False, "link": "https://outschool.com/teach", "ukAvailable": True},
        {"name": "Varsity Tutors", "category": "Teaching & Tutoring", "description": "Online tutoring platform with UK presence for GCSE and A-Level subjects.", "earningsPotential": "£500 - £2,500/month", "difficulty": "Medium", "rating": 4.2, "minPayout": "Weekly", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://www.varsitytutors.com", "ukAvailable": True},
        {"name": "Chegg Tutors", "category": "Teaching & Tutoring", "description": "Online tutoring and homework help platform with UK availability.", "earningsPotential": "£400 - £1,500/month", "difficulty": "Medium", "rating": 4.0, "minPayout": "Weekly", "paymentMethods": ["PayPal"], "featured": False, "link": "https://www.chegg.com", "ukAvailable": True},
        {"name": "italki", "category": "Teaching & Tutoring", "description": "Language learning platform connecting teachers with students worldwide.", "earningsPotential": "£400 - £2,000/month", "difficulty": "Medium", "rating": 4.3, "minPayout": "£20", "paymentMethods": ["PayPal", "Bank Transfer"], "featured": False, "link": "https://www.italki.com", "ukAvailable": True},
        # More Trading & Investing
        {"name": "eToro", "category": "Trading & Investing", "description": "Social trading platform with copy trading feature. FCA regulated in UK.", "earningsPotential": "Variable", "difficulty": "Medium", "rating": 4.3, "minPayout": "£30", "paymentMethods": ["Bank Transfer", "PayPal"], "featured": True, "link": "https://www.etoro.com", "ukAvailable": True},
        {"name": "Trading 212", "category": "Trading & Investing", "description": "Commission-free UK trading app for stocks, ETFs, and forex. FCA regulated.", "earningsPotential": "Variable", "difficulty": "Medium", "rating": 4.5, "minPayout": "£1", "paymentMethods": ["Bank Transfer"], "featured": True, "link": "https://www.trading212.com/", "ukAvailable": True},
        {"name": "Freetrade", "category": "Trading & Investing", "description": "UK-based commission-free investing app. Buy stocks and ETFs easily.", "earningsPotential": "Variable", "difficulty": "Medium", "rating": 4.3, "minPayout": "£2", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://freetrade.io/", "ukAvailable": True},
        {"name": "Robinhood", "category": "Trading & Investing", "description": "Commission-free trading app now available in UK with FCA regulation.", "earningsPotential": "Variable", "difficulty": "Medium", "rating": 4.2, "minPayout": "No minimum", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://robinhood.com/gb/", "ukAvailable": True},
        {"name": "Webull", "category": "Trading & Investing", "description": "Advanced trading platform available in UK for stocks, ETFs, and options.", "earningsPotential": "Variable", "difficulty": "Medium", "rating": 4.4, "minPayout": "No minimum", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://www.webull-uk.com", "ukAvailable": True},
        {"name": "E*TRADE", "category": "Trading & Investing", "description": "US-based trading platform. Not available for UK residents.", "earningsPotential": "Variable", "difficulty": "Medium", "rating": 4.3, "minPayout": "Varies", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://us.etrade.com", "ukAvailable": False},
        {"name": "Public.com", "category": "Trading & Investing", "description": "Social investing platform. Closed UK operations in 2024.", "earningsPotential": "Variable", "difficulty": "Easy", "rating": 4.1, "minPayout": "No minimum", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://public.com", "ukAvailable": False},
        {"name": "Interactive Brokers", "category": "Trading & Investing", "description": "Professional trading platform with global market access. Available in UK.", "earningsPotential": "Variable", "difficulty": "Hard", "rating": 4.5, "minPayout": "No minimum", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://www.interactivebrokers.co.uk", "ukAvailable": True},
        {"name": "Charles Schwab", "category": "Trading & Investing", "description": "US investment platform offering international accounts for UK residents.", "earningsPotential": "Variable", "difficulty": "Medium", "rating": 4.4, "minPayout": "No minimum", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://www.schwab.co.uk", "ukAvailable": True},
        {"name": "IG Index", "category": "Trading & Investing", "description": "UK-based spread betting and CFD trading platform. FCA regulated.", "earningsPotential": "Variable", "difficulty": "Hard", "rating": 4.4, "minPayout": "No minimum", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://www.ig.com/uk/", "ukAvailable": True},
        {"name": "Binance", "category": "Trading & Investing", "description": "World's largest cryptocurrency exchange. Available in UK.", "earningsPotential": "Variable", "difficulty": "Medium", "rating": 4.3, "minPayout": "Varies by crypto", "paymentMethods": ["Bank Transfer", "Crypto"], "featured": False, "link": "https://www.binance.com", "ukAvailable": True},
        {"name": "Kraken", "category": "Trading & Investing", "description": "Established cryptocurrency exchange with UK availability.", "earningsPotential": "Variable", "difficulty": "Medium", "rating": 4.3, "minPayout": "Varies by crypto", "paymentMethods": ["Bank Transfer", "Crypto"], "featured": False, "link": "https://www.kraken.com", "ukAvailable": True},
        # More Surveys & Research
        {"name": "Freecash", "category": "Surveys & Research", "description": "GPT site offering surveys, offers, and tasks. Quick payouts in UK.", "earningsPotential": "£50-200/month", "difficulty": "Easy", "rating": 4.3, "minPayout": "£5", "paymentMethods": ["PayPal", "Bank Transfer", "Crypto"], "featured": False, "link": "https://freecash.com/", "ukAvailable": True},
        {"name": "Testable Minds", "category": "Surveys & Research", "description": "Academic research platform. Participate in psychology studies for pay.", "earningsPotential": "£30-100/month", "difficulty": "Easy", "rating": 4.0, "minPayout": "£10", "paymentMethods": ["PayPal"], "featured": False, "link": "https://minds.testable.org/", "ukAvailable": True},
        {"name": "Honeygain", "category": "Surveys & Research", "description": "Passive income app that pays for sharing unused internet bandwidth.", "earningsPotential": "£10-30/month", "difficulty": "Easy", "rating": 3.8, "minPayout": "£20", "paymentMethods": ["PayPal", "Crypto"], "featured": False, "link": "https://www.honeygain.com/", "ukAvailable": True},
        {"name": "NewVista Live", "category": "Surveys & Research", "description": "UK-focused survey site paying around £1 per survey.", "earningsPotential": "£30-100/month", "difficulty": "Easy", "rating": 4.0, "minPayout": "£50", "paymentMethods": ["PayPal", "Bank Transfer"], "featured": False, "link": "https://www.newvistalive.com/", "ukAvailable": True},
        {"name": "Prime Opinion", "category": "Surveys & Research", "description": "Survey site with very low £1 payout threshold. Quick PayPal cashouts.", "earningsPotential": "£20-80/month", "difficulty": "Easy", "rating": 4.1, "minPayout": "£1", "paymentMethods": ["PayPal"], "featured": False, "link": "https://primeopinion.com/", "ukAvailable": True},
        {"name": "MOBROG", "category": "Surveys & Research", "description": "Straightforward survey site paying £1-3 per survey. No points system.", "earningsPotential": "£20-60/month", "difficulty": "Easy", "rating": 4.0, "minPayout": "£5", "paymentMethods": ["PayPal"], "featured": False, "link": "https://www.mobrog.com/", "ukAvailable": True},
        # More Remote Jobs
        {"name": "Remotive", "category": "Remote Jobs", "description": "Curated remote job board with hand-picked opportunities.", "earningsPotential": "£2,000 - £10,000/month", "difficulty": "Medium", "rating": 4.3, "minPayout": "Varies", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.remotive.com", "ukAvailable": True},
        {"name": "Dynamite Jobs", "category": "Remote Jobs", "description": "Remote jobs from verified employers. UK-targeted listings available.", "earningsPotential": "£2,000 - £12,000/month", "difficulty": "Medium", "rating": 4.4, "minPayout": "Varies", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://dynamitejobs.com", "ukAvailable": True},
        {"name": "Jobspresso", "category": "Remote Jobs", "description": "Curated remote jobs in tech, marketing, and customer support.", "earningsPotential": "£2,500 - £10,000/month", "difficulty": "Medium", "rating": 4.2, "minPayout": "Varies", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.jobspresso.co", "ukAvailable": True},
        {"name": "Working Nomads", "category": "Remote Jobs", "description": "Remote job listings for digital nomads. UK jobs available.", "earningsPotential": "£2,000 - £8,000/month", "difficulty": "Medium", "rating": 4.1, "minPayout": "Varies", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.workingnomads.com", "ukAvailable": True},
        {"name": "Virtual Vocations", "category": "Remote Jobs", "description": "Screened remote job listings with UK opportunities.", "earningsPotential": "£2,000 - £8,000/month", "difficulty": "Medium", "rating": 4.0, "minPayout": "Varies", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.virtualvocations.com", "ukAvailable": True},
        {"name": "Skip The Drive", "category": "Remote Jobs", "description": "Remote job board with international opportunities including UK.", "earningsPotential": "£1,500 - £7,000/month", "difficulty": "Medium", "rating": 4.0, "minPayout": "Varies", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://www.skipthedrive.com", "ukAvailable": True},
        {"name": "Authentic Jobs", "category": "Remote Jobs", "description": "Design and tech job board with remote opportunities.", "earningsPotential": "£2,500 - £10,000/month", "difficulty": "Medium", "rating": 4.1, "minPayout": "Varies", "paymentMethods": ["Direct Deposit"], "featured": False, "link": "https://authenticjobs.com", "ukAvailable": True},
        {"name": "LinkedIn Remote Jobs", "category": "Remote Jobs", "description": "Filter LinkedIn jobs for remote positions in your field.", "earningsPotential": "£2,000 - £15,000/month", "difficulty": "Medium", "rating": 4.5, "minPayout": "Varies", "paymentMethods": ["Direct Deposit"], "featured": True, "link": "https://www.linkedin.com/jobs", "ukAvailable": True},
        # More Freelancing
        {"name": "Guru", "category": "Freelancing", "description": "Freelance marketplace with low fees and flexible payment options.", "earningsPotential": "£500 - £5,000/month", "difficulty": "Medium", "rating": 4.0, "minPayout": "£25", "paymentMethods": ["PayPal", "Bank Transfer"], "featured": False, "link": "https://www.guru.com", "ukAvailable": True},
        {"name": "99designs", "category": "Freelancing", "description": "Design-focused freelance platform. Compete in design contests.", "earningsPotential": "£500 - £5,000/month", "difficulty": "Medium", "rating": 4.1, "minPayout": "£25", "paymentMethods": ["PayPal", "Payoneer"], "featured": False, "link": "https://99designs.com", "ukAvailable": True},
        {"name": "Contra", "category": "Freelancing", "description": "Commission-free freelance platform. Keep 100% of your earnings.", "earningsPotential": "£500 - £8,000/month", "difficulty": "Medium", "rating": 4.2, "minPayout": "No minimum", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://contra.com", "ukAvailable": True},
        {"name": "Malt", "category": "Freelancing", "description": "European freelance platform with strong UK presence.", "earningsPotential": "£500-8,000/month", "difficulty": "Medium", "rating": 4.2, "minPayout": "Monthly", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://www.malt.co.uk/", "ukAvailable": True},
        {"name": "Bark", "category": "Freelancing", "description": "UK-based marketplace for service professionals and local customers.", "earningsPotential": "£500-5,000/month", "difficulty": "Medium", "rating": 4.0, "minPayout": "Varies", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://www.bark.com/en/gb/", "ukAvailable": True},
        {"name": "SolidGigs", "category": "Freelancing", "description": "Curated freelance job leads delivered to your inbox.", "earningsPotential": "£500-5,000/month", "difficulty": "Medium", "rating": 4.1, "minPayout": "Varies", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://solidgigs.com", "ukAvailable": True},
        {"name": "Designhill", "category": "Freelancing", "description": "Design marketplace for logos, websites, and branding projects.", "earningsPotential": "£300-3,000/month", "difficulty": "Medium", "rating": 4.0, "minPayout": "Varies", "paymentMethods": ["PayPal", "Payoneer"], "featured": False, "link": "https://www.designhill.com", "ukAvailable": True},
        # More Digital Creators
        {"name": "Popsa", "category": "Digital Creators/Innovators", "description": "UK-based photo book app with creator and affiliate programs.", "earningsPotential": "Varies", "difficulty": "Easy", "rating": 4.3, "minPayout": "Monthly", "paymentMethods": ["Bank Transfer"], "featured": False, "link": "https://www.popsa.com/", "ukAvailable": True},
    ]
    
    # Insert additional platforms
    for platform in additional_platforms:
        existing = await db.platforms.find_one({"name": platform["name"]})
        if not existing:
            platform["id"] = next_id
            await db.platforms.insert_one(platform)
            next_id += 1
    
    # Update category counts
    categories = await db.categories.find({}).to_list(100)
    for cat in categories:
        count = await db.platforms.count_documents({"category": cat["name"]})
        await db.categories.update_one(
            {"name": cat["name"]},
            {"$set": {"count": count}}
        )

@api_router.post("/seed-content")
async def seed_content():
    """Seed CMS content with initial data.
    
    Idempotent merge: inserts any section_ids from `content_sections` that are
    missing from the database. Existing sections are NOT overwritten so admin
    edits are preserved.
    """
    try:
        existing = await db.content.find({}, {"_id": 0, "section_id": 1}).to_list(100)
        existing_ids = {s['section_id'] for s in existing}

        to_insert = [s for s in content_sections if s['section_id'] not in existing_ids]

        if not to_insert:
            return {
                "message": "Content already seeded — no missing sections",
                "content_sections": len(existing_ids),
            }

        await db.content.insert_many(to_insert)
        return {
            "message": "Seeded missing content sections",
            "content_sections_added": len(to_insert),
            "added_ids": [s['section_id'] for s in to_insert],
            "total_sections": len(existing_ids) + len(to_insert),
        }
    except Exception as e:
        return {"error": str(e)}

# Define API endpoints for categories
@api_router.get("/categories")
async def get_categories():
    """Get all earning categories"""
    try:
        categories = await db.categories.find({}, {"_id": 0}).to_list(100)
        return {"categories": categories}
    except Exception as e:
        return {"error": str(e)}

# Define API endpoints for platforms
@api_router.get("/platforms")
async def get_platforms(
    category: str = None,
    search: str = None,
    featured: bool = None
):
    """Get all platforms with optional filtering"""
    try:
        query = {}
        
        if category and category != "All":
            query["category"] = category
        
        if featured is not None:
            query["featured"] = featured
        
        platforms = await db.platforms.find(query, {"_id": 0}).to_list(1000)
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            platforms = [
                p for p in platforms
                if search_lower in p['name'].lower() or search_lower in p['description'].lower()
            ]
        
        return {
            "platforms": platforms,
            "total": len(platforms)
        }
    except Exception as e:
        return {"error": str(e)}

@api_router.get("/platforms/{platform_id}")
async def get_platform_by_id(platform_id: int):
    """Get a specific platform by ID"""
    try:
        platform = await db.platforms.find_one({"id": platform_id}, {"_id": 0})
        if not platform:
            return {"error": "Platform not found"}
        return platform
    except Exception as e:
        return {"error": str(e)}

@api_router.get("/content")
async def get_public_content():
    """Get all content sections for public display"""
    try:
        content_sections = await db.content.find({}, {"_id": 0}).to_list(100)
        
        # Convert to dictionary for easier frontend access
        content_dict = {}
        for section in content_sections:
            content_dict[section['section_id']] = section['content']
        
        return {"success": True, "content": content_dict}
    except Exception as e:
        return {"error": str(e)}

# Define API endpoints for stats
@api_router.get("/stats")
async def get_stats():
    """Get aggregate statistics"""
    try:
        # Count total platforms
        total_platforms = await db.platforms.count_documents({})
        
        # Count total categories
        total_categories = await db.categories.count_documents({})
        
        stats = [
            {"label": "Total Platforms", "value": f"{total_platforms}+"},
            {"label": "Categories", "value": str(total_categories)},
            {"label": "Avg. Monthly Earning", "value": "£2,500"},
            {"label": "Success Stories", "value": "50K+"}
        ]
        
        return {"stats": stats}
    except Exception as e:
        return {"error": str(e)}

# Authentication endpoints
from auth_models import VerifyRequest, AuthResponse, User

SECRET_KEY = os.environ['JWT_SECRET_KEY']
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 720  # 30 days

def create_access_token(email: str):
    """Create JWT token for authenticated user"""
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    to_encode = {"email": email, "exp": expire}
    encoded_jwt = pyjwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verify JWT token and return email"""
    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        return email
    except pyjwt.ExpiredSignatureError:
        return None
    except pyjwt.JWTError:
        return None

@api_router.post("/auth/request-access")
async def request_access(request: LoginRequest):
    """Request access - sends verification email or expiration message"""
    try:
        email = request.email.lower()
        
        # Check if user exists in active users
        existing_user = await db.users.find_one({"email": email})
        
        if existing_user:
            # Check if subscription has expired
            expires_at = existing_user.get('expires_at')
            if expires_at:
                # Parse expiry date if it's a string
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                
                # Check if expired
                now = datetime.now(timezone.utc)
                if expires_at < now:
                    # Move user to expired_users collection
                    expired_user_data = {
                        **existing_user,
                        'expired_at': now.isoformat(),
                        'original_donated_at': existing_user.get('donated_at'),
                        'original_expires_at': existing_user.get('expires_at')
                    }
                    # Remove MongoDB _id before inserting
                    expired_user_data.pop('_id', None)
                    
                    await db.expired_users.update_one(
                        {"email": email},
                        {"$set": expired_user_data},
                        upsert=True
                    )
                    
                    # Remove from active users
                    await db.users.delete_one({"email": email})
                    
                    # Send expired notification email
                    send_expired_email(email)
                    
                    return {
                        "success": False,
                        "message": "Your 12-month subscription has expired. Please make a new donation to renew your access and continue exploring income opportunities.",
                        "expired": True,
                        "token": None
                    }
            
            # User exists and subscription is active
            if existing_user.get('verified'):
                # User has active access, send new verification link
                verification_token = str(uuid.uuid4())
                await db.users.update_one(
                    {"email": email},
                    {"$set": {"verification_token": verification_token}}
                )
                
                # Send Email Template 2 (Welcome back!) for RETURNING users
                send_returning_user_email(email, verification_token)
                
                return {
                    "success": True,
                    "message": "Verification link sent to your email. Check your inbox!",
                    "token": None
                }
            else:
                return {
                    "success": False,
                    "message": "Your email is not authorized. Please make a donation first.",
                    "token": None
                }
        else:
            # Check if user is in expired_users collection
            expired_user = await db.expired_users.find_one({"email": email})
            if expired_user:
                return {
                    "success": False,
                    "message": "Your 12-month subscription has expired. Please make a new donation to renew your access and continue exploring income opportunities.",
                    "expired": True,
                    "token": None
                }
            
            return {
                "success": False,
                "message": "Email not found. Please donate first to get access.",
                "token": None
            }
            
    except Exception as e:
        logging.error(f"Error in request_access: {str(e)}")
        return {"success": False, "message": str(e)}

@api_router.get("/auth/verify/{token}")
async def verify_email(token: str):
    """Verify email token and return JWT (checks subscription expiration)"""
    try:
        # Find user with this verification token
        user = await db.users.find_one({"verification_token": token})
        
        if not user:
            return {"success": False, "message": "Invalid or expired verification link"}
        
        # Check if subscription has expired
        expires_at = user.get('expires_at')
        if expires_at:
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            
            now = datetime.now(timezone.utc)
            if expires_at < now:
                # Subscription expired
                return {
                    "success": False,
                    "message": "Your 12-month subscription has expired. Please make a new donation to renew your access.",
                    "expired": True
                }
        
        # Update user's last login (keep verification_token for reuse)
        await db.users.update_one(
            {"email": user['email']},
            {
                "$set": {
                    "last_login": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Create JWT token
        access_token = create_access_token(user['email'])
        
        return {
            "success": True,
            "message": "Email verified! You now have access.",
            "token": access_token
        }
        
    except Exception as e:
        logging.error(f"Error in verify_email: {str(e)}")
        return {"success": False, "message": str(e)}

@api_router.get("/auth/check")
async def check_auth(authorization: str = Header(None)):
    """Check if user is authenticated (also checks subscription expiration)"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            return {"authenticated": False, "email": None}
        
        token = authorization.replace("Bearer ", "")
        email = verify_token(token)
        
        if not email:
            return {"authenticated": False, "email": None}
        
        # Check if user exists and is verified
        user = await db.users.find_one({"email": email})
        
        if not user or not user.get('verified'):
            return {"authenticated": False, "email": None}
        
        # Check subscription expiration
        expires_at = user.get('expires_at')
        expires_iso = None
        days_remaining = None
        if expires_at:
            if isinstance(expires_at, str):
                expires_dt = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            else:
                expires_dt = expires_at
            if expires_dt.tzinfo is None:
                expires_dt = expires_dt.replace(tzinfo=timezone.utc)

            now = datetime.now(timezone.utc)
            if expires_dt < now:
                return {"authenticated": False, "email": None, "expired": True}
            expires_iso = expires_dt.isoformat()
            days_remaining = max(0, (expires_dt - now).days)

        return {
            "authenticated": True,
            "email": email,
            "expires_at": expires_iso,
            "days_remaining": days_remaining,
        }
        
    except Exception as e:
        logging.error(f"Error in check_auth: {str(e)}")
        return {"authenticated": False, "email": None}

async def _upsert_donor(email: str) -> dict:
    """
    Shared helper: create a new donor, renew an active one, or reactivate an
    expired one. Sends the welcome email for genuinely new accounts. Returns
    a dict shaped {success, message}. Always lowercases email at the boundary.
    """
    email = (email or "").strip().lower()
    if not email:
        return {"success": False, "message": "email is required"}

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=SUBSCRIPTION_DURATION_DAYS)

    existing_user = await db.users.find_one({"email": email})
    expired_user = await db.expired_users.find_one({"email": email})

    if existing_user:
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "verified": True,
                "donated_at": now.isoformat(),
                "expires_at": expires_at.isoformat(),
                "status": "active",
                "warning_sent": False,
            }},
        )
        return {"success": True, "message": "Subscription renewed for 12 months"}

    if expired_user:
        verification_token = str(uuid.uuid4())
        reactivated_user = {
            "email": email,
            "verified": True,
            "verification_token": verification_token,
            "created_at": expired_user.get("created_at", now.isoformat()),
            "donated_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "status": "active",
            "warning_sent": False,
            "last_login": None,
            "previous_subscriptions": expired_user.get("previous_subscriptions", []) + [{
                "donated_at": expired_user.get("original_donated_at"),
                "expired_at": expired_user.get("expired_at"),
            }],
        }
        await db.users.insert_one(reactivated_user)
        await db.expired_users.delete_one({"email": email})
        send_new_user_email(email, verification_token)
        return {"success": True, "message": "Welcome back! Subscription renewed for 12 months"}

    # Fresh donor
    verification_token = str(uuid.uuid4())
    new_user = {
        "email": email,
        "verified": True,
        "verification_token": verification_token,
        "created_at": now.isoformat(),
        "donated_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "status": "active",
        "warning_sent": False,
        "last_login": None,
    }
    await db.users.insert_one(new_user)
    send_new_user_email(email, verification_token)
    return {"success": True, "message": "Donor added with 12-month subscription"}


def _paypal_token_with_error() -> tuple:
    """Returns (access_token, error_detail). error_detail is None on success.
    Used to surface the real reason auth fails (missing creds, bad creds /
    sandbox-vs-live mismatch, network) instead of a silent None."""
    client_id = os.environ.get("PAYPAL_CLIENT_ID")
    client_secret = os.environ.get("PAYPAL_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None, "PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set on the server"
    try:
        resp = requests.post(
            f"{PAYPAL_API_BASE}/v1/oauth2/token",
            auth=(client_id, client_secret),
            data={"grant_type": "client_credentials"},
            headers={"Accept": "application/json", "Accept-Language": "en_US"},
            timeout=15,
        )
        if resp.status_code != 200:
            return None, (
                f"OAuth failed ({resp.status_code}) at {PAYPAL_API_BASE}: "
                f"{resp.text[:300]} — likely a client-id/secret mismatch or "
                f"sandbox credentials used against the live API (or vice-versa)."
            )
        return resp.json().get("access_token"), None
    except Exception as e:
        return None, f"OAuth request error at {PAYPAL_API_BASE}: {e}"


def _get_paypal_access_token() -> Optional[str]:
    """Fetch an OAuth2 access token for the PayPal REST API."""
    token, err = _paypal_token_with_error()
    if err:
        logging.error(err)
    return token


def _fetch_paypal_order(order_id: str) -> Optional[dict]:
    """Fetch full order details from PayPal. Returns None on any failure."""
    token = _get_paypal_access_token()
    if not token:
        return None
    try:
        resp = requests.get(
            f"{PAYPAL_API_BASE}/v2/checkout/orders/{order_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logging.error(f"PayPal order fetch failed for {order_id}: {e}")
        return None


def _create_paypal_order(amount_value: str, description: str) -> dict:
    """Create a PayPal order server-side using full API credentials (client_id +
    secret OAuth). Client-side actions.order.create() is deprecated and returns
    403 NOT_AUTHORIZED on some live accounts, so we create the order here.
    Raises HTTPException(502, detail=<real PayPal error>) on failure so the
    actual cause is visible instead of an opaque error."""
    token, auth_err = _paypal_token_with_error()
    if not token:
        raise HTTPException(status_code=502, detail=f"PayPal auth error: {auth_err}")
    try:
        resp = requests.post(
            f"{PAYPAL_API_BASE}/v2/checkout/orders",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "PayPal-Request-Id": str(uuid.uuid4()),
            },
            json={
                "intent": "CAPTURE",
                "purchase_units": [{
                    "description": description,
                    "amount": {"currency_code": "GBP", "value": amount_value},
                }],
                "application_context": {
                    "shipping_preference": "NO_SHIPPING",
                    "user_action": "PAY_NOW",
                },
            },
            timeout=20,
        )
    except Exception as e:
        logging.error(f"PayPal create order request error: {e}")
        raise HTTPException(status_code=502, detail=f"PayPal create-order request error: {e}")

    if resp.status_code not in (200, 201):
        logging.error(f"PayPal create order failed: {resp.status_code} {resp.text}")
        raise HTTPException(
            status_code=502,
            detail=f"PayPal create-order failed ({resp.status_code}): {resp.text[:400]}",
        )
    return resp.json()


def _capture_paypal_order(order_id: str) -> Optional[dict]:
    """Capture an approved PayPal order server-side and return the completed
    order dict. If it was already captured (422), fall back to fetching it."""
    token = _get_paypal_access_token()
    if not token:
        return None
    try:
        resp = requests.post(
            f"{PAYPAL_API_BASE}/v2/checkout/orders/{order_id}/capture",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "PayPal-Request-Id": str(uuid.uuid4()),
            },
            timeout=20,
        )
        if resp.status_code == 422:
            # Usually ORDER_ALREADY_CAPTURED — return the existing order instead.
            logging.info(f"PayPal capture 422 for {order_id}; fetching existing order")
            return _fetch_paypal_order(order_id)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        body = getattr(getattr(e, "response", None), "text", "")
        logging.error(f"PayPal capture failed for {order_id}: {e} {body}")
        # Last resort: it may already be captured.
        return _fetch_paypal_order(order_id)


class CreateOrderRequest(BaseModel):
    kind: str = "donation"  # 'donation' (£9.99 access) | 'premium' (£14.99 bundle)


# -----------------------------------------------------------------------------
# PayPal payment hardening — durable capture ledger + idempotent fulfillment
# -----------------------------------------------------------------------------
# Every server-side capture is written to `db.paypal_payments` (keyed by the
# unique PayPal order_id) BEFORE any step that can fail. This guarantees a
# captured payment is never lost: if account-creation throws, the record
# survives with fulfillment_status != 'fulfilled' and can be reconciled from
# the admin dashboard. Re-calling a register endpoint for an already-fulfilled
# order is a no-op (idempotent) so no double-grant / double-charge occurs.

def _parse_paypal_capture(order_id: str, kind: str, order: dict) -> dict:
    """Extract the money/payer fields from a captured PayPal order dict."""
    status = (order.get("status") or "").upper()
    pu = (order.get("purchase_units") or [{}])[0] or {}
    caps = (pu.get("payments") or {}).get("captures") or [{}]
    cap = caps[0] or {}
    amt = cap.get("amount") or {}
    return {
        "order_id": order_id,
        "kind": kind,
        "capture_id": cap.get("id"),
        "amount": str(amt.get("value", "")),
        "currency": (amt.get("currency_code") or "").upper(),
        "payer_email": ((order.get("payer") or {}).get("email_address") or "").lower(),
        "paypal_status": status,
    }


async def _record_capture(rec: dict) -> None:
    """Upsert the durable capture record. Sets fulfillment_status='captured'
    only on first insert so we never regress a later status."""
    now = datetime.now(timezone.utc).isoformat()
    await db.paypal_payments.update_one(
        {"order_id": rec["order_id"]},
        {
            "$set": {**rec, "recorded_at": now},
            "$setOnInsert": {"fulfillment_status": "captured", "created_at": now},
        },
        upsert=True,
    )


async def _set_fulfillment_status(order_id: str, status: str, **extra) -> None:
    payload = {"fulfillment_status": status, **extra}
    if status == "fulfilled":
        payload["fulfilled_at"] = datetime.now(timezone.utc).isoformat()
    await db.paypal_payments.update_one({"order_id": order_id}, {"$set": payload})


async def _mark_intents_converted(email: str) -> None:
    """A completed purchaser must never get an abandoned-donation recovery email."""
    if not email:
        return
    try:
        await db.donation_intents.update_many(
            {"email": email.lower(), "status": {"$in": ["pending", "recovery_sent"]}},
            {"$set": {"status": "converted", "converted_at": datetime.now(timezone.utc).isoformat()}},
        )
    except Exception as e:
        logging.warning(f"Could not mark donation intent converted for {email}: {e}")


async def _verify_and_capture(order_id: str, kind: str, expected_amount: str) -> Optional[dict]:
    """
    Shared front half of both register endpoints. Returns:
      - {"already_fulfilled": True, ...record...} if this order is already done (idempotent)
      - {"already_fulfilled": False, ...parsed capture...} once captured + verified OK
    Raises HTTPException on any hard failure, AFTER durably recording the capture
    and flagging it for admin review so money is never silently discarded.
    """
    order_id = (order_id or "").strip()
    if not order_id:
        raise HTTPException(status_code=400, detail="order_id is required")

    # Idempotency: already fully processed → do not re-capture or re-grant.
    existing = await db.paypal_payments.find_one({"order_id": order_id})
    if existing and existing.get("fulfillment_status") == "fulfilled":
        return {"already_fulfilled": True, **{k: existing.get(k) for k in ("payer_email", "kind", "amount", "currency")}}

    order = _capture_paypal_order(order_id)
    if not order:
        raise HTTPException(status_code=502, detail="Could not verify order with PayPal")

    rec = _parse_paypal_capture(order_id, kind, order)
    # Persist BEFORE any verification/fulfillment so the payment is never lost.
    await _record_capture(rec)

    if rec["paypal_status"] != "COMPLETED":
        await _set_fulfillment_status(order_id, "needs_review", review_reason=f"status={rec['paypal_status']}")
        raise HTTPException(status_code=400, detail=f"PayPal order is not in COMPLETED state (status={rec['paypal_status']})")

    if rec["currency"] != "GBP" or rec["amount"] != expected_amount:
        await _set_fulfillment_status(order_id, "needs_review", review_reason=f"amount {rec['currency']} {rec['amount']} != GBP {expected_amount}")
        raise HTTPException(status_code=400, detail=f"Amount {rec['currency']} {rec['amount']} does not match expected {expected_amount} GBP")

    if not rec["payer_email"]:
        await _set_fulfillment_status(order_id, "needs_review", review_reason="no payer email on order")
        raise HTTPException(status_code=400, detail="PayPal order has no payer email")

    return {"already_fulfilled": False, **rec}


@api_router.post("/paypal/create-order")
async def create_paypal_order(request: CreateOrderRequest):
    """Create the PayPal order server-side and return its id to the SDK's
    createOrder callback. Avoids the client-side 403 NOT_AUTHORIZED."""
    kind = (request.kind or "donation").lower()
    if kind == "premium":
        amount = PREMIUM_PACK_USD
        description = "IncomeOnline Premium — 12mo access + Wealth Generator bundle"
    else:
        amount = EXPECTED_DONATION_USD
        description = "IncomeOnline — 12 months unlimited access"

    order = _create_paypal_order(amount, description)
    if not order or not order.get("id"):
        raise HTTPException(status_code=502, detail="PayPal returned no order id")
    return {"id": order["id"]}



class PayPalRegisterRequest(BaseModel):
    order_id: str


@api_router.post("/paypal/register-donor")
async def register_donor_via_paypal(request: PayPalRegisterRequest):
    """
    Public endpoint called by the PayPal SDK onApprove callback. Captures +
    verifies the order server-side (durably recording the capture first), then
    grants access. Idempotent and crash-safe: a captured payment is never lost
    even if account-creation fails (it surfaces in Admin → needs-attention).
    """
    verified = await _verify_and_capture(
        request.order_id, "donation", EXPECTED_DONATION_USD
    )
    order_id = (request.order_id or "").strip()
    payer_email = verified["payer_email"]

    if verified["already_fulfilled"]:
        return {"success": True, "message": "Access already active for this payment", "email": payer_email, "order_id": order_id}

    # Fulfillment — wrapped so a failure never loses the (already captured) money.
    try:
        result = await _upsert_donor(payer_email)
        await _mark_intents_converted(payer_email)
        await _set_fulfillment_status(order_id, "fulfilled")
    except Exception as e:
        logging.exception(f"Fulfillment failed for captured donation {order_id}")
        await _set_fulfillment_status(order_id, "fulfillment_failed", fulfillment_error=str(e)[:500])
        raise HTTPException(
            status_code=500,
            detail="We received your payment but hit a snag activating your access. Our team has been notified and will activate it shortly — please contact support if you don't get your welcome email.",
        )

    return {**result, "email": payer_email, "order_id": order_id}


class PayPalPremiumRequest(BaseModel):
    order_id: str


@api_router.post("/paypal/register-premium")
async def register_premium_via_paypal(request: PayPalPremiumRequest):
    """
    Public endpoint called by the Premium PayPal SDK onApprove callback.
    Captures + verifies the £14.99 order server-side (durably recorded first),
    grants 12-month access, issues a one-time bundle download token and emails
    it. Idempotent and crash-safe (see /register-donor).
    """
    verified = await _verify_and_capture(
        request.order_id, "premium", PREMIUM_PACK_USD
    )
    order_id = (request.order_id or "").strip()
    payer_email = verified["payer_email"]

    # Idempotent replay — return the existing download token instead of issuing
    # a second one / granting twice.
    if verified["already_fulfilled"]:
        existing = await db.premium_purchases.find_one({"paypal_order_id": order_id})
        token = existing.get("token") if existing else None
        resp = {"success": True, "message": "Premium already active for this payment", "email": payer_email, "order_id": order_id}
        if token:
            resp.update({"download_url": f"/api/pdf/premium-pack?token={token}", "token": token})
        return resp

    try:
        result = await _upsert_donor(payer_email)
        await _mark_intents_converted(payer_email)

        # Issue a one-time download token (only if we haven't already for this order).
        existing = await db.premium_purchases.find_one({"paypal_order_id": order_id})
        if existing and existing.get("token"):
            token = existing["token"]
        else:
            token = str(uuid.uuid4())
            await db.premium_purchases.insert_one({
                "id": str(uuid.uuid4()),
                "token": token,
                "email": payer_email,
                "paypal_order_id": order_id,
                "amount": PREMIUM_PACK_USD,
                "currency": "GBP",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "download_count": 0,
                "verified": True,
            })
        await _set_fulfillment_status(order_id, "fulfilled")
    except Exception as e:
        logging.exception(f"Fulfillment failed for captured premium {order_id}")
        await _set_fulfillment_status(order_id, "fulfillment_failed", fulfillment_error=str(e)[:500])
        raise HTTPException(
            status_code=500,
            detail="We received your payment but hit a snag activating your Premium access. Our team has been notified and will activate it shortly — please contact support if you don't get your email.",
        )

    download_path = f"/api/pdf/premium-pack?token={token}"
    download_url_abs = f"{BACKEND_PUBLIC_URL}{download_path}"

    # Email the delivery link (best-effort — never fail the request over email).
    try:
        send_premium_pack_email(payer_email, download_url_abs)
    except Exception as e:
        logging.warning(f"Premium pack delivery email failed for {payer_email}: {e}")

    return {
        **result,
        "email": payer_email,
        "order_id": order_id,
        "download_url": download_path,
        "token": token,
    }


# -----------------------------------------------------------------------------
# Abandoned-donation recovery
# -----------------------------------------------------------------------------
# When a visitor clicks the PayPal button after typing their email but never
# completes the order (closes the popup, bank declines, etc.), we never get
# an onApprove callback. /api/paypal/intent captures their email at the moment
# they open the PayPal popup so we can email them a "Forgot something?" link
# later via /api/paypal/run-recovery (admin-triggered or scheduled).

class DonationIntentRequest(BaseModel):
    email: EmailStr


@api_router.post("/paypal/intent")
async def record_donation_intent(request: DonationIntentRequest):
    """Public — capture an email the moment someone opens the PayPal popup."""
    email = request.email.strip().lower()
    now = datetime.now(timezone.utc)

    # Skip if this email already has an active subscription (no point recovering).
    if await db.users.find_one({"email": email}):
        return {"success": True, "skipped": "already_subscribed"}

    # Upsert by email — one intent per visitor at a time.
    await db.donation_intents.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "last_seen_at": now.isoformat(),
                "status": "pending",
            },
            "$setOnInsert": {"created_at": now.isoformat()},
        },
        upsert=True,
    )
    return {"success": True}


async def _scan_and_recover(delay_hours: int = 2, max_emails: int = 50):
    """
    Core abandoned-donation recovery scan (shared by the admin endpoint and the
    hourly scheduler). Finds donation intents older than `delay_hours` that are
    still pending, haven't already received a recovery email, and aren't already
    subscribed; sends ONE recovery email each; marks them `recovery_sent`.
    Idempotent.
    """
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(hours=delay_hours)).isoformat()

    cursor = db.donation_intents.find(
        {"status": "pending", "created_at": {"$lte": cutoff}},
        {"_id": 0},
    ).limit(max_emails)
    intents = await cursor.to_list(length=max_emails)

    sent, skipped, failed = [], [], []
    for intent in intents:
        email = intent["email"]
        # Safety: skip if they've since subscribed.
        if await db.users.find_one({"email": email}):
            await db.donation_intents.update_one(
                {"email": email},
                {"$set": {"status": "converted", "converted_at": now.isoformat()}},
            )
            skipped.append(email)
            continue
        ok = send_abandoned_donation_email(email)
        if ok:
            variant, _subject = pick_recovery_subject(email)
            await db.donation_intents.update_one(
                {"email": email},
                {"$set": {
                    "status": "recovery_sent",
                    "recovery_sent_at": now.isoformat(),
                    "recovery_subject_variant": variant,
                }},
            )
            sent.append(email)
        else:
            failed.append(email)

    return {
        "sent": sent,
        "skipped_already_subscribed": skipped,
        "failed": failed,
        "scanned": len(intents),
    }


@api_router.post("/paypal/run-recovery")
async def run_abandoned_donation_recovery(
    admin_username: str = Depends(get_admin_user),
    delay_hours: int = 2,
    max_emails: int = 50,
):
    """
    Admin-only — manually trigger the abandoned-donation recovery scan.
    (The same scan also runs automatically every hour via the scheduler.)
    """
    result = await _scan_and_recover(delay_hours=delay_hours, max_emails=max_emails)
    logging.info(
        f"Admin {admin_username} ran donation recovery: sent={len(result['sent'])} "
        f"skipped={len(result['skipped_already_subscribed'])} failed={len(result['failed'])}"
    )
    return result


@api_router.get("/paypal/intents")
async def list_donation_intents(admin_username: str = Depends(get_admin_user)):
    """Admin-only — list recent donation intents for visibility."""
    cursor = db.donation_intents.find({}, {"_id": 0}).sort("created_at", -1).limit(100)
    intents = await cursor.to_list(length=100)
    return {"count": len(intents), "intents": intents}


@api_router.get("/admin/email-diagnostics")
async def email_diagnostics(to: Optional[str] = None, admin_username: str = Depends(get_admin_user)):
    """Admin-only — report Postmark config + send a live API validation request
    (validates token + sender signature) returning the exact error. Never returns
    the token value. Pass ?to=<email> to send a real (no-attachment) test email to
    that address and surface Postmark's exact ErrorCode/Message."""
    token = os.environ.get("POSTMARK_SERVER_TOKEN")
    from_addr = os.environ.get("POSTMARK_FROM") or "Income Online <welcome@incomeonline.info>"
    stream = os.environ.get("POSTMARK_MESSAGE_STREAM", "outbound")

    presence = {
        "POSTMARK_SERVER_TOKEN_set": bool(token),
        "POSTMARK_SERVER_TOKEN_length": len(token) if token else 0,
        "POSTMARK_FROM": from_addr,
        "POSTMARK_MESSAGE_STREAM": stream,
        "FRONTEND_URL": os.environ.get("FRONTEND_URL"),
    }

    if not token:
        return {"ok": False, "stage": "config", "detail": "POSTMARK_SERVER_TOKEN not set on the server", "presence": presence}

    # Default: Postmark's deliverability test address (always accepted, validates
    # token + sender). Pass ?to= to test delivery to a real external address.
    recipient = to or "test@blackhole.postmarkapp.com"
    try:
        resp = requests.post(
            "https://api.postmarkapp.com/email",
            json={
                "From": from_addr,
                "To": recipient,
                "Subject": "IncomeOnline Postmark connectivity test",
                "TextBody": "Connectivity test from IncomeOnline.",
                "HtmlBody": "<p>Connectivity test from IncomeOnline.</p>",
                "MessageStream": stream,
            },
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Postmark-Server-Token": token,
            },
            timeout=20,
        )
        data = resp.json() if resp.content else {}
        if resp.status_code == 200 and data.get("ErrorCode", 0) == 0:
            return {"ok": True, "stage": "send", "detail": f"Postmark OK — sent to '{recipient}' (token valid, sender '{from_addr}' accepted).", "message_id": data.get("MessageID"), "presence": presence}
        return {
            "ok": False,
            "stage": "send",
            "detail": f"Postmark error {data.get('ErrorCode')}: {data.get('Message')}",
            "http_status": resp.status_code,
            "recipient": recipient,
            "presence": presence,
        }
    except Exception as e:
        return {"ok": False, "stage": "request", "detail": f"{type(e).__name__}: {e}", "presence": presence}




@api_router.get("/paypal/recovery-stats")
async def recovery_stats(admin_username: str = Depends(get_admin_user)):
    """Admin-only — aggregate stats for the abandoned-donation recovery funnel."""
    di = db.donation_intents
    total = await di.count_documents({})
    pending = await di.count_documents({"status": "pending"})
    recovery_sent = await di.count_documents({"status": "recovery_sent"})
    converted = await di.count_documents({"status": "converted"})
    converted_after_recovery = await di.count_documents(
        {"status": "converted", "recovery_sent_at": {"$exists": True}}
    )
    price = float(EXPECTED_DONATION_USD)
    # Everyone who has ever been emailed a recovery (still-sent + later-converted).
    emailed = recovery_sent + converted_after_recovery

    # Subject-line A/B test breakdown: for each variant, how many were emailed
    # and how many of those went on to convert.
    subject_ab_test = []
    for key, subject_text in RECOVERY_SUBJECT_VARIANTS.items():
        v_emailed = await di.count_documents(
            {"recovery_subject_variant": key, "recovery_sent_at": {"$exists": True}}
        )
        v_converted = await di.count_documents(
            {"recovery_subject_variant": key, "status": "converted", "recovery_sent_at": {"$exists": True}}
        )
        subject_ab_test.append({
            "variant": key,
            "subject": subject_text,
            "emailed": v_emailed,
            "converted": v_converted,
            "conversion_rate": round((v_converted / v_emailed * 100), 1) if v_emailed else 0.0,
            "revenue_rescued_usd": round(v_converted * price, 2),
        })

    return {
        "total_intents": total,
        "pending": pending,
        "recovery_sent": recovery_sent,
        "converted": converted,
        "converted_after_recovery": converted_after_recovery,
        "conversion_rate": round((converted / total * 100), 1) if total else 0.0,
        "recovery_conversion_rate": round((converted_after_recovery / emailed * 100), 1) if emailed else 0.0,
        "revenue_rescued_usd": round(converted_after_recovery * price, 2),
        "price_usd": price,
        "subject_ab_test": subject_ab_test,
        "scheduler": {
            "enabled": RECOVERY_SCHEDULER_ENABLED,
            "interval_hours": RECOVERY_INTERVAL_HOURS,
            "delay_hours": RECOVERY_DELAY_HOURS,
            "max_emails": RECOVERY_MAX_EMAILS,
        },
    }


@api_router.post("/admin/migrate-currency-gbp")
async def migrate_currency_gbp(admin_username: str = Depends(get_admin_user)):
    """
    Admin-only, idempotent one-off: convert displayed currency $ -> £ in the
    `earningsPotential` and `minPayout` fields of every platform. Safe to run
    multiple times (only touches values that still contain '$'). Use this once
    on production after deploying the UK/GBP changes.
    """
    updated = 0
    cursor = db.platforms.find({}, {"_id": 1, "earningsPotential": 1, "minPayout": 1})
    async for doc in cursor:
        changes = {}
        for field in ("earningsPotential", "minPayout"):
            val = doc.get(field)
            if isinstance(val, str) and "$" in val:
                changes[field] = val.replace("$", "£")
        if changes:
            await db.platforms.update_one({"_id": doc["_id"]}, {"$set": changes})
            updated += 1
    total = await db.platforms.count_documents({})
    return {"updated": updated, "total_platforms": total, "currency": "GBP"}


@api_router.post("/admin/audit-uk-platforms")
async def audit_uk_platforms(admin_username: str = Depends(get_admin_user)):
    """
    Admin-only, idempotent UK directory clean-up. Removes platforms that UK
    residents genuinely cannot use, collapses duplicate listings, and backfills
    hand-curated UK-available platforms so the directory stays at 199+.
    Safe to run multiple times. Run once on production after deploy.
    """
    from uk_audit import reconcile_uk_platforms
    return await reconcile_uk_platforms(db)


@api_router.get("/admin/conversion-stats")
async def conversion_stats(admin_username: str = Depends(get_admin_user)):
    """
    Admin-only — basic (£9.99) vs Premium (£14.99) breakdown + upgrade rate.
    Premium buyers are a subset of all paying accounts (Premium also grants
    platform access), so:
      total_paying = unique accounts that ever paid (active users + expired)
      premium_buyers = unique emails in premium_purchases
      basic_only = total_paying - premium_buyers
      upgrade_rate = premium_buyers / total_paying
    """
    basic_price = float(EXPECTED_DONATION_USD)
    premium_price = float(PREMIUM_PACK_USD)

    active_emails = await db.users.distinct("email")
    expired_emails = await db.expired_users.distinct("email")
    paying_emails = {(e or "").lower() for e in active_emails} | {(e or "").lower() for e in expired_emails}
    paying_emails.discard("")
    total_paying = len(paying_emails)

    premium_emails = {(e or "").lower() for e in await db.premium_purchases.distinct("email")}
    premium_emails.discard("")
    premium_buyers = len(premium_emails)

    # Premium buyers should be counted within the paying base
    total_paying = max(total_paying, premium_buyers)
    basic_only = max(total_paying - premium_buyers, 0)
    upgrade_rate = round((premium_buyers / total_paying * 100), 1) if total_paying else 0.0

    premium_revenue = round(premium_buyers * premium_price, 2)
    basic_revenue = round(basic_only * basic_price, 2)

    return {
        "total_paying": total_paying,
        "basic_only": basic_only,
        "premium_buyers": premium_buyers,
        "upgrade_rate": upgrade_rate,
        "basic_price_usd": basic_price,
        "premium_price_usd": premium_price,
        "basic_revenue_usd": basic_revenue,
        "premium_revenue_usd": premium_revenue,
        "total_revenue_usd": round(basic_revenue + premium_revenue, 2),
    }


@api_router.get("/admin/donors")
async def list_donors(admin_username: str = Depends(get_admin_user)):
    """
    Admin-only — list every PAYING member (the `users` collection plus
    `expired_users`). These are people who completed a £9.99 / £14.99 PayPal
    payment, which is distinct from the free-guide/newsletter "subscribers"
    (`resource_subscribers`). Flags Premium buyers and computes live active /
    expired status from `expires_at`.
    """
    now = datetime.now(timezone.utc)

    premium_emails = {(e or "").lower() for e in await db.premium_purchases.distinct("email")}
    premium_emails.discard("")

    def _status(expires_at: str) -> str:
        if not expires_at:
            return "unknown"
        try:
            exp = datetime.fromisoformat(expires_at)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            return "active" if exp > now else "expired"
        except Exception:
            return "unknown"

    donors = []
    async for u in db.users.find({}, {"_id": 0, "verification_token": 0}):
        email = (u.get("email") or "").lower()
        donors.append({
            "email": email,
            "donated_at": u.get("donated_at"),
            "expires_at": u.get("expires_at"),
            "last_login": u.get("last_login"),
            "status": _status(u.get("expires_at")),
            "is_premium": email in premium_emails,
        })

    async for u in db.expired_users.find({}, {"_id": 0, "verification_token": 0}):
        email = (u.get("email") or "").lower()
        donors.append({
            "email": email,
            "donated_at": u.get("original_donated_at") or u.get("donated_at"),
            "expires_at": u.get("expired_at") or u.get("expires_at"),
            "last_login": u.get("last_login"),
            "status": "expired",
            "is_premium": email in premium_emails,
        })

    # Newest first (donated_at is an ISO string, so string sort works).
    donors.sort(key=lambda d: d.get("donated_at") or "", reverse=True)

    active_count = sum(1 for d in donors if d["status"] == "active")
    return {
        "total": len(donors),
        "active": active_count,
        "expired": len(donors) - active_count,
        "premium": sum(1 for d in donors if d["is_premium"]),
        "donors": donors,
    }


@api_router.post("/admin/apply-ecommerce-seed")
async def apply_ecommerce_seed(admin_username: str = Depends(get_admin_user)):
    """Idempotently remove Poshmark duplicates + add Amazon Associates, Etsy,
    Shopify to E-commerce (full detail fields). Safe to re-run."""
    from ecommerce_seed import apply as _apply_ecom
    result = await _apply_ecom(db)
    return {"success": True, **result}


@api_router.get("/admin/paypal-payments")
async def list_paypal_payments(admin_username: str = Depends(get_admin_user)):
    """
    Admin-only — the durable PayPal capture ledger. Surfaces payments that were
    captured (money taken) but NOT successfully fulfilled, so a "paid but no
    access" case can never go unnoticed and can be reconciled in one click.
    """
    ATTENTION = ["captured", "needs_review", "fulfillment_failed"]
    payments = []
    async for p in db.paypal_payments.find({}, {"_id": 0}).sort("recorded_at", -1):
        payments.append(p)
    needs_attention = [p for p in payments if p.get("fulfillment_status") in ATTENTION]
    return {
        "total": len(payments),
        "fulfilled": sum(1 for p in payments if p.get("fulfillment_status") == "fulfilled"),
        "needs_attention_count": len(needs_attention),
        "needs_attention": needs_attention,
        "payments": payments,
    }


class FulfillRequest(BaseModel):
    email: Optional[EmailStr] = None  # override if the payer email is wrong/missing


@api_router.post("/admin/paypal-payments/{order_id}/fulfill")
async def fulfill_paypal_payment(
    order_id: str,
    request: FulfillRequest = FulfillRequest(),
    admin_username: str = Depends(get_admin_user),
):
    """
    Admin-only — reconcile a captured-but-unfulfilled payment: grant the buyer
    12-month access (using the recorded payer email, or an override) and mark
    the ledger record fulfilled. Idempotent.
    """
    rec = await db.paypal_payments.find_one({"order_id": order_id}, {"_id": 0})
    if not rec:
        raise HTTPException(status_code=404, detail="No captured payment found for that order id")

    email = (request.email or rec.get("payer_email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="No email on record — provide one to grant access")

    result = await _upsert_donor(email)
    await _mark_intents_converted(email)

    # Premium buyers also need their bundle token if it was never issued.
    if rec.get("kind") == "premium" and not await db.premium_purchases.find_one({"paypal_order_id": order_id}):
        token = str(uuid.uuid4())
        await db.premium_purchases.insert_one({
            "id": str(uuid.uuid4()), "token": token, "email": email,
            "paypal_order_id": order_id, "amount": PREMIUM_PACK_USD, "currency": "GBP",
            "created_at": datetime.now(timezone.utc).isoformat(), "download_count": 0, "verified": True,
        })
        try:
            send_premium_pack_email(email, f"{BACKEND_PUBLIC_URL}/api/pdf/premium-pack?token={token}")
        except Exception as e:
            logging.warning(f"Premium delivery email failed during reconcile for {email}: {e}")

    await _set_fulfillment_status(order_id, "fulfilled", reconciled_by=admin_username, reconciled_email=email)
    return {"success": True, "message": f"Access granted to {email}", "email": email, "order_id": order_id, "detail": result}



# -----------------------------------------------------------------------------
# Hero-pill lead capture
# -----------------------------------------------------------------------------
# When a curious visitor clicks the hero "Free MoneyRules Guides" pill we can
# (optionally, controlled via CMS) capture their email before scrolling them to
# the guides. These are stored in `resource_subscribers` so they surface in the
# existing admin Subscribers card and the newsletter list — turning curiosity
# into a recoverable lead.

class LeadCaptureRequest(BaseModel):
    email: EmailStr
    source: str = "hero_pill"


@api_router.post("/leads/capture")
async def capture_lead(request: LeadCaptureRequest):
    """Public — capture a marketing lead (email) from a CTA such as the hero pill."""
    email = request.email.strip().lower()
    source = (request.source or "hero_pill").strip()[:50]
    now = datetime.now(timezone.utc).isoformat()

    await db.resource_subscribers.update_one(
        {"email": email},
        {
            "$setOnInsert": {
                "id": str(uuid.uuid4()),
                "email": email,
                "first_seen_at": now,
            },
            "$set": {"last_seen_at": now, "newsletter_opt_in": True},
            "$addToSet": {"lead_sources": source},
        },
        upsert=True,
    )
    return {"success": True}


@api_router.get("/leads/by-source")
async def leads_by_source(admin_username: str = Depends(get_admin_user)):
    """
    Admin-only — breakdown of captured leads by acquisition source so we can see
    which SEO/CTA surfaces convert best (hero_pill vs success_story vs free-guide).
    A lead can belong to multiple sources, so source counts may sum to more than
    the unique-subscriber total.
    """
    subs = db.resource_subscribers

    total = await subs.count_documents({})
    opted_in = await subs.count_documents({"newsletter_opt_in": True})

    # Tagged lead sources (hero_pill, success_story, ...) via the lead_sources array.
    pipeline = [
        {"$match": {"lead_sources": {"$exists": True, "$ne": []}}},
        {"$unwind": "$lead_sources"},
        {"$group": {
            "_id": "$lead_sources",
            "count": {"$sum": 1},
            "opted_in": {"$sum": {"$cond": [{"$eq": ["$newsletter_opt_in", True]}, 1, 0]}},
        }},
    ]
    tagged = {row["_id"]: {"count": row["count"], "opted_in": row["opted_in"]}
              async for row in subs.aggregate(pipeline)}

    # Free-guide downloaders are identified by having downloaded a resource
    # (they aren't always tagged with a lead_source).
    free_guide_filter = {"resources_downloaded.0": {"$exists": True}}
    free_guide_count = await subs.count_documents(free_guide_filter)
    free_guide_opted = await subs.count_documents({**free_guide_filter, "newsletter_opt_in": True})
    if free_guide_count:
        existing = tagged.get("free-guide", {"count": 0, "opted_in": 0})
        tagged["free-guide"] = {
            "count": existing["count"] + free_guide_count,
            "opted_in": existing["opted_in"] + free_guide_opted,
        }

    # Friendly labels for known sources.
    labels = {
        "hero_pill": "Hero Pill",
        "success_story": "Success Story",
        "free-guide": "Free Guide Download",
        "guide": "Wealth Generator Guide",
    }
    sources = [
        {
            "source": key,
            "label": labels.get(key, key.replace("_", " ").title()),
            "count": data["count"],
            "opted_in": data["opted_in"],
        }
        for key, data in tagged.items()
    ]
    sources.sort(key=lambda s: s["count"], reverse=True)

    return {
        "total_subscribers": total,
        "newsletter_opt_in_count": opted_in,
        "sources": sources,
    }


@api_router.post("/auth/add-donor")
async def add_donor(
    request: LoginRequest,
    admin_username: str = Depends(get_admin_user),
):
    """
    Admin-only manual donor entry. Public donor registration is now done via
    /api/paypal/register-donor after PayPal-side order verification.
    """
    try:
        logging.info(f"Admin {admin_username} manually adding donor {request.email}")
        return await _upsert_donor(request.email)
    except Exception as e:
        logging.error(f"Error in add_donor: {str(e)}")
        return {"success": False, "message": str(e)}

@api_router.post("/subscription/process-expirations")
async def process_subscription_expirations():
    """
    Process subscription expirations:
    1. Send 7-day warning emails to users expiring soon
    2. Move expired users to expired_users collection
    3. Send expiration notification emails
    
    This should be called daily by a cron job or scheduler.
    """
    try:
        now = datetime.now(timezone.utc)
        seven_days_from_now = now + timedelta(days=7)
        
        results = {
            "warnings_sent": 0,
            "expired_processed": 0,
            "errors": []
        }
        
        # 1. Send 7-day warning emails
        # Find users whose subscription expires in exactly 7 days (within a 24-hour window)
        warning_start = seven_days_from_now - timedelta(hours=12)
        warning_end = seven_days_from_now + timedelta(hours=12)
        
        users_to_warn = await db.users.find({
            "verified": True,
            "warning_sent": {"$ne": True},
            "expires_at": {"$exists": True}
        }).to_list(1000)
        
        for user in users_to_warn:
            try:
                expires_at = user.get('expires_at')
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                
                # Check if expiry is within the warning window
                if warning_start <= expires_at <= warning_end:
                    # Send warning email
                    send_expiry_warning_email(user['email'], expires_at)
                    
                    # Mark warning as sent
                    await db.users.update_one(
                        {"email": user['email']},
                        {"$set": {"warning_sent": True}}
                    )
                    
                    results["warnings_sent"] += 1
                    logging.info(f"Sent 7-day expiry warning to: {user['email']}")
            except Exception as e:
                results["errors"].append(f"Warning email error for {user.get('email')}: {str(e)}")
        
        # 2. Process expired subscriptions
        expired_users = await db.users.find({
            "verified": True,
            "expires_at": {"$exists": True}
        }).to_list(1000)
        
        for user in expired_users:
            try:
                expires_at = user.get('expires_at')
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                
                if expires_at < now:
                    email = user['email']
                    
                    # Prepare expired user data
                    expired_user_data = {
                        "email": email,
                        "created_at": user.get('created_at'),
                        "original_donated_at": user.get('donated_at'),
                        "original_expires_at": user.get('expires_at'),
                        "expired_at": now.isoformat(),
                        "verification_token": user.get('verification_token'),
                        "previous_subscriptions": user.get('previous_subscriptions', [])
                    }
                    
                    # Move to expired_users collection
                    await db.expired_users.update_one(
                        {"email": email},
                        {"$set": expired_user_data},
                        upsert=True
                    )
                    
                    # Remove from active users
                    await db.users.delete_one({"email": email})
                    
                    # Send expiration email
                    send_expired_email(email)
                    
                    results["expired_processed"] += 1
                    logging.info(f"Processed expired subscription for: {email}")
            except Exception as e:
                results["errors"].append(f"Expiration processing error for {user.get('email')}: {str(e)}")
        
        return {
            "success": True,
            "results": results
        }
        
    except Exception as e:
        logging.error(f"Error in process_subscription_expirations: {str(e)}")
        return {"success": False, "message": str(e)}


@api_router.post("/subscription/migrate-existing-users")
async def migrate_existing_users():
    """
    One-time migration: Add subscription dates to existing users.
    Sets donated_at to today and expires_at to 12 months from today.
    """
    try:
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=SUBSCRIPTION_DURATION_DAYS)
        
        # Find all verified users without expires_at
        users_to_migrate = await db.users.find({
            "verified": True,
            "expires_at": {"$exists": False}
        }).to_list(10000)
        
        migrated_count = 0
        
        for user in users_to_migrate:
            await db.users.update_one(
                {"email": user['email']},
                {"$set": {
                    "donated_at": now.isoformat(),
                    "expires_at": expires_at.isoformat(),
                    "status": "active",
                    "warning_sent": False
                }}
            )
            migrated_count += 1
        
        return {
            "success": True,
            "message": f"Migrated {migrated_count} existing users with 12-month subscription from today"
        }
        
    except Exception as e:
        logging.error(f"Error in migrate_existing_users: {str(e)}")
        return {"success": False, "message": str(e)}


@api_router.get("/subscription/stats")
async def get_subscription_stats():
    """Get subscription statistics"""
    try:
        now = datetime.now(timezone.utc)
        seven_days_from_now = now + timedelta(days=7)
        thirty_days_from_now = now + timedelta(days=30)
        
        total_active = await db.users.count_documents({"verified": True})
        total_expired = await db.expired_users.count_documents({})
        
        # Count users expiring soon (need to check date strings)
        all_users = await db.users.find({"verified": True, "expires_at": {"$exists": True}}).to_list(10000)
        
        expiring_7_days = 0
        expiring_30_days = 0
        
        for user in all_users:
            expires_at = user.get('expires_at')
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            
            if expires_at and expires_at <= seven_days_from_now:
                expiring_7_days += 1
            if expires_at and expires_at <= thirty_days_from_now:
                expiring_30_days += 1
        
        return {
            "success": True,
            "stats": {
                "total_active_subscribers": total_active,
                "total_expired_users": total_expired,
                "expiring_within_7_days": expiring_7_days,
                "expiring_within_30_days": expiring_30_days
            }
        }
        
    except Exception as e:
        logging.error(f"Error in get_subscription_stats: {str(e)}")
        return {"success": False, "message": str(e)}

# Include the routers in the main app
app.include_router(api_router)
app.include_router(cms_router, prefix="/api")
app.include_router(pdf_router, prefix="/api")
app.include_router(seo_router, prefix="/api")
app.include_router(guides_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# -----------------------------------------------------------------------------
# Hourly abandoned-donation recovery scheduler (in-process APScheduler)
# -----------------------------------------------------------------------------
# Runs the same scan as POST /api/paypal/run-recovery automatically, every
# RECOVERY_INTERVAL_HOURS (default 1h). Lives inside the web process so it works
# on Railway with no external cron. Idempotent — each intent gets one email.
# NOTE: if you ever scale the backend to multiple replicas, run this on a single
# instance (or set RECOVERY_SCHEDULER_ENABLED=false on the others) to avoid
# duplicate sends.
recovery_scheduler = AsyncIOScheduler(timezone="UTC")


async def _recovery_job():
    try:
        result = await _scan_and_recover(
            delay_hours=RECOVERY_DELAY_HOURS, max_emails=RECOVERY_MAX_EMAILS
        )
        if result["sent"] or result["failed"]:
            logger.info(
                f"[recovery-cron] sent={len(result['sent'])} "
                f"skipped={len(result['skipped_already_subscribed'])} "
                f"failed={len(result['failed'])} scanned={result['scanned']}"
            )
    except Exception as e:
        logger.error(f"[recovery-cron] error: {e}")


async def _expiry_job():
    """Daily: send 7-day 'your access expires — renew' emails and process
    lapsed subscriptions (runs the same logic as POST /subscription/process-expirations)."""
    try:
        result = await process_subscription_expirations()
        if result.get("warnings_sent") or result.get("expired_processed"):
            logger.info(
                f"[expiry-cron] warnings_sent={result.get('warnings_sent')} "
                f"expired_processed={result.get('expired_processed')} "
                f"errors={len(result.get('errors', []))}"
            )
    except Exception as e:
        logger.error(f"[expiry-cron] error: {e}")


@app.on_event("startup")
async def seed_starter_guides():
    """Seed UK starter guides on boot (idempotent — never overwrites existing slugs)."""
    try:
        from guides_seed import seed_guides
        n = await seed_guides(db)
        if n:
            logger.info(f"[guides] seeded {n} starter guide(s)")
    except Exception as e:
        logger.error(f"[guides] seed error: {e}")


@app.on_event("startup")
async def start_recovery_scheduler():
    started = False

    if RECOVERY_SCHEDULER_ENABLED:
        recovery_scheduler.add_job(
            _recovery_job,
            "interval",
            hours=RECOVERY_INTERVAL_HOURS,
            id="abandoned_donation_recovery",
            replace_existing=True,
            coalesce=True,
            max_instances=1,
            misfire_grace_time=300,
        )
        started = True
        logger.info(
            f"[recovery-cron] scheduled · every {RECOVERY_INTERVAL_HOURS}h · "
            f"delay={RECOVERY_DELAY_HOURS}h · max={RECOVERY_MAX_EMAILS}/run"
        )
    else:
        logger.info("[recovery-cron] disabled via RECOVERY_SCHEDULER_ENABLED=false")

    if EXPIRY_SCHEDULER_ENABLED:
        recovery_scheduler.add_job(
            _expiry_job,
            "interval",
            hours=EXPIRY_INTERVAL_HOURS,
            id="subscription_expiry_warnings",
            replace_existing=True,
            coalesce=True,
            max_instances=1,
            misfire_grace_time=600,
        )
        started = True
        logger.info(f"[expiry-cron] scheduled · every {EXPIRY_INTERVAL_HOURS}h (7-day renew warnings)")
    else:
        logger.info("[expiry-cron] disabled via EXPIRY_SCHEDULER_ENABLED=false")

    if started:
        recovery_scheduler.start()


@app.on_event("shutdown")
async def stop_recovery_scheduler():
    if recovery_scheduler.running:
        recovery_scheduler.shutdown(wait=False)
