require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Test = require('../models/Test');

async function debugStudent() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const rollToCheck = '10002';
        console.log(`Searching for student with roll: "${rollToCheck}"`);

        const student = await Student.findOne({ roll: rollToCheck });
        if (student) {
            console.log('Found student:', {
                name: student.name,
                class: student.class
            });

            // Check for future classes
            const futureDate = new Date('2026-02-14');
            console.log(`\nSearching for classes after ${futureDate.toISOString().split('T')[0]}...`);

            const classes = await Class.find({
                class: student.class,
                date: { $gte: futureDate }
            }).sort({ date: 1 }).limit(5);

            console.log(`Found ${classes.length} future classes.`);
            classes.forEach(c => {
                console.log(`- [Class] [${c.date.toISOString().split('T')[0]}] ${c.title}`);
            });

            // Check for future tests
            console.log(`\nSearching for tests after ${futureDate.toISOString().split('T')[0]}...`);
            const tests = await Test.find({
                class: student.class,
                date: { $gte: futureDate }
            }).sort({ date: 1 }).limit(5);

            console.log(`Found ${tests.length} future tests.`);
            tests.forEach(t => {
                console.log(`- [Test] [${t.date.toISOString().split('T')[0]}] ${t.testName}`);
            });

        } else {
            console.log('Student not found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugStudent();
