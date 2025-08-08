const mongoose = require('mongoose');

const projectTitleSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true 
    },
    submittedBy: { 
        type: String, 
        required: true 
    },
    similarity: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['submitted', 'approved', 'rejected'],
        default: 'submitted'
    },
    dateSubmitted: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('ProjectTitle', projectTitleSchema);
