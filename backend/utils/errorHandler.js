const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.stack);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({
            message: 'Validation Error',
            errors: messages
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(400).json({
            message: 'Duplicate field value entered'
        });
    }

    // Default error
    res.status(err.statusCode || 500).json({
        message: err.message || 'Server Error'
    });
};

module.exports = errorHandler;
