# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication Endpoints

### POST /auth/login
Login a user.

**Request Body:**
```json
{
  "userType": "Student|Admin|Staff",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "userType": "Student",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "user@example.com",
    "userType": "Student"
  }
}
```

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "userType": "Student|Admin|Staff",
  "email": "user@example.com",
  "password": "password123"
}
```

## Project Endpoints

### POST /projects/search
Search for similar project titles.

**Request Body:**
```json
{
  "searchQuery": "Machine Learning for Text Classification"
}
```

**Response:**
```json
{
  "closestMatch": "A Study on Machine Learning Algorithms for Text Classification",
  "similarityPercentage": 75,
  "allMatches": [
    {
      "title": "A Study on Machine Learning Algorithms for Text Classification",
      "similarity": 75
    }
  ]
}
```

### POST /projects/submit-title
Submit a project title.

**Request Body:**
```json
{
  "title": "My Project Title",
  "submittedBy": "student@example.com"
}
```

**Response:**
```json
{
  "message": "Project title submitted successfully",
  "similarity": 25,
  "status": "submitted"
}
```

### GET /projects/titles
Get all project titles.

**Response:**
```json
[
  {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "title": "Project Title",
    "submittedBy": "student@example.com",
    "similarity": 25,
    "status": "submitted",
    "dateSubmitted": "2023-09-01T10:00:00.000Z"
  }
]
```

## Error Responses

All endpoints may return these error responses:

**400 Bad Request:**
```json
{
  "message": "Validation error message"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Server error"
}
```
