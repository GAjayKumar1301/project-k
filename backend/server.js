const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
    console.log(`🌐 Frontend URL: http://localhost:${PORT}/`);
    console.log(` Dashboard URL: http://localhost:${PORT}/dashboard`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Auth API: http://localhost:${PORT}/api/auth`);
    console.log(` Projects API: http://localhost:${PORT}/api/projects`);
});
