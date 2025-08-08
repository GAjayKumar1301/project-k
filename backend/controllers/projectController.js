const ProjectTitle = require('../models/ProjectTitle');
const { calculateSimilarity, removeStopWords } = require('../utils/similarityUtils');

const projectController = {
    searchTitle: async (req, res) => {
        const { searchQuery } = req.body;

        if (!searchQuery || searchQuery.trim() === '') {
            return res.status(400).json({
                message: 'Search query is required'
            });
        }

        try {
            // Fetch all project titles from database
            const projectTitles = await ProjectTitle.find({});
            
            if (projectTitles.length === 0) {
                return res.status(200).json({
                    exactMatches: [],
                    allMatches: [],
                    message: 'No projects found in database',
                    totalProjects: 0
                });
            }

            const searchTerm = searchQuery.trim().toLowerCase();
            
            // Find exact character matches
            const exactMatches = projectTitles.filter(project => 
                project.title.toLowerCase().includes(searchTerm)
            ).map(project => ({
                title: project.title,
                submittedBy: project.submittedBy,
                dateSubmitted: project.dateSubmitted
            }));

            // Get all titles for display
            const allMatches = projectTitles.map(project => ({
                title: project.title,
                submittedBy: project.submittedBy,
                dateSubmitted: project.dateSubmitted
            })).slice(0, 20); // Limit to 20 results
            
            res.status(200).json({
                searchQuery: searchQuery.trim(),
                exactMatches: exactMatches,
                allMatches: allMatches,
                totalProjects: projectTitles.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ 
                message: 'Search error occurred',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    getSuggestions: async (req, res) => {
        const { query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(200).json({ suggestions: [] });
        }

        try {
            const searchTerm = query.trim().toLowerCase();
            const projectTitles = await ProjectTitle.find({});
            
            // Find titles that contain the search term
            const suggestions = projectTitles
                .filter(project => 
                    project.title.toLowerCase().includes(searchTerm)
                )
                .map(project => project.title)
                .slice(0, 8); // Limit to 8 suggestions

            res.status(200).json({ suggestions });
        } catch (error) {
            console.error('Suggestions error:', error);
            res.status(500).json({ suggestions: [] });
        }
    },

    submitTitle: async (req, res) => {
        const { title, submittedBy } = req.body;

        try {
            // Check for exact duplicate
            const existingTitle = await ProjectTitle.findOne({ 
                title: { $regex: new RegExp(`^${title.trim()}$`, 'i') }
            });
            
            if (existingTitle) {
                return res.status(400).json({
                    message: 'This exact title already exists',
                    status: 'duplicate'
                });
            }

            const newTitle = new ProjectTitle({
                title: title.trim(),
                submittedBy
            });

            await newTitle.save();

            res.status(201).json({
                message: 'Project title submitted successfully',
                status: 'submitted'
            });
        } catch (error) {
            console.error('Submit title error:', error);
            res.status(500).json({ 
                message: 'Error submitting title' 
            });
        }
    },

    getAllTitles: async (req, res) => {
        try {
            const titles = await ProjectTitle.find({}).sort({ dateSubmitted: -1 });
            res.status(200).json(titles);
        } catch (error) {
            console.error('Get titles error:', error);
            res.status(500).json({ 
                message: 'Error fetching titles' 
            });
        }
    }
};

module.exports = projectController;
