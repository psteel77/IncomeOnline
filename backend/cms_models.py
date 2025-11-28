from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class AdminCredentials(BaseModel):
    username: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class ContentSection(BaseModel):
    section_id: str = Field(..., description="Unique identifier for the section")
    content: Dict[str, Any] = Field(..., description="Content fields for this section")
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None

class ContentUpdate(BaseModel):
    content: Dict[str, Any]
