const mongoose = require('mongoose');
const Project = require('./models/ProjectTitle');
const User = require('./models/User');

// Sample users with complete information
const sampleUsers = [
    {
        name: 'Admin User',
        email: 'admin@college.edu',
        password: 'admin123',
        userType: 'Admin',
        department: 'Administration',
        staffId: 'ADM001'
    },
    {
        name: 'Dr. Sarah Johnson',
        email: 'staff@college.edu',
        password: 'staff123',
        userType: 'Staff',
        department: 'Computer Science',
        staffId: 'CSE001'
    },
    {
        name: 'Student One',
        email: 'student@college.edu',
        password: 'student123',
        userType: 'Student',
        department: 'Computer Science',
        studentId: 'CS2023001',
        academicYear: '2023-2024'
    },
    {
        name: 'John Doe',
        email: 'john.doe@college.edu',
        password: 'password123',
        userType: 'Student',
        department: 'Computer Science',
        studentId: 'CS2023002',
        academicYear: '2023-2024'
    }
];

// Sample projects with proper details
const sampleProjects = [
    {
        title: "Machine Learning for Text Classification",
        description: "This project aims to implement and compare various machine learning algorithms for text classification tasks. The study will focus on preprocessing techniques, feature engineering, and model evaluation metrics.",
        tags: ['Machine Learning', 'NLP', 'Classification']
    },
    {
        title: "Smart Home Automation System",
        description: "Development of an IoT-based smart home automation system that allows users to control home appliances remotely. Includes features for energy monitoring and automated scheduling.",
        tags: ['IoT', 'Automation', 'Embedded Systems']
    },
    {
        title: "Blockchain-based Supply Chain Management",
        description: "Implementation of a blockchain solution for supply chain transparency and traceability. Focuses on product authentication and real-time tracking capabilities.",
        tags: ['Blockchain', 'Supply Chain', 'Web3']
    }
];

// Seed the database
async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/ProjectManagement');
        console.log('Connected to MongoDB');

        // Clear existing data
        await Project.deleteMany({});
        await User.deleteMany({});
        console.log('Cleared existing data');

        // Create users and store them by type for reference
        const createdUsers = {};
        for (const userData of sampleUsers) {
            try {
                const user = await User.create(userData);
                // Store user by type for easy reference
                createdUsers[userData.userType.toLowerCase()] = user;
                console.log(`Created user: ${userData.email} (${userData.userType})`);
            } catch (error) {
                console.error(`Error creating user ${userData.email}:`, error.message);
            }
        }

        // Create projects with proper references
        for (const projectData of sampleProjects) {
            try {
                const student = createdUsers.student;
                const staff = createdUsers.staff;

                if (!student || !staff) {
                    throw new Error('Required users not found in database');
                }

                const project = await Project.create({
                    ...projectData,
                    studentId: student._id,
                    guide: staff._id,
                    department: 'Computer Science',
                    academicYear: '2023-2024',
                    visibility: 'department',
                    status: 'pending',
                    reviews: [{
                        reviewType: 'title',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        status: 'pending'
                    }]
                });
                console.log(`Created project: ${project.title}`);
            } catch (error) {
                console.error(`Error creating project ${projectData.title}:`, error.message);
            }
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\n🔐 Login Credentials:');
        console.log('Admin:   admin@college.edu / admin123');
        console.log('Staff:   staff@college.edu / staff123');
        console.log('Student: student@college.edu / student123');

    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

// Run the seeding process
seedDatabase();
