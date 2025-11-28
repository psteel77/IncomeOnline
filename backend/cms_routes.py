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

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production-2024')
ALGORITHM = "HS256"
ADMIN_TOKEN_EXPIRE_HOURS = 24

# Default admin credentials (should be changed in production)
DEFAULT_ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
DEFAULT_ADMIN_PASSWORD_HASH = bcrypt.hashpw(
    os.environ.get('ADMIN_PASSWORD', 'admin123').encode('utf-8'),
    bcrypt.gensalt()
)

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
    """Admin login endpoint"""
    try:
        # Check credentials
        if credentials.username != DEFAULT_ADMIN_USERNAME:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not bcrypt.checkpw(credentials.password.encode('utf-8'), DEFAULT_ADMIN_PASSWORD_HASH):
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
