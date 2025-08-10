const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const ProjectTitle = require('./models/ProjectTitle');

// Sample users with complete information
const sampleUsers = [
    {
        name: 'Admin User',
        email: 'admin@college.edu',
        password: 'admin123',
        userType: 'Admin',
        department: 'Administration'
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
        name: 'Dr. Michael Chen',
        email: 'chen@college.edu',
        password: 'staff123',
        userType: 'Staff',
        department: 'Computer Science',
        staffId: 'CSE002'
    },
    {
        name: 'Student One',
        email: 'student@college.edu',
        password: 'student123',
        userType: 'Student',
        department: 'Computer Science',
        studentId: 'CS2024001',
        academicYear: '2024-2025'
    },
    {
        name: 'John Doe',
        email: 'john.doe@college.edu',
        password: 'password123',
        userType: 'Student',
        department: 'Computer Science',
        studentId: 'CS2024002',
        academicYear: '2024-2025'
    },
    {
        name: 'Jane Smith',
        email: 'jane.smith@college.edu',
        password: 'password123',
        userType: 'Student',
        department: 'Computer Science',
        studentId: 'CS2024003',
        academicYear: '2024-2025'
    }
];

// Sample legacy project titles for backward compatibility
const sampleTitles = [
    {
        title: "Machine Learning for Text Classification in Social Media Posts",
        submittedBy: "student@college.edu",
        department: "Computer Science"
    },
    {
        title: "Smart Home Automation System using IoT and Machine Learning",
        submittedBy: "john.doe@college.edu",
        department: "Computer Science"
    },
    {
        title: "Blockchain-based Supply Chain Management for Agricultural Products",
        submittedBy: "jane.smith@college.edu",
        department: "Computer Science"
    },
    {
        title: "Real-time Web Application for Student Project Management",
        submittedBy: "student@college.edu",
        department: "Computer Science"
    },
    {
        title: "Computer Vision System for Automated Quality Control in Manufacturing",
        submittedBy: "john.doe@college.edu",
        department: "Computer Science"
    }
];

// Seed the database
async function seedDatabase() {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Project.deleteMany({});
        await ProjectTitle.deleteMany({});
        console.log('✅ Cleared existing data');

        // Create users
        console.log('\n📝 Creating users...');
        const createdUsers = {};
        for (const userData of sampleUsers) {
            try {
                const user = new User(userData);
                await user.save();
                createdUsers[userData.email] = user;
                console.log(`✅ Created user: ${userData.email} (${userData.userType})`);
            } catch (error) {
                console.error(`❌ Error creating user ${userData.email}:`, error.message);
            }
        }

        // Create legacy project titles
        console.log('\n📚 Creating legacy project titles...');
        for (const titleData of sampleTitles) {
            try {
                await ProjectTitle.create(titleData);
                console.log(`✅ Created project title: ${titleData.title.substring(0, 50)}...`);
            } catch (error) {
                console.error(`❌ Error creating title:`, error.message);
            }
        }

        // Create sample projects with sequential review system
        console.log('\n🚀 Creating sample projects...');
        const studentUser = createdUsers['student@college.edu'];
        const johnUser = createdUsers['john.doe@college.edu'];
        const staffUser = createdUsers['staff@college.edu'];

        if (studentUser && staffUser) {
            // Create a project for the main student with title already submitted
            const project1 = await Project.createForStudent(
                studentUser._id, 
                'Computer Science', 
                '2024-2025'
            );
            
            // Submit title for this project
            await project1.submitReviewStage(0, {
                title: "AI-Powered Student Performance Analytics Dashboard",
                description: "A comprehensive web application that uses machine learning algorithms to analyze student performance patterns and provide predictive insights for academic success."
            });
            
            console.log(`✅ Created project with submitted title for: ${studentUser.email}`);
            
            // Create another project for John that's further along
            if (johnUser) {
                const project2 = await Project.createForStudent(
                    johnUser._id,
                    'Computer Science',
                    '2024-2025'
                );
                
                // Submit title
                await project2.submitReviewStage(0, {
                    title: "Distributed Cloud Storage System with End-to-End Encryption",
                    description: "A secure, scalable cloud storage solution with advanced encryption, file versioning, and real-time synchronization capabilities."
                });
                
                // Approve title to unlock Review 1
                await project2.approveReviewStage(0, {
                    comment: "Excellent project proposal. Title is unique and technically sound.",
                    grade: 85,
                    reviewerId: staffUser._id
                });
                
                console.log(`✅ Created advanced project for: ${johnUser.email}`);
            }
        }

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n🔐 Test Login Credentials:');
        console.log('┌─────────────────────────────────────────┐');
        console.log('│ Admin:   admin@college.edu / admin123   │');
        console.log('│ Staff:   staff@college.edu / staff123   │');
        console.log('│ Student: student@college.edu / student123│');
        console.log('└─────────────────────────────────────────┘');
        
        console.log('\n📊 Created Data Summary:');
        console.log(`👥 Users: ${sampleUsers.length}`);
        console.log(`📚 Legacy Titles: ${sampleTitles.length}`);
        console.log(`🚀 Projects: 2 (with different review stages)`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        console.error('Full error:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the seeding process
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
