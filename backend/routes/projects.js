const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// GET /api/projects - List all available endpoints
router.get('/', (req, res) => {
    res.status(200).json({
        message: 'Project API endpoints',
        endpoints: {
            'POST /api/projects/search': 'Search for similar project titles',
            'GET /api/projects/suggestions': 'Get real-time suggestions',
            'POST /api/projects/submit-title': 'Submit a new project title',
            'GET /api/projects/titles': 'Get all project titles'
        }
    });
});

// GET /api/projects/suggestions
router.get('/suggestions', projectController.getSuggestions);

// POST /api/projects/search
router.post('/search', projectController.searchTitle);

// POST /api/projects/submit-title
router.post('/submit-title', projectController.submitTitle);

// GET /api/projects/titles
router.get('/titles', projectController.getAllTitles);

module.exports = router;
