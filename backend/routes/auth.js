const express = require('express');
const router = express.Router();
const { auth, authorize, authLimiter } = require('../middleware/auth');
const authController = require('../controllers/authController');
const errorHandler = require('../utils/errorHandler');

// Import asyncHandler directly
const asyncHandler = errorHandler.asyncHandler;

// Public routes - no authentication required
router.post('/register', asyncHandler(authController.register));
router.post('/login', authLimiter, asyncHandler(authController.login));
router.post('/password/reset-request', asyncHandler(authController.requestPasswordReset));
router.post('/password/reset', asyncHandler(authController.resetPassword));

// Protected routes - require authentication
router.use(auth); // Apply authentication middleware to all routes below

router.get('/profile', asyncHandler(authController.getProfile));
router.patch('/profile', asyncHandler(authController.updateProfile));
router.post('/password/change', asyncHandler(authController.changePassword));
router.post('/logout', asyncHandler(authController.logout));
router.post('/logout-all', asyncHandler(authController.logoutAll));
router.get('/verify', asyncHandler(authController.verifyToken));

// Admin only routes
router.use('/admin', authorize('Admin'));
router.get('/admin/users', asyncHandler(async (req, res) => {
    const users = await User.find({})
        .select('-password -tokens -resetPasswordToken -resetPasswordExpires')
        .sort({ createdAt: -1 });
    res.json(users);
}));

// Documentation endpoint
router.get('/', (req, res) => {
    res.status(200).json({
        message: 'Authentication API Documentation',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            profile: 'GET /api/auth/profile',
            verify: 'GET /api/auth/verify'
        }
    });
});

module.exports = router;
