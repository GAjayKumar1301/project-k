const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '3e542f09fc45bf5a23bab07bafa26c35a396a68c88bd66bed25b2f5316d97506';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true 
    },
    userType: {
        type: String,
        enum: ['Admin', 'Staff', 'Student'],
        required: true
    },
    department: {
        type: String,
        required: true
    },
    studentId: {
        type: String,
        sparse: true
    },
    staffId: {
        type: String,
        sparse: true
    },
    academicYear: {
        type: String
    },
    tokens: [{
        token: {
            type: String,
            required: true
        },
        userAgent: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

// Find user by email and password
userSchema.statics.findByCredentials = async function(email, password, userType) {
    const User = this;
    const user = await User.findOne({ email, userType });
    
    if (!user) {
        throw new Error('Invalid login credentials');
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid login credentials');
    }
    
    return user;
};

// Generate auth token
userSchema.methods.generateAuthToken = async function(userAgent) {
    const user = this;
    const token = jwt.sign(
        { _id: user._id.toString() }, 
        JWT_SECRET,
        { expiresIn: '24h' }
    );
    
    user.tokens = user.tokens.concat({ token, userAgent });
    await user.save();
    
    return token;
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();
    
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;
    
    return userObject;
};

// Check if password has expired
userSchema.methods.isPasswordExpired = function() {
    // By default, no password expiration
    return false;
};

module.exports = mongoose.model('User', userSchema);
