const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewType: {
        type: String,
        enum: ['title', 'proposal', 'progress', 'final'],
        required: true
    },
    submission: {
        content: String,
        files: [{
            filename: String,
            path: String,
            mimeType: String,
            size: Number,
            uploadDate: {
                type: Date,
                default: Date.now
            }
        }],
        submittedAt: {
            type: Date,
            default: Date.now
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
        reviewedAt: Date
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'reviewed', 'resubmit'],
        default: 'pending'
    }
});

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: async function(title) {
                const Project = this.constructor;
                const similarityThreshold = 0.8; // 80% similarity threshold
                
                // Skip validation if title hasn't changed
                if (!this.isModified('title')) return true;
                
                const existingProjects = await Project.find({
                    _id: { $ne: this._id },
                    department: this.department
                });
                
                const similarity = await this.calculateMaxSimilarity(title, existingProjects);
                return similarity < similarityThreshold;
            },
            message: 'Project title is too similar to an existing project'
        }
    },
    description: {
        type: String,
        required: true,
        maxlength: 5000
    },
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
            message: 'Invalid student ID'
        }
    },
    guide: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: async function(value) {
                const User = mongoose.model('User');
                const user = await User.findById(value);
                return user && user.userType === 'Staff';
            },
            message: 'Invalid guide ID'
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
    reviews: [reviewSchema],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'in-progress', 'completed'],
        default: 'pending'
    },
    similarity: {
        percentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        comparedWith: [{
            projectId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Project'
            },
            percentage: {
                type: Number,
                min: 0,
                max: 100
            }
        }]
    },
    tags: [{
        type: String,
        trim: true
    }],
    visibility: {
        type: String,
        enum: ['public', 'private', 'department'],
        default: 'department'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
projectSchema.index({ title: 'text' });
projectSchema.index({ department: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ 'reviews.dueDate': 1 });

// Calculate similarity between two strings using cosine similarity
projectSchema.methods.calculateSimilarity = function(str1, str2) {
    const words1 = str1.toLowerCase().split(/\W+/);
    const words2 = str2.toLowerCase().split(/\W+/);
    const wordSet = new Set([...words1, ...words2]);
    
    const vector1 = Array.from(wordSet).map(word => words1.filter(w => w === word).length);
    const vector2 = Array.from(wordSet).map(word => words2.filter(w => w === word).length);
    
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitude1 * magnitude2) || 0;
};

// Calculate maximum similarity with existing projects
projectSchema.methods.calculateMaxSimilarity = async function(title, existingProjects) {
    let maxSimilarity = 0;
    const similarities = [];
    
    for (const project of existingProjects) {
        const similarity = this.calculateSimilarity(title, project.title);
        maxSimilarity = Math.max(maxSimilarity, similarity);
        
        if (similarity > 0.5) {
            similarities.push({
                projectId: project._id,
                percentage: similarity * 100
            });
        }
    }
    
    this.similarity = {
        percentage: maxSimilarity * 100,
        comparedWith: similarities
    };
    
    return maxSimilarity;
};

// Virtual for current review stage
projectSchema.virtual('currentReviewStage').get(function() {
    return this.reviews.find(r => r.status !== 'reviewed') || null;
});

// Virtual for next due date
projectSchema.virtual('nextDueDate').get(function() {
    const pendingReview = this.reviews.find(r => r.status !== 'reviewed');
    return pendingReview ? pendingReview.dueDate : null;
});

// Method to add a new review stage
projectSchema.methods.addReviewStage = async function(reviewType, dueDate) {
    this.reviews.push({
        reviewType,
        dueDate,
        status: 'pending'
    });
    await this.save();
};

// Method to submit a review
projectSchema.methods.submitReview = async function(reviewType, submission) {
    const review = this.reviews.find(r => r.reviewType === reviewType && r.status === 'pending');
    if (!review) throw new Error('Review stage not found or already submitted');
    
    review.submission = submission;
    review.status = 'submitted';
    await this.save();
};

// Method to provide feedback
projectSchema.methods.provideFeedback = async function(reviewType, feedback) {
    const review = this.reviews.find(r => r.reviewType === reviewType && r.status === 'submitted');
    if (!review) throw new Error('Review not found or not submitted');
    
    review.feedback = {
        ...feedback,
        reviewedAt: new Date()
    };
    review.status = feedback.grade >= 50 ? 'reviewed' : 'resubmit';
    await this.save();
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
