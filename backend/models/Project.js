const mongoose = require('mongoose');

// Review Stage Schema
const reviewStageSchema = new mongoose.Schema({
    stageNumber: {
        type: Number,
        required: true,
        enum: [0, 1, 2, 3], // 0: Title, 1: Initial Proposal, 2: Progress Report, 3: Complete Submission
    },
    stageName: {
        type: String,
        required: true,
        enum: ['Project Title Submission', 'Initial Proposal', 'Progress Report', 'Complete Submission']
    },
    stageDescription: {
        type: String,
        required: true
    },
    requiredFields: [{
        type: String
    }],
    icon: {
        type: String,
        default: 'fas fa-file'
    },
    status: {
        type: String,
        enum: ['locked', 'available', 'submitted', 'reviewed', 'completed'],
        default: 'locked'
    },
    submission: {
        title: String,
        description: String,
        files: [{
            filename: String,
            originalName: String,
            path: String,
            mimeType: String,
            size: Number,
            uploadDate: {
                type: Date,
                default: Date.now
            }
        }],
        submittedAt: Date,
        similarity: {
            percentage: Number,
            comparedWith: [{
                projectId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Project'
                },
                title: String,
                percentage: Number
            }]
        }
    },
    feedback: {
        comment: String,
        grade: {
            type: Number,
            min: 0,
            max: 100
        },
        reviewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: Date,
        approved: {
            type: Boolean,
            default: false
        }
    },
    dueDate: Date,
    completedAt: Date
}, {
    timestamps: true
});

// Main Project Schema
const projectSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: async function(value) {
                const User = mongoose.model('User');
                const user = await User.findById(value);
                return user && user.userType === 'Student';
            },
            message: 'Invalid student ID or user is not a student'
        }
    },
    guideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        validate: {
            validator: async function(value) {
                if (!value) return true; // Guide assignment is optional initially
                const User = mongoose.model('User');
                const user = await User.findById(value);
                return user && user.userType === 'Staff';
            },
            message: 'Invalid guide ID or user is not staff'
        }
    },
    department: {
        type: String,
        required: true
    },
    academicYear: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{4}-\d{4}$/.test(v);
            },
            message: 'Academic year must be in format YYYY-YYYY'
        }
    },
    reviewStages: [reviewStageSchema],
    currentStage: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    },
    overallStatus: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'rejected'],
        default: 'not_started'
    },
    metadata: {
        createdAt: {
            type: Date,
            default: Date.now
        },
        lastActivity: {
            type: Date,
            default: Date.now
        },
        notifications: [{
            message: String,
            type: {
                type: String,
                enum: ['info', 'warning', 'success', 'error']
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            read: {
                type: Boolean,
                default: false
            }
        }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
projectSchema.index({ studentId: 1 });
projectSchema.index({ guideId: 1 });
projectSchema.index({ department: 1, academicYear: 1 });
projectSchema.index({ currentStage: 1 });
projectSchema.index({ 'reviewStages.status': 1 });

// Calculate similarity between two strings using Jaccard similarity
projectSchema.methods.calculateSimilarity = function(str1, str2) {
    // Preprocess strings
    const normalize = (str) => str.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2); // Remove small words
    
    const words1 = new Set(normalize(str1));
    const words2 = new Set(normalize(str2));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
};

// Check similarity with existing projects (60% threshold)
projectSchema.methods.checkTitleSimilarity = async function(title) {
    const existingProjects = await this.constructor.find({
        _id: { $ne: this._id },
        department: this.department,
        'reviewStages.submission.title': { $exists: true }
    });
    
    let maxSimilarity = 0;
    let similarProjects = [];
    const SIMILARITY_THRESHOLD = 0.6; // 60%
    
    for (const project of existingProjects) {
        for (const stage of project.reviewStages) {
            if (stage.submission && stage.submission.title) {
                const similarity = this.calculateSimilarity(title, stage.submission.title);
                
                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                }
                
                if (similarity >= 0.5) { // Store similarities above 50% for reference
                    similarProjects.push({
                        projectId: project._id,
                        title: stage.submission.title,
                        percentage: Math.round(similarity * 100)
                    });
                }
            }
        }
    }
    
    return {
        isUnique: maxSimilarity < SIMILARITY_THRESHOLD,
        maxSimilarity: Math.round(maxSimilarity * 100),
        similarProjects: similarProjects.sort((a, b) => b.percentage - a.percentage)
    };
};

// Initialize review stages for a new project
projectSchema.methods.initializeReviewStages = function() {
    const stages = [
        {
            stageNumber: 0,
            stageName: 'Project Title Submission',
            stageDescription: 'Submit your project title for approval',
            status: 'available', // First stage is available immediately
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            requiredFields: ['title', 'description'],
            icon: 'fas fa-heading'
        },
        {
            stageNumber: 1,
            stageName: 'Initial Proposal',
            stageDescription: 'Submit your detailed project proposal',
            status: 'locked',
            dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
            requiredFields: ['title', 'description', 'methodology', 'objectives'],
            icon: 'fas fa-file-alt'
        },
        {
            stageNumber: 2,
            stageName: 'Progress Report',
            stageDescription: 'Submit your project progress report',
            status: 'locked',
            dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
            requiredFields: ['progressDescription', 'completedWork', 'challenges', 'nextSteps'],
            icon: 'fas fa-chart-line'
        },
        {
            stageNumber: 3,
            stageName: 'Complete Submission',
            stageDescription: 'Submit your final project documentation',
            status: 'locked',
            dueDate: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000), // 49 days from now
            requiredFields: ['finalReport', 'sourceCode', 'documentation'],
            icon: 'fas fa-file-pdf'
        }
    ];
    
    this.reviewStages = stages;
    this.currentStage = 0;
    this.overallStatus = 'in_progress';
};

