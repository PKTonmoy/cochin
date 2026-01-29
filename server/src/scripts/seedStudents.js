require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');

const seedStudents = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/paragon';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ email: 'admin@paragon.com' });
        if (!admin) {
            console.error('Admin user not found. Run seed.js first.');
            process.exit(1);
        }

        const classes = ['6', '7', '8', '9', '10', '1st Timer', '2nd Timer'];
        const groups = ['Science', 'Commerce', 'Arts'];
        const studentsPerClass = 50;

        for (const className of classes) {
            console.log(`Seeding class ${className}...`);
            let createdCount = 0;

            for (let i = 0; i < studentsPerClass; i++) {
                let group = undefined;

                // Assign groups for 9, 10, and admission classes
                if (['9', '10', '1st Timer', '2nd Timer'].includes(className)) {
                    group = groups[i % 3]; // Round robin groups
                }

                const name = `Student ${className} ${i + 1}`;
                // Unique phone: 01 + classCode + sequence 
                // e.g. 01 + 10 + 0001 (need to be careful about length/uniqueness)
                // Just use random unique
                const randomPart = Math.floor(10000000 + Math.random() * 90000000);
                const phone = `01${randomPart}`;

                try {
                    // Generate roll number explicitly since it's required and not auto-generated in pre-save
                    const roll = await Student.generateRoll(className, group);

                    await Student.create({
                        roll: roll,
                        name: name,
                        fatherName: `Father ${i + 1}`,
                        motherName: `Mother ${i + 1}`,
                        class: className,
                        group: group,
                        phone: phone,
                        guardianPhone: `01${Math.floor(10000000 + Math.random() * 90000000)}`,
                        email: `student${className.replace(/\s/g, '')}${i}@example.com`,
                        passwordHash: phone, // Will be hashed
                        totalFee: 5000,
                        paidAmount: 0,
                        createdBy: admin._id,
                        status: 'active',
                        address: 'Dhaka, Bangladesh',
                        school: 'Demo School'
                    });
                    createdCount++;
                    // Small delay to ensure sequence order if needed, but await create is sequential enough
                } catch (err) {
                    console.error(`Failed to create student ${i} for class ${className}:`, err.message);
                }
            }
            console.log(`✅ Created ${createdCount} students for ${className}`);
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedStudents();
