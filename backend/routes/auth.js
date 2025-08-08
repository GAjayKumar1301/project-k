const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET /api/auth - List all available auth endpoints
router.get('/', (req, res) => {
    res.status(200).json({
        message: 'Authentication API endpoints',
        endpoints: {
            'POST /api/auth/login': 'Login with email, password, and userType',
            'POST /api/auth/register': 'Register a new user'
        },
        supportedUserTypes: ['Admin', 'Staff', 'Student']
    });
});

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/register
router.post('/register', authController.register);

module.exports = router;
