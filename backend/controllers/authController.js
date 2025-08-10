const User = require('../models/User');
const errorHandler = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '3e542f09fc45bf5a23bab07bafa26c35a396a68c88bd66bed25b2f5316d97506';

const authController = {
    // Register new user
    register: async (req, res) => {
        try {
            const {
                name,
                email,
                password,
                role,
                department,
                studentId,
                staffId,
                academicYear
            } = req.body;

            // Validate required fields
            if (!name || !email || !password || !role || !department) {
                return errorHandler.handleError(res, 'Missing required fields', 400);
            }

            // Check if user exists
            const existingUser = await User.findOne({
                $or: [
                    { email: email.toLowerCase() },
                    ...(studentId ? [{ studentId }] : []),
                    ...(staffId ? [{ staffId }] : [])
                ]
            });

            if (existingUser) {
                return errorHandler.handleError(res, 'User already exists', 400);
            }

            // Create user with role-specific fields
            const user = new User({
                name,
                email: email.toLowerCase(),
                password,
                userType: role, // Fix: use userType instead of role
                department,
                ...(role === 'Student' && { studentId, academicYear }),
                ...(role === 'Staff' && { staffId })
            });

            const token = await user.generateAuthToken(req.get('User-Agent'));
            await user.save();

            res.status(201).json({
                message: 'Registration successful',
                user: user.toJSON(),
                token
            });
        } catch (error) {
            errorHandler.handleError(res, error.message, 500);
        }
    },

    // Login user
    login: async (req, res) => {
        try {
            const { email, password, userType } = req.body;

            // Validate input
            if (!email || !password || !userType) {
                return errorHandler.handleError(res, 'Email, password, and user type are required', 400);
            }

            try {
                const user = await User.findByCredentials(email.toLowerCase(), password, userType);
                const token = await user.generateAuthToken(req.get('User-Agent'));

                res.json({
                    message: 'Login successful',
                    user: user.toJSON(),
                    token
                });
            } catch (error) {
                return errorHandler.handleError(res, error.message, 401);
            }
        } catch (error) {
            errorHandler.handleError(res, error.message, 500);
        }
    },

    // Logout user
    logout: async (req, res) => {
        try {
            // Remove current token
            req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
            await req.user.save();

            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            errorHandler.handleError(res, error.message, 500);
        }
    },

    // Logout from all devices
    logoutAll: async (req, res) => {
        try {
            req.user.tokens = [];
            await req.user.save();

            res.json({ message: 'Logged out from all devices' });
        } catch (error) {
            errorHandler.handleError(res, error.message, 500);
        }
    },

    // Request password reset
    requestPasswordReset: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                return errorHandler.handleError(res, 'User not found', 404);
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = await bcrypt.hash(resetToken, 8);

            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
            await user.save();

            // TODO: Send email with reset link
            // For now, return token in response (only for development)
            res.json({
                message: 'Password reset instructions sent to email',
                resetToken // Remove this in production
            });
        } catch (error) {
            errorHandler.handleError(res, error.message, 500);
        }
    },

    // Reset password
    resetPassword: async (req, res) => {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return errorHandler.handleError(res, 'Token and new password are required', 400);
            }

            const user = await User.findOne({
                resetPasswordToken: { $exists: true },
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return errorHandler.handleError(res, 'Invalid or expired reset token', 400);
            }

            // Verify reset token
            const isValid = await bcrypt.compare(token, user.resetPasswordToken);
            if (!isValid) {
                return errorHandler.handleError(res, 'Invalid reset token', 400);
            }

            // Update password
            user.password = newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            // Invalidate all existing tokens
            user.tokens = [];
            await user.save();

            res.json({ message: 'Password reset successful' });
        } catch (error) {
            errorHandler.handleError(res, error.message, 500);
        }
    },

    // Change password (authenticated)
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return errorHandler.handleError(res, 'Current and new password are required', 400);
            }

            const isMatch = await bcrypt.compare(currentPassword, req.user.password);
            if (!isMatch) {
                return errorHandler.handleError(res, 'Current password is incorrect', 400);
            }

            req.user.password = newPassword;
            
            // Invalidate all existing tokens except current one
            req.user.tokens = req.user.tokens.filter(token => token.token === req.token);
            
            await req.user.save();

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            errorHandler.handleError(res, error.message, 500);
        }
    },

    // Get current user profile
    getProfile: async (req, res) => {
        try {
            res.json({ user: req.user.toJSON() });
        } catch (error) {
            errorHandler.handleError(res, error.message, 500);
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        const allowedUpdates = ['name', 'department', 'profileImage'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return errorHandler.handleError(res, 'Invalid updates', 400);
        }

        try {
            updates.forEach(update => req.user[update] = req.body[update]);
            await req.user.save();

            res.json({
                message: 'Profile updated successfully',
                user: req.user.toJSON()
            });
        } catch (error) {
            errorHandler.handleError(res, error.message, 500);
        }
    },

    // Verify token
    verifyToken: async (req, res) => {
        try {
            if (!req.user) {
                return errorHandler.handleError(res, 'Invalid token', 401);
            }

            // Check if password needs to be changed
            if (req.user.isPasswordExpired()) {
                return res.json({
                    user: req.user.toJSON(),
                    passwordExpired: true
                });
            }

            res.json({ user: req.user.toJSON() });
        } catch (error) {
            errorHandler.handleError(res, error.message, 500);
        }
    }
};

module.exports = authController;
