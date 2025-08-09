const errorHandler = {
    handleError: (res, message, statusCode = 500) => {
        console.error(`Error: ${message}`);
        return res.status(statusCode).json({
            error: true,
            message: message,
            statusCode
        });
    },

    // Global error handler middleware
    globalErrorHandler: (err, req, res, next) => {
        console.error('Error:', err.stack);

        // Mongoose validation error
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(error => error.message);
            return res.status(400).json({
                error: true,
                message: 'Validation Error',
                errors: messages,
                statusCode: 400
            });
        }

        // Mongoose duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({
                error: true,
                message: 'Duplicate field value entered',
                statusCode: 400
            });
        }

        // JWT errors
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: true,
                message: 'Invalid token',
                statusCode: 401
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: true,
                message: 'Token expired',
                statusCode: 401
            });
        }

        // Default error
        res.status(err.statusCode || 500).json({
            error: true,
            message: err.message || 'Server Error',
            statusCode: err.statusCode || 500
        });
    },

    // Async handler wrapper
    asyncHandler: (fn) => {
        return function(req, res, next) {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
};

module.exports = errorHandler;
