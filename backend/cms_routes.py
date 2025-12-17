from fastapi import APIRouter, HTTPException, Depends, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
import logging
import jwt as pyjwt
from datetime import datetime, timezone, timedelta
import bcrypt
from cms_models import AdminLogin, ContentSection, ContentUpdate
from typing import Optional

router = APIRouter(prefix="/cms")

SECRET_KEY = os.environ['JWT_SECRET_KEY']
ALGORITHM = "HS256"
ADMIN_TOKEN_EXPIRE_HOURS = 24

# Admin credentials from environment with fallback
DEFAULT_ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')

# Fallback password hash for "Gulluk*9" - works even if env var is missing/corrupted
FALLBACK_PASSWORD_HASH = b'$2b$12$fmR3qimgLkI.zxs.aDSaIuXRjTcLuNwplwiuoGSdd7ibWS0xUb/Ia'

try:
    # Try to get password hash from environment
    env_hash = os.environ.get('ADMIN_PASSWORD_HASH', '')
    if env_hash and len(env_hash) > 20:  # Basic validation
        DEFAULT_ADMIN_PASSWORD_HASH = env_hash.encode('utf-8')
    else:
        DEFAULT_ADMIN_PASSWORD_HASH = FALLBACK_PASSWORD_HASH
except:
    DEFAULT_ADMIN_PASSWORD_HASH = FALLBACK_PASSWORD_HASH

def create_admin_token(username: str):
    """Create JWT token for admin user"""
    expire = datetime.now(timezone.utc) + timedelta(hours=ADMIN_TOKEN_EXPIRE_HOURS)
    to_encode = {"username": username, "role": "admin", "exp": expire}
    encoded_jwt = pyjwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_admin_token(token: str) -> Optional[str]:
    """Verify JWT token and return username"""
    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("username")
        role = payload.get("role")
        if role != "admin":
            return None
        return username
    except pyjwt.ExpiredSignatureError:
        return None
    except pyjwt.JWTError:
        return None

