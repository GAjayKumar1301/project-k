const User = require('../models/User');

const authController = {
    login: async (req, res) => {
        const { userType, email, password } = req.body;

        try {
            const user = await User.findOne({ 
                email: email.toLowerCase(), 
                userType 
            });

            if (!user) {
                return res.status(400).json({ 
                    message: 'User not found' 
                });
            }

            if (user.password !== password) {
                return res.status(400).json({ 
                    message: 'Invalid credentials' 
                });
            }

            res.status(200).json({ 
                message: 'Login successful', 
                userType,
                user: {
                    id: user._id,
                    email: user.email,
                    userType: user.userType
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                message: 'Server error' 
            });
        }
    },

    register: async (req, res) => {
        const { userType, email, password } = req.body;

        try {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            
            if (existingUser) {
                return res.status(400).json({ 
                    message: 'User already exists' 
                });
            }

            const newUser = new User({
                email: email.toLowerCase(),
                password,
                userType
            });

            await newUser.save();

            res.status(201).json({ 
                message: 'User registered successfully',
                user: {
                    id: newUser._id,
                    email: newUser.email,
                    userType: newUser.userType
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                message: 'Server error' 
            });
        }
    }
};

module.exports = authController;
