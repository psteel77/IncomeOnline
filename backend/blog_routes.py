from fastapi import APIRouter, HTTPException, Depends, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
import logging
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional, List
from cms_routes import get_admin_user

router = APIRouter(prefix="/blog")

# ==================== BLOG MODELS ====================

class BlogPostCreate(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: str
    featured_image: Optional[str] = None
    category: str = "General"
    tags: List[str] = []
    status: str = "draft"  # draft or published
    meta_description: Optional[str] = None

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    meta_description: Optional[str] = None

# ==================== PUBLIC BLOG ENDPOINTS ====================

@router.get("/posts")
async def get_published_posts(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 10,
    offset: int = 0
):
    """Get all published blog posts (public)"""
    from server import db
    
    try:
        query = {"status": "published"}
        
        if category:
            query["category"] = category
        
        if tag:
            query["tags"] = tag
        
        # Get total count
        total = await db.blog_posts.count_documents(query)
        
        # Get posts with pagination
        posts = await db.blog_posts.find(
            query, 
            {"_id": 0}
        ).sort("published_at", -1).skip(offset).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "posts": posts,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logging.error(f"Error fetching blog posts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/posts/{slug}")
async def get_post_by_slug(slug: str):
    """Get a single blog post by slug (public)"""
    from server import db
    
    try:
        post = await db.blog_posts.find_one(
            {"slug": slug, "status": "published"}, 
            {"_id": 0}
        )
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Increment view count
        await db.blog_posts.update_one(
            {"slug": slug},
            {"$inc": {"views": 1}}
        )
        
        return {"success": True, "post": post}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching blog post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories")
async def get_blog_categories():
    """Get all blog categories with post counts"""
    from server import db
    
    try:
        # Aggregate to get categories with counts
        pipeline = [
            {"$match": {"status": "published"}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        categories = await db.blog_posts.aggregate(pipeline).to_list(100)
        
        result = [{"name": cat["_id"], "count": cat["count"]} for cat in categories]
        
        return {"success": True, "categories": result}
    except Exception as e:
        logging.error(f"Error fetching blog categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recent")
async def get_recent_posts(limit: int = 5):
    """Get most recent blog posts for sidebar/footer"""
    from server import db
    
    try:
        posts = await db.blog_posts.find(
            {"status": "published"},
            {"_id": 0, "title": 1, "slug": 1, "excerpt": 1, "published_at": 1, "featured_image": 1}
        ).sort("published_at", -1).limit(limit).to_list(limit)
        
        return {"success": True, "posts": posts}
    except Exception as e:
        logging.error(f"Error fetching recent posts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ADMIN BLOG ENDPOINTS ====================

@router.get("/admin/posts")
async def get_all_posts_admin(username: str = Depends(get_admin_user)):
    """Get all blog posts for admin (including drafts)"""
    from server import db
    
    try:
        posts = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return {"success": True, "posts": posts, "total": len(posts)}
    except Exception as e:
        logging.error(f"Error fetching blog posts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/posts/{post_id}")
async def get_post_by_id_admin(post_id: int, username: str = Depends(get_admin_user)):
    """Get a single blog post by ID for editing"""
    from server import db
    
    try:
        post = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        return {"success": True, "post": post}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching blog post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/posts")
async def create_post(post: BlogPostCreate, username: str = Depends(get_admin_user)):
    """Create a new blog post"""
    from server import db
    
    try:
        # Check for duplicate slug
        existing = await db.blog_posts.find_one({"slug": post.slug})
        if existing:
            raise HTTPException(status_code=400, detail="A post with this slug already exists")
        
        # Get the next ID
        last_post = await db.blog_posts.find_one(sort=[("id", -1)])
        next_id = (last_post["id"] + 1) if last_post else 1
        
        now = datetime.now(timezone.utc).isoformat()
        
        post_data = post.model_dump()
        post_data["id"] = next_id
        post_data["created_at"] = now
        post_data["updated_at"] = now
        post_data["author"] = username
        post_data["views"] = 0
        
        # Set published_at if publishing
        if post.status == "published":
            post_data["published_at"] = now
        
        await db.blog_posts.insert_one(post_data)
        
        return {
            "success": True,
            "message": "Blog post created successfully",
            "post_id": next_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating blog post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/admin/posts/{post_id}")
async def update_post(post_id: int, post: BlogPostUpdate, username: str = Depends(get_admin_user)):
    """Update an existing blog post"""
    from server import db
    
    try:
        existing = await db.blog_posts.find_one({"id": post_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check for duplicate slug if slug is being changed
        if post.slug and post.slug != existing.get("slug"):
            slug_exists = await db.blog_posts.find_one({"slug": post.slug, "id": {"$ne": post_id}})
            if slug_exists:
                raise HTTPException(status_code=400, detail="A post with this slug already exists")
        
        update_data = {k: v for k, v in post.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        update_data["updated_by"] = username
        
        # Set published_at if status changed to published
        if post.status == "published" and existing.get("status") != "published":
            update_data["published_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.blog_posts.update_one(
            {"id": post_id},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "message": "Blog post updated successfully",
            "post_id": post_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating blog post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/posts/{post_id}")
async def delete_post(post_id: int, username: str = Depends(get_admin_user)):
    """Delete a blog post"""
    from server import db
    
    try:
        existing = await db.blog_posts.find_one({"id": post_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Post not found")
        
        await db.blog_posts.delete_one({"id": post_id})
        
        return {
            "success": True,
            "message": "Blog post deleted successfully",
            "post_id": post_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting blog post: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
