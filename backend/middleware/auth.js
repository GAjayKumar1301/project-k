const jwt = require('jsonwebtoken');
const User = require('../models/User');
const errorHandler = require('../utils/errorHandler');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || '3e542f09fc45bf5a23bab07bafa26c35a396a68c88bd66bed25b2f5316d97506';

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return errorHandler.handleError(res, 'No authentication token found', 401);
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Find user
            const user = await User.findById(decoded._id)
                .select('-password -resetPasswordToken -resetPasswordExpires');
            
            if (!user) {
                return errorHandler.handleError(res, 'User not found', 401);
            }

            // Status check removed as it's not part of our user model

            // Check if token is in user's tokens array
            const tokenExists = user.tokens.find(t => t.token === token);
            if (!tokenExists) {
                return errorHandler.handleError(res, 'Token is invalid or expired', 401);
            }

            // Check token expiration
            if (tokenExists.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
                // Remove expired token
                user.tokens = user.tokens.filter(t => t.token !== token);
                await user.save();
                return errorHandler.handleError(res, 'Token has expired', 401);
            }

            // Add user and token to request
            req.user = user;
            req.token = token;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return errorHandler.handleError(res, 'Invalid token', 401);
            }
            if (error.name === 'TokenExpiredError') {
                return errorHandler.handleError(res, 'Token has expired', 401);
            }
            throw error;
        }
    } catch (error) {
        return errorHandler.handleError(res, error.message, 500);
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.userType)) {
            return errorHandler.handleError(res, 
                'You do not have permission to access this resource', 
                403
            );
        }
        next();
    };
};

// Rate limiting middleware
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again after 15 minutes'
});

module.exports = { auth, authorize, authLimiter };
