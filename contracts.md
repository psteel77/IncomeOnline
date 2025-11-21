# API Contracts & Integration Plan

## Current Mock Data Structure

### Mock Data Location: `/app/frontend/src/mock.js`

**Categories:**
- id, name, description, count, color, borderColor, textColor

**Platforms:**
- id, name, category, description, earningsPotential, difficulty, rating, minPayout, paymentMethods, featured, link

**Stats:**
- label, value

## Backend API Endpoints to Implement

### 1. Categories API
**GET /api/categories**
- Returns: Array of category objects
- Purpose: Fetch all earning categories

### 2. Platforms API
**GET /api/platforms**
- Query params: category (optional), search (optional), featured (optional)
- Returns: Array of platform objects
- Purpose: Fetch platforms with filtering support

**GET /api/platforms/:id**
- Returns: Single platform object
- Purpose: Fetch detailed platform information

**POST /api/platforms** (Admin)
- Body: Platform object
- Returns: Created platform
- Purpose: Add new platform to database

### 3. Stats API
**GET /api/stats**
- Returns: Object with aggregate statistics
- Purpose: Fetch homepage statistics

## MongoDB Collections

### 1. **categories** Collection
```
{
  _id: ObjectId,
  name: String,
  description: String,
  count: Number,
  color: String,
  borderColor: String,
  textColor: String
}
```

### 2. **platforms** Collection
```
{
  _id: ObjectId,
  name: String,
  category: String,
  description: String,
  earningsPotential: String,
  difficulty: String (Easy|Medium|Hard),
  rating: Number,
  minPayout: String,
  paymentMethods: Array<String>,
  featured: Boolean,
  link: String,
  createdAt: DateTime
}
```

## Frontend Integration Changes

### Files to Modify:
1. `/app/frontend/src/pages/Home.jsx`
   - Replace mock data imports with API calls
   - Add loading states
   - Add error handling
   - Implement data fetching with useEffect

### API Service Layer:
Create `/app/frontend/src/services/api.js`
- platformsAPI.getAll()
- platformsAPI.getById(id)
- categoriesAPI.getAll()
- statsAPI.get()

## Implementation Steps

1. **Backend Setup:**
   - Create Pydantic models for Categories, Platforms
   - Implement MongoDB CRUD operations
   - Create API endpoints with FastAPI
   - Seed database with mock data

2. **Frontend Integration:**
   - Create API service layer
   - Replace mock imports with API calls
   - Add loading/error states
   - Test all functionality

3. **Testing:**
   - Test all API endpoints
   - Verify search and filter functionality
   - Ensure proper error handling
   - Check data consistency

## Notes
- All mock data in `mock.js` will be migrated to MongoDB
- Search functionality implemented on backend for better performance
- Category filtering handled by backend API
- Frontend will handle state management and UI interactions
