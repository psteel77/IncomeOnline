from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables FIRST before any other imports
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, Header
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt as pyjwt
from seed_data import categories_data, platforms_data
from email_service import send_verification_email
from cms_routes import router as cms_router
from seed_content import content_sections

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
        
        # Insert platforms
        await db.platforms.insert_many(platforms_data)
        
        return {
            "message": "Database seeded successfully",
            "categories_added": len(categories_data),
            "platforms_added": len(platforms_data)
        }
    except Exception as e:
        return {"error": str(e)}

@api_router.post("/seed-content")
async def seed_content():
    """Seed CMS content with initial data"""
    try:
        # Check if content already exists
        existing_count = await db.content.count_documents({})
        
        if existing_count > 0:
            return {
                "message": "Content already seeded",
                "content_sections": existing_count
            }
        
        # Insert content sections
        await db.content.insert_many(content_sections)
        
        return {
            "message": "Content seeded successfully",
            "content_sections_added": len(content_sections)
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
            {"label": "Avg. Monthly Earning", "value": "$2,500"},
            {"label": "Success Stories", "value": "50K+"}
        ]
        
        return {"stats": stats}
    except Exception as e:
        return {"error": str(e)}

# Authentication endpoints
from auth_models import LoginRequest, VerifyRequest, AuthResponse, User
from datetime import timedelta
import jwt as pyjwt

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
    """Request access - sends verification email"""
    try:
        email = request.email.lower()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": email})
        
        if existing_user:
            # User exists, check if verified
            if existing_user.get('verified'):
                # User already has access, send new verification link
                verification_token = str(uuid.uuid4())
                await db.users.update_one(
                    {"email": email},
                    {"$set": {"verification_token": verification_token}}
                )
                
                # Send verification email with template
                send_verification_email(email, verification_token)
                
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
    """Verify email token and return JWT"""
    try:
        # Find user with this verification token
        user = await db.users.find_one({"verification_token": token})
        
        if not user:
            return {"success": False, "message": "Invalid or expired verification link"}
        
        # Update user's last login
        await db.users.update_one(
            {"email": user['email']},
            {
                "$set": {
                    "last_login": datetime.utcnow(),
                    "verification_token": None
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
    """Check if user is authenticated"""
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
        
        return {"authenticated": True, "email": email}
        
    except Exception as e:
        logging.error(f"Error in check_auth: {str(e)}")
        return {"authenticated": False, "email": None}

@api_router.post("/auth/add-donor")
async def add_donor(request: LoginRequest):
    """Add a donor email after PayPal payment"""
    try:
        email = request.email.lower()
        
        existing_user = await db.users.find_one({"email": email})
        
        if existing_user:
            await db.users.update_one(
                {"email": email},
                {"$set": {"verified": True}}
            )
            return {"success": True, "message": "Donor updated"}
        else:
            verification_token = str(uuid.uuid4())
            new_user = {
                "email": email,
                "verified": True,
                "verification_token": verification_token,
                "created_at": datetime.utcnow(),
                "last_login": None
            }
            
            await db.users.insert_one(new_user)
            
            # Send welcome email to donor with verification link
            send_verification_email(email, verification_token)
            
            return {"success": True, "message": "Donor added successfully"}
            
    except Exception as e:
        logging.error(f"Error in add_donor: {str(e)}")
        return {"success": False, "message": str(e)}

@api_router.post("/paypal/ipn")
async def paypal_ipn(request: Request):
    """Handle PayPal Instant Payment Notification"""
    try:
        # Get the raw body
        body = await request.body()
        
        # Log the IPN for debugging
        logging.info(f"PayPal IPN received: {body.decode()}")
        
        # Parse form data
        form_data = await request.form()
        
        # Extract payer email
        payer_email = form_data.get("payer_email") or form_data.get("receiver_email")
        payment_status = form_data.get("payment_status")
        txn_id = form_data.get("txn_id")
        
        logging.info(f"PayPal payment - Email: {payer_email}, Status: {payment_status}, TXN: {txn_id}")
        
        # Only process completed payments
        if payment_status == "Completed" and payer_email:
            email = payer_email.lower()
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": email})
            
            if existing_user:
                # Update existing user
                await db.users.update_one(
                    {"email": email},
                    {"$set": {"verified": True}}
                )
                logging.info(f"Updated existing donor: {email}")
            else:
                # Create new user and send email
                verification_token = str(uuid.uuid4())
                new_user = {
                    "email": email,
                    "verified": True,
                    "verification_token": verification_token,
                    "created_at": datetime.utcnow(),
                    "last_login": None
                }
                
                await db.users.insert_one(new_user)
                
                # Send welcome email with verification link
                send_verification_email(email, verification_token)
                
                logging.info(f"Created new donor and sent email: {email}")
        
        return {"status": "success"}
        
    except Exception as e:
        logging.error(f"Error in PayPal IPN: {str(e)}")
        return {"status": "error", "message": str(e)}

# Include the routers in the main app
app.include_router(api_router)
app.include_router(cms_router, prefix="/api")

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