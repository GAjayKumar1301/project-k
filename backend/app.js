const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const errorHandler = require('./utils/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Project Management System API is running' 
    });
});

// Frontend routes
const frontendPath = path.join(__dirname, '../frontend');

// Serve static files
app.use(express.static(frontendPath));

// Main routes
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'login.html'));
});

// Dashboard routes
app.get('/pages/student/dashboard', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/student/dashboard.html'));
});

app.get('/pages/student/home', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/student/home.html'));
});

app.get('/pages/staff/dashboard', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/staff/dashboard.html'));
});

app.get('/pages/admin/dashboard', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/admin/dashboard.html'));
});

// Handle HTML file requests
app.get('/*.html', (req, res, next) => {
    const filePath = path.join(frontendPath, req.path);
    res.sendFile(filePath, err => {
        if (err) {
            if (err.code === 'ENOENT') {
                next(); // Pass to 404 handler
            } else {
                next(err); // Pass other errors to error handler
            }
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(frontendPath, '404.html'), err => {
        if (err) {
            res.status(404).send('Page not found');
        }
    });
});

// Error handling middleware
app.use(errorHandler.globalErrorHandler);

module.exports = app;
