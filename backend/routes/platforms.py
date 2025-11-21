from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
import os
from models import Platform

router = APIRouter()

async def get_platforms_from_db(
    db: AsyncIOMotorDatabase,
    category: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None
) -> List[Platform]:
    """Fetch platforms from database with optional filtering"""
    query = {}
    
    if category and category != "All":
        query["category"] = category
    
    if featured is not None:
        query["featured"] = featured
    
    platforms = await db.platforms.find(query).to_list(1000)
    
    # Apply search filter in Python if needed
    if search:
        search_lower = search.lower()
        platforms = [
            p for p in platforms
            if search_lower in p['name'].lower() or search_lower in p['description'].lower()
        ]
    
    return [Platform(**{**p, 'id': p['id']}) for p in platforms]

@router.get("/platforms")
async def get_platforms(
    db: AsyncIOMotorDatabase,
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None)
):
    """Get all platforms with optional filtering"""
    try:
        platforms = await get_platforms_from_db(db, category, search, featured)
        return {
            "platforms": [p.dict() for p in platforms],
            "total": len(platforms)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching platforms: {str(e)}")

@router.get("/platforms/{platform_id}")
async def get_platform_by_id(platform_id: int, db: AsyncIOMotorDatabase):
    """Get a specific platform by ID"""
    try:
        platform = await db.platforms.find_one({"id": platform_id})
        if not platform:
            raise HTTPException(status_code=404, detail="Platform not found")
        return Platform(**{**platform, 'id': platform['id']}).dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching platform: {str(e)}")