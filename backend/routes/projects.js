const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth, authorize } = require('../middleware/auth');

// GET /api/projects - List all available endpoints
router.get('/', auth, (req, res) => {
    res.status(200).json({
        message: 'Project API endpoints',
        endpoints: {
            'GET /api/projects/student': 'Get student project information',
            'GET /api/projects/review-stages': 'Get all review stages for student',
            'POST /api/projects/check-similarity': 'Check title similarity',
            'POST /api/projects/submit-title': 'Submit project title (Review 0)',
            'POST /api/projects/submit-stage': 'Submit a review stage',
            'POST /api/projects/search': 'Search for similar project titles (legacy)',
            'GET /api/projects/suggestions': 'Get real-time suggestions (legacy)',
            'GET /api/projects/titles': 'Get all project titles (legacy)'
        }
    });
});

// Student project management routes
router.get('/student', auth, authorize('Student'), projectController.getStudentProject);
router.get('/review-stages', auth, authorize('Student'), projectController.getReviewStages);
router.post('/check-similarity', auth, authorize('Student'), projectController.checkTitleSimilarity);
router.post('/submit-stage', auth, authorize('Student'), projectController.submitReviewStage);

// Legacy routes (for backward compatibility)
router.get('/suggestions', auth, projectController.getSuggestions);
router.post('/search', auth, projectController.searchTitle);
router.get('/titles', auth, projectController.getAllTitles);

// Updated title submission route
router.post('/submit-title', auth, authorize('Student'), projectController.submitTitle);

module.exports = router;
