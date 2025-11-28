from fastapi import APIRouter, HTTPException, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
import jwt
import uuid
import os
from auth_models import LoginRequest, VerifyRequest, AuthResponse, User

router = APIRouter()

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 720  # 30 days

def create_access_token(email: str):
    """Create JWT token for authenticated user"""
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    to_encode = {"email": email, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verify JWT token and return email"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        return email
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None

@router.post("/auth/request-access")
async def request_access(request: LoginRequest, db: AsyncIOMotorDatabase):
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
                
                # TODO: Send email with verification link
                # For now, we'll return the link in the response (for testing)
                verification_link = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000')}/verify?token={verification_token}"
                
                print(f"\n=== VERIFICATION EMAIL ===")
                print(f"To: {email}")
                print(f"Subject: Access Your Income Online Account")
                print(f"Link: {verification_link}")
                print(f"=========================\n")
                
                return AuthResponse(
                    success=True,
                    message="Verification link sent to your email. Check your inbox!",
                    token=None
                )
            else:
                # User exists but not verified (shouldn't happen with donations)
                return AuthResponse(
                    success=False,
                    message="Your email is not authorized. Please make a donation first.",
                    token=None
                )
        else:
            # User doesn't exist
            return AuthResponse(
                success=False,
                message="Email not found. Please donate first to get access.",
                token=None
            )
            
    except Exception as e:
        print(f"Error in request_access: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/verify/{token}")
async def verify_email(token: str, db: AsyncIOMotorDatabase):
    """Verify email token and return JWT"""
    try:
        # Find user with this verification token
        user = await db.users.find_one({"verification_token": token})
        
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired verification link")
        
        # Update user's last login
        await db.users.update_one(
            {"email": user['email']},
            {
                "$set": {
                    "last_login": datetime.utcnow(),
                    "verification_token": None  # Clear token after use
                }
            }
        )
        
        # Create JWT token
        access_token = create_access_token(user['email'])
        
        return AuthResponse(
            success=True,
            message="Email verified! You now have access.",
            token=access_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in verify_email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/check")
async def check_auth(authorization: str = Header(None), db: AsyncIOMotorDatabase = None):
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
        print(f"Error in check_auth: {str(e)}")
        return {"authenticated": False, "email": None}

@router.post("/auth/logout")
async def logout():
    """Logout user (token invalidation happens on frontend)"""
    return AuthResponse(
        success=True,
        message="Logged out successfully",
        token=None
    )

@router.post("/auth/add-donor")
async def add_donor(request: LoginRequest, db: AsyncIOMotorDatabase):
    """Add a donor email after PayPal payment (called by webhook)"""
    try:
        email = request.email.lower()
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        
        if existing_user:
            # Update verification status
            await db.users.update_one(
                {"email": email},
                {"$set": {"verified": True}}
            )
            return {"success": True, "message": "Donor updated"}
        else:
            # Create new user
            verification_token = str(uuid.uuid4())
            new_user = User(
                email=email,
                verified=True,
                verification_token=verification_token
            )
            
            await db.users.insert_one(new_user.dict())
            
            # Send welcome email with verification link
            verification_link = f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000')}/verify?token={verification_token}"
            
            print(f"\n=== WELCOME EMAIL TO DONOR ===")
            print(f"To: {email}")
            print(f"Subject: Thank You for Your Donation!")
            print(f"Message: Click the link below to access all platforms:")
            print(f"Link: {verification_link}")
            print(f"==============================\n")
            
            return {"success": True, "message": "Donor added successfully"}
            
    except Exception as e:
        print(f"Error in add_donor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
