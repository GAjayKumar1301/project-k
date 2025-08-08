const mongoose = require('mongoose');
const ProjectTitle = require('./models/ProjectTitle');
const User = require('./models/User');

// Sample project titles
const sampleTitles = [
    "A Study on Machine Learning Algorithms for Text Classification",
    "Development of a Web-Based Student Information System", 
    "An Analysis of Network Security Protocols in IoT Devices",
    "Design and Implementation of a Real-Time Chat Application",
    "Investigating the Impact of Social Media on Mental Health",
    "Optimizing Data Structures for Large Scale Applications",
    "Blockchain Technology and Its Applications in Supply Chain",
    "Predictive Modeling for Customer Churn in E-commerce",
    "Automated System for Smart Home Management",
    "Deep Learning Approaches for Image Recognition"
];

// Sample users
const sampleUsers = [
    { email: 'admin@college.edu', password: 'admin123', userType: 'Admin' },
    { email: 'staff@college.edu', password: 'staff123', userType: 'Staff' },
    { email: 'student@college.edu', password: 'student123', userType: 'Student' },
    { email: 'john.doe@college.edu', password: 'password123', userType: 'Student' },
];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/ProjectManagement', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Clear existing data
        await ProjectTitle.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data');

        // Insert sample users
        for (const userData of sampleUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                await User.create(userData);
                console.log(`Created user: ${userData.email}`);
            }
        }

        // Insert sample project titles
        for (const title of sampleTitles) {
            const existingTitle = await ProjectTitle.findOne({ title });
            if (!existingTitle) {
                await ProjectTitle.create({
                    title,
                    submittedBy: 'sample@college.edu'
                });
                console.log(`Created project title: ${title}`);
            }
        }

        console.log('✅ Database seeded successfully!');
        console.log('\n🔐 Login Credentials:');
        console.log('Admin: admin@college.edu / admin123');
        console.log('Staff: staff@college.edu / staff123'); 
        console.log('Student: student@college.edu / student123');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the seed function
seedDatabase();
