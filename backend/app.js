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

app.get('/login', (req, res) => {
    res.sendFile(path.join(frontendPath, 'login.html'));
});

// Clean Student Routes (without /pages/)
app.get('/student/dashboard', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/student/dashboard.html'));
});

app.get('/student/reviews', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/student/review-dashboard.html'));
});

app.get('/student/home', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/student/home.html'));
});

// Clean Staff Routes (without /pages/)
app.get('/staff/dashboard', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/staff/dashboard.html'));
});

app.get('/staff/reviews', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/staff/review-dashboard.html'));
});

app.get('/staff/home', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/staff/home.html'));
});

// Clean Admin Routes (without /pages/)
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/admin/dashboard.html'));
});

app.get('/admin/users', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/admin/users.html'));
});

app.get('/admin/home', (req, res) => {
    res.sendFile(path.join(frontendPath, 'pages/admin/home.html'));
});

// Legacy routes for backward compatibility (redirect to clean URLs)
app.get('/pages/student/dashboard', (req, res) => {
    res.redirect(301, '/student/dashboard');
});

app.get('/pages/student/review-dashboard', (req, res) => {
    res.redirect(301, '/student/reviews');
});

app.get('/pages/student/home', (req, res) => {
    res.redirect(301, '/student/home');
});

app.get('/pages/staff/dashboard', (req, res) => {
    res.redirect(301, '/staff/dashboard');
});

app.get('/pages/admin/dashboard', (req, res) => {
    res.redirect(301, '/admin/dashboard');
});

// Direct HTML file access (for development)
app.get('/login.html', (req, res) => {
    res.redirect(301, '/login');
});

app.get('/404.html', (req, res) => {
    res.sendFile(path.join(frontendPath, '404.html'));
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
