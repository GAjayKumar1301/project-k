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

            const searchTerm = searchQuery.trim();
            
            // Calculate similarity for all titles
            const similarityResult = calculateSimilarity(searchTerm, projectTitles);
            
            // Find exact character matches with similarity percentage
            const exactMatches = projectTitles.filter(project => 
                project.title.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(project => {
                // Find the similarity for this project
                const similarityData = similarityResult.allResults.find(result => 
                    result.title === project.title
                );
                return {
                    title: project.title,
                    submittedBy: project.submittedBy,
                    dateSubmitted: project.dateSubmitted,
                    similarity: similarityData ? similarityData.similarity : 0
                };
            }).sort((a, b) => b.similarity - a.similarity); // Sort by similarity descending

            // Get all titles with similarity scores, sorted by similarity
            const allMatches = similarityResult.allResults
                .slice(0, 20) // Limit to 20 results
                .map(result => ({
                    title: result.title,
                    submittedBy: result.submittedBy,
                    dateSubmitted: result.dateSubmitted,
                    similarity: result.similarity
                }));
            
            res.status(200).json({
                searchQuery: searchQuery.trim(),
                exactMatches: exactMatches,
                allMatches: allMatches,
                totalProjects: projectTitles.length,
                bestMatch: similarityResult.bestMatch,
                highestSimilarity: similarityResult.similarity,
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
            // Get all existing titles to check for similarity
            const existingTitles = await ProjectTitle.find({});
            
            // Check for exact duplicate first
            const exactDuplicate = await ProjectTitle.findOne({ 
                title: { $regex: new RegExp(`^${title.trim()}$`, 'i') }
            });
            
            if (exactDuplicate) {
                return res.status(400).json({
                    message: 'This exact title already exists',
                    status: 'duplicate',
                    similarity: 100
                });
            }

            // Calculate similarity with existing titles
            if (existingTitles.length > 0) {
                const similarityResult = calculateSimilarity(title.trim(), existingTitles);
                
                // If highest similarity is above 80%, reject the submission
                if (similarityResult.similarity >= 80) {
                    return res.status(400).json({
                        message: `Title is too similar to existing project: "${similarityResult.bestMatch}" (${similarityResult.similarity}% similarity)`,
                        status: 'high_similarity',
                        similarity: similarityResult.similarity,
                        similarTitle: similarityResult.bestMatch
                    });
                }
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
