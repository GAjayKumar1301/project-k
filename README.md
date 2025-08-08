# Project K - Student Project Management System

A full-stack web application for managing student project submissions and reviews.

## 📁 Project Structure

```
project-k/
├── backend/                 # Node.js Express backend
│   ├── controllers/         # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── config/             # Database and app configuration
│   ├── utils/              # Utility functions
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   └── package.json        # Backend dependencies
├── frontend/               # Frontend client
│   ├── pages/              # HTML pages
│   ├── js/                 # JavaScript files
│   ├── css/                # Stylesheets
│   ├── assets/             # Images, fonts, etc.
│   └── index.html          # Main login page
├── shared/                 # Shared utilities/types
├── docs/                   # Documentation
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally)

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
Simply open `frontend/index.html` in a web browser or serve it with a local server.

## 📊 Features

### Completed
- User authentication (Admin, Staff, Student)
- Project title search with similarity detection
- Project title submission
- Database integration with MongoDB

### Planned
- File uploads for project documents
- Multi-stage review system
- Email notifications
- Admin dashboard

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Projects
- `POST /api/projects/search` - Search project titles
- `POST /api/projects/submit-title` - Submit project title
- `GET /api/projects/titles` - Get all project titles

## 💾 Database

Uses MongoDB with the following collections:
- `users` - User accounts
- `projecttitles` - Project title submissions

## 🔄 Development

The project follows a modular structure for easy maintenance and scalability:

- **Backend**: RESTful API with Express.js
- **Frontend**: Vanilla JavaScript with Bootstrap UI
- **Database**: MongoDB with Mongoose ODM
