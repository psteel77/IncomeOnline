from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Category(BaseModel):
    id: int
    name: str
    description: str
    count: int
    color: str
    borderColor: str
    textColor: str

class CategoryResponse(BaseModel):
    categories: List[Category]

class Platform(BaseModel):
    id: int
    name: str
    category: str
    description: str
    earningsPotential: str
    difficulty: str
    rating: float
    minPayout: str
    paymentMethods: List[str]
    featured: bool
    link: str

class PlatformResponse(BaseModel):
    platforms: List[Platform]
    total: int

class Stat(BaseModel):
    label: str
    value: str

class StatsResponse(BaseModel):
    stats: List[Stat]

class SeedResponse(BaseModel):
    message: str
    categories_added: int
    platforms_added: int