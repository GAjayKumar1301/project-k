const Project = require('../models/Project');
const ProjectTitle = require('../models/ProjectTitle'); // Keep for backward compatibility
const User = require('../models/User');
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

    // Get or create student project
    getStudentProject: async (req, res) => {
        try {
            const studentId = req.user.userId;
            const user = await User.findById(studentId);
            
            if (!user || user.userType !== 'Student') {
                return res.status(403).json({
                    message: 'Access denied. Student account required.'
                });
            }
            
            // Find existing project or create new one
            let project = await Project.findOne({ studentId })
                .populate('studentId', 'name email')
                .populate('guideId', 'name email');
            
            if (!project) {
                // Create new project with default academic year and department
                const currentYear = new Date().getFullYear();
                const academicYear = `${currentYear}-${currentYear + 1}`;
                
                project = await Project.createForStudent(
                    studentId,
                    user.department || 'Computer Science', // Default department
                    academicYear
                );
                
                // Populate the created project
                project = await Project.findById(project._id)
                    .populate('studentId', 'name email')
                    .populate('guideId', 'name email');
            }
            
            res.status(200).json({
                success: true,
                project,
                currentStage: project.currentAvailableStage,
                progressPercentage: project.progressPercentage,
                nextDueDate: project.nextDueDate
            });
        } catch (error) {
            console.error('Get student project error:', error);
            res.status(500).json({
                message: 'Error retrieving project information',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Submit title for Review 0
    submitTitle: async (req, res) => {
        try {
            const { title, description } = req.body;
            const studentId = req.user.userId;
            
            if (!title || title.trim() === '') {
                return res.status(400).json({
                    message: 'Project title is required'
                });
            }
            
            // Get or create student project
            let project = await Project.findOne({ studentId });
            
            if (!project) {
                const user = await User.findById(studentId);
                const currentYear = new Date().getFullYear();
                const academicYear = `${currentYear}-${currentYear + 1}`;
                
                project = await Project.createForStudent(
                    studentId,
                    user.department || 'Computer Science',
                    academicYear
                );
            }
            
            // Check if title submission (stage 0) is available
            const titleStage = project.reviewStages.find(s => s.stageNumber === 0);
            
            if (!titleStage || titleStage.status !== 'available') {
                return res.status(400).json({
                    message: 'Title submission is not available at this time',
                    status: 'not_available'
                });
            }
            
            // Submit the title
            const submissionData = {
                title: title.trim(),
                description: description?.trim() || ''
            };
            
            try {
                await project.submitReviewStage(0, submissionData);
                
                res.status(201).json({
                    message: 'Project title submitted successfully',
                    status: 'submitted',
                    project: {
                        currentStage: project.currentStage,
                        progressPercentage: project.progressPercentage,
                        nextDueDate: project.nextDueDate
                    }
                });
            } catch (similarityError) {
                return res.status(400).json({
                    message: similarityError.message,
                    status: 'high_similarity'
                });
            }
            
        } catch (error) {
            console.error('Submit title error:', error);
            res.status(500).json({
                message: 'Error submitting title',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Submit review stage
    submitReviewStage: async (req, res) => {
        try {
            const { stageNumber, title, description, files } = req.body;
            const studentId = req.user.userId;
            
            const project = await Project.findOne({ studentId });
            
            if (!project) {
                return res.status(404).json({
                    message: 'Project not found. Please submit a title first.'
                });
            }
            
            const submissionData = {
                title: title?.trim(),
                description: description?.trim(),
                files: files || []
            };
            
            try {
                await project.submitReviewStage(stageNumber, submissionData);
                
                res.status(200).json({
                    message: `Review stage ${stageNumber} submitted successfully`,
                    status: 'submitted',
                    project: {
                        currentStage: project.currentStage,
                        progressPercentage: project.progressPercentage,
                        nextDueDate: project.nextDueDate
                    }
                });
            } catch (submissionError) {
                return res.status(400).json({
                    message: submissionError.message,
                    status: 'submission_error'
                });
            }
            
        } catch (error) {
            console.error('Submit review stage error:', error);
            res.status(500).json({
                message: 'Error submitting review stage',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Get project review stages
    getReviewStages: async (req, res) => {
        try {
            const studentId = req.user.userId;
            
            const project = await Project.findOne({ studentId })
                .populate('studentId', 'name email')
                .populate('guideId', 'name email');
            
            if (!project) {
                return res.status(404).json({
                    message: 'Project not found. Please submit a title first.'
                });
            }
            
            res.status(200).json({
                success: true,
                reviewStages: project.reviewStages,
                currentStage: project.currentStage,
                overallStatus: project.overallStatus,
                progressPercentage: project.progressPercentage,
                notifications: project.metadata.notifications.filter(n => !n.read).slice(0, 5)
            });
        } catch (error) {
            console.error('Get review stages error:', error);
            res.status(500).json({
                message: 'Error retrieving review stages',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Check title similarity
    checkTitleSimilarity: async (req, res) => {
        try {
            const { title } = req.body;
            const studentId = req.user.userId;
            
            if (!title || title.trim() === '') {
                return res.status(400).json({
                    message: 'Title is required for similarity check'
                });
            }
            
            // Get or create a temporary project for similarity checking
            let project = await Project.findOne({ studentId });
            
            if (!project) {
                const user = await User.findById(studentId);
                project = new Project({
                    studentId,
                    department: user.department || 'Computer Science',
                    academicYear: '2024-2025'
                });
            }
            
            const similarityResult = await project.checkTitleSimilarity(title.trim());
            
            res.status(200).json({
                success: true,
                isUnique: similarityResult.isUnique,
                similarity: similarityResult.maxSimilarity,
                threshold: 60,
                similarProjects: similarityResult.similarProjects,
                message: similarityResult.isUnique 
                    ? 'Title is unique and can be submitted'
                    : `Title has ${similarityResult.maxSimilarity}% similarity with existing projects`
            });
            
        } catch (error) {
            console.error('Check similarity error:', error);
            res.status(500).json({
                message: 'Error checking title similarity',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
