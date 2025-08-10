const mongoose = require('mongoose');

// Simple ProjectTitle schema for backward compatibility
const projectTitleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    submittedBy: {
        type: String,
        required: true,
        trim: true
    },
    dateSubmitted: {
        type: Date,
        default: Date.now
    },
    department: {
        type: String,
        default: 'Computer Science'
    },
    similarity: {
        percentage: {
            type: Number,
            default: 0
        },
        comparedWith: [{
            title: String,
            percentage: Number
        }]
    }
}, {
    timestamps: true
});

// Index for search performance
projectTitleSchema.index({ title: 'text' });
projectTitleSchema.index({ submittedBy: 1 });
projectTitleSchema.index({ dateSubmitted: -1 });

const ProjectTitle = mongoose.model('ProjectTitle', projectTitleSchema);

module.exports = ProjectTitle;
