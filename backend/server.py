from fastapi import FastAPI, APIRouter, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
from routes import categories, platforms, stats, auth
from seed_data import categories_data, platforms_data


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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

# Include the router in the main app
app.include_router(api_router)

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