// Submit a review stage
projectSchema.methods.submitReviewStage = async function(stageNumber, submissionData) {
    const stage = this.reviewStages.find(s => s.stageNumber === stageNumber);
    
    if (!stage) {
        throw new Error('Review stage not found');
    }
    
    if (stage.status !== 'available') {
        throw new Error('This review stage is not available for submission');
    }
    
    // For title submission (stage 0), check similarity
    if (stageNumber === 0 && submissionData.title) {
        const similarityCheck = await this.checkTitleSimilarity(submissionData.title);
        
        if (!similarityCheck.isUnique) {
            throw new Error(`Title similarity too high (${similarityCheck.maxSimilarity}%). Please choose a different title.`);
        }
        
        submissionData.similarity = {
            percentage: similarityCheck.maxSimilarity,
            comparedWith: similarityCheck.similarProjects
        };
    }
    
    stage.submission = {
        ...submissionData,
        submittedAt: new Date()
    };
    stage.status = 'submitted';
    
    this.metadata.lastActivity = new Date();
    
    // Add notification
    this.metadata.notifications.push({
        message: `${stage.stageName} submitted successfully`,
        type: 'success'
    });
    
    await this.save();
    return stage;
};

// Approve a review stage and unlock the next one
projectSchema.methods.approveReviewStage = async function(stageNumber, feedback) {
    const stage = this.reviewStages.find(s => s.stageNumber === stageNumber);
    
    if (!stage || stage.status !== 'submitted') {
        throw new Error('Review stage not found or not submitted');
    }
    
    stage.feedback = {
        ...feedback,
        reviewedAt: new Date(),
        approved: true
    };
    stage.status = 'completed';
    stage.completedAt = new Date();
    
    // Unlock next stage
    const nextStage = this.reviewStages.find(s => s.stageNumber === stageNumber + 1);
    if (nextStage) {
        nextStage.status = 'available';
        this.currentStage = stageNumber + 1;
        
        // Add notification
        this.metadata.notifications.push({
            message: `${stage.stageName} approved. ${nextStage.stageName} is now available.`,
            type: 'success'
        });
    } else {
        // All stages completed
        this.overallStatus = 'completed';
        this.metadata.notifications.push({
            message: 'All review stages completed successfully!',
            type: 'success'
        });
    }
    
    this.metadata.lastActivity = new Date();
    await this.save();
    return stage;
};

// Reject a review stage
projectSchema.methods.rejectReviewStage = async function(stageNumber, feedback) {
    const stage = this.reviewStages.find(s => s.stageNumber === stageNumber);
    
    if (!stage || stage.status !== 'submitted') {
        throw new Error('Review stage not found or not submitted');
    }
    
    stage.feedback = {
        ...feedback,
        reviewedAt: new Date(),
        approved: false
    };
    stage.status = 'available'; // Allow resubmission
    
    // Add notification
    this.metadata.notifications.push({
        message: `${stage.stageName} requires revision. Please resubmit.`,
        type: 'warning'
    });
    
    this.metadata.lastActivity = new Date();
    await this.save();
    return stage;
};

// Virtual for current available stage
projectSchema.virtual('currentAvailableStage').get(function() {
    return this.reviewStages.find(s => s.status === 'available') || null;
});

// Virtual for next due date
projectSchema.virtual('nextDueDate').get(function() {
    const availableStage = this.reviewStages.find(s => s.status === 'available');
    return availableStage ? availableStage.dueDate : null;
});

// Virtual for progress percentage
projectSchema.virtual('progressPercentage').get(function() {
    const completedStages = this.reviewStages.filter(s => s.status === 'completed').length;
    return Math.round((completedStages / this.reviewStages.length) * 100);
});

// Static method to create a new project for a student
projectSchema.statics.createForStudent = async function(studentId, department, academicYear) {
    const project = new this({
        studentId,
        department,
        academicYear
    });
    
    project.initializeReviewStages();
    await project.save();
    return project;
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
