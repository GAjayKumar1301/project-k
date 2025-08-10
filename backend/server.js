const app = require('./app');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set port
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend available at: http://localhost:${PORT}`);
    console.log(`🔌 API available at: http://localhost:${PORT}/api`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => {
        process.exit(1);
    });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Process terminated');
    });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    console.log('\n👋 SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Process terminated');
    });
});

module.exports = server;
