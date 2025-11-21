from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
import os
from models import Category

router = APIRouter()

async def get_categories_from_db(db: AsyncIOMotorDatabase) -> List[Category]:
    """Fetch all categories from database"""
    categories = await db.categories.find().to_list(100)
    return [Category(**{**cat, 'id': cat['id']}) for cat in categories]

@router.get("/categories")
async def get_categories(db: AsyncIOMotorDatabase):
    """Get all earning categories"""
    try:
        categories = await get_categories_from_db(db)
        return {"categories": [cat.dict() for cat in categories]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")