async def get_admin_user(authorization: str = Header(None)):
    """Dependency to verify admin authentication"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    username = verify_admin_token(token)
    
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return username

@router.post("/login")
async def admin_login(credentials: AdminLogin):
    """Admin login endpoint - with fallback authentication"""
    try:
        # Check username
        if credentials.username != DEFAULT_ADMIN_USERNAME:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # PRIMARY: Try bcrypt verification
        password_verified = False
        try:
            password_verified = bcrypt.checkpw(credentials.password.encode('utf-8'), DEFAULT_ADMIN_PASSWORD_HASH)
        except Exception as bcrypt_error:
            logging.warning(f"Bcrypt verification failed: {bcrypt_error}")
            # FALLBACK: Direct password comparison for emergency access
            # This allows login even if bcrypt hash is corrupted
            if credentials.password == "Gulluk*9":
                logging.warning("⚠️ Using fallback password authentication")
                password_verified = True
        
        if not password_verified:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create token
        token = create_admin_token(credentials.username)
        
        return {
            "success": True,
            "token": token,
            "username": credentials.username,
            "message": "Login successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in admin login: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/content")
async def get_all_content(username: str = Depends(get_admin_user)):
    """Get all editable content sections"""
    from server import db
    
    try:
        content_sections = await db.content.find({}, {"_id": 0}).to_list(100)
        return {"success": True, "content": content_sections}
    except Exception as e:
        logging.error(f"Error fetching content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/content/{section_id}")
async def get_content_section(section_id: str, username: str = Depends(get_admin_user)):
    """Get a specific content section"""
    from server import db
    
    try:
        section = await db.content.find_one({"section_id": section_id}, {"_id": 0})
        if not section:
            raise HTTPException(status_code=404, detail="Section not found")
        return {"success": True, "section": section}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching content section: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/content/{section_id}")
async def update_content_section(
    section_id: str,
    content_update: ContentUpdate,
    username: str = Depends(get_admin_user)
):
    """Update a content section"""
    from server import db
    
    try:
        # Check if section exists
        existing = await db.content.find_one({"section_id": section_id})
        
        update_data = {
            "content": content_update.content,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": username
        }
        
        if existing:
            # Update existing section
            await db.content.update_one(
                {"section_id": section_id},
                {"$set": update_data}
            )
        else:
            # Create new section
            update_data["section_id"] = section_id
            await db.content.insert_one(update_data)
        
        return {
            "success": True,
            "message": "Content updated successfully",
            "section_id": section_id
        }
    except Exception as e:
        logging.error(f"Error updating content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify")
async def verify_admin_session(username: str = Depends(get_admin_user)):
    """Verify admin session is valid"""
    return {"success": True, "username": username, "authenticated": True}

# ==================== PLATFORM CRUD OPERATIONS ====================

from pydantic import BaseModel
from typing import Optional, List

class PlatformCreate(BaseModel):
    name: str
    category: str
    description: str
    link: str
    earningsPotential: str = "$100-500/month"
    difficulty: str = "Medium"
    rating: float = 4.0
    minPayout: str = "$10"
    featured: bool = False

class PlatformUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    earningsPotential: Optional[str] = None
    difficulty: Optional[str] = None
    rating: Optional[float] = None
    minPayout: Optional[str] = None
    featured: Optional[bool] = None

@router.get("/platforms")
async def get_all_platforms_admin(username: str = Depends(get_admin_user)):
    """Get all platforms for admin management"""
    from server import db
    
    try:
        platforms = await db.platforms.find({}, {"_id": 0}).to_list(1000)
        return {"success": True, "platforms": platforms, "total": len(platforms)}
    except Exception as e:
        logging.error(f"Error fetching platforms: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/platforms")
async def create_platform(platform: PlatformCreate, username: str = Depends(get_admin_user)):
    """Create a new platform"""
    from server import db
    
    try:
        # Get the next ID
        last_platform = await db.platforms.find_one(sort=[("id", -1)])
        next_id = (last_platform["id"] + 1) if last_platform else 1
        
        platform_data = platform.model_dump()
        platform_data["id"] = next_id
        platform_data["created_at"] = datetime.now(timezone.utc).isoformat()
        platform_data["created_by"] = username
        
        await db.platforms.insert_one(platform_data)
        
        # Update category count
        await update_category_count(db, platform.category)
        
        return {
            "success": True,
            "message": "Platform created successfully",
            "platform_id": next_id
        }
    except Exception as e:
        logging.error(f"Error creating platform: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/platforms/{platform_id}")
async def update_platform(platform_id: int, platform: PlatformUpdate, username: str = Depends(get_admin_user)):
    """Update an existing platform"""
    from server import db
    
    try:
        existing = await db.platforms.find_one({"id": platform_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Platform not found")
        
        old_category = existing.get("category")
        
        update_data = {k: v for k, v in platform.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        update_data["updated_by"] = username
        
        await db.platforms.update_one(
            {"id": platform_id},
            {"$set": update_data}
        )
        
        # Update category counts if category changed
        new_category = update_data.get("category")
        if new_category and new_category != old_category:
            await update_category_count(db, old_category)
            await update_category_count(db, new_category)
        
        return {
            "success": True,
            "message": "Platform updated successfully",
            "platform_id": platform_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating platform: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/platforms/{platform_id}")
async def delete_platform(platform_id: int, username: str = Depends(get_admin_user)):
    """Delete a platform"""
    from server import db
    
    try:
        existing = await db.platforms.find_one({"id": platform_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Platform not found")
        
        category = existing.get("category")
        
        await db.platforms.delete_one({"id": platform_id})
        
        # Update category count
        if category:
            await update_category_count(db, category)
        
        return {
            "success": True,
            "message": "Platform deleted successfully",
            "platform_id": platform_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting platform: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def update_category_count(db, category_name: str):
    """Update the platform count for a category"""
    try:
        count = await db.platforms.count_documents({"category": category_name})
        await db.categories.update_one(
            {"name": category_name},
            {"$set": {"count": count}}
        )
    except Exception as e:
        logging.error(f"Error updating category count: {str(e)}")

@router.get("/categories")
async def get_all_categories_admin(username: str = Depends(get_admin_user)):
    """Get all categories for admin (for dropdown selections)"""
    from server import db
    
    try:
        categories = await db.categories.find({}, {"_id": 0}).to_list(100)
        return {"success": True, "categories": categories}
    except Exception as e:
        logging.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
