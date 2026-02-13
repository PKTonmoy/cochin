const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Attendance = require('../src/models/Attendance');

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
    .then(() => testAttendance())
    .catch(err => console.error('DB Connection Error:', err));

async function testAttendance() {
    try {
        console.log('--- Testing Attendance Uniqueness (New Schema) ---');

        // List current indexes
        const indexes = await Attendance.collection.indexes();
        console.log('Current Indexes on Attendance:', indexes);

        // Clean up previous test
        const testStudentId = new mongoose.Types.ObjectId();
        const testUserId = new mongoose.Types.ObjectId();

        await Attendance.deleteMany({ studentId: testStudentId });

        // Insert first record (Session 1)
        console.log('Inserting Session 1...');
        await Attendance.create({
            studentId: testStudentId,
            type: 'class',
            classId: new mongoose.Types.ObjectId(), // Fake Class ID 1
            date: new Date('2026-02-13'),
            class: 'Test Class',
            status: 'present',
            markedBy: testUserId
        });
        console.log('Session 1 inserted successfully.');

        // Insert second record (Session 2 - Different Class ID, Same Day)
        console.log('Inserting Session 2 (Same Student, Same Date, Diff ClassId)...');
        await Attendance.create({
            studentId: testStudentId,
            type: 'class',
            classId: new mongoose.Types.ObjectId(), // Fake Class ID 2
            date: new Date('2026-02-13'),
            class: 'Test Class',
            status: 'present',
            markedBy: testUserId
        });
        console.log('Session 2 inserted successfully! SUCCESS: Multiple sessions are allowed.');

    } catch (error) {
        if (error.code === 11000) {
            console.error('FAILED: Duplicate Key Error.', error.message);
        } else {
            console.error('Error:', error);
        }
    } finally {
        await mongoose.connection.close();
    }
}
