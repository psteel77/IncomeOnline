from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import Stat

router = APIRouter()

@router.get("/stats")
async def get_stats(db: AsyncIOMotorDatabase):
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
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")