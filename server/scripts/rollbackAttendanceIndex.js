const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB using the application URI from .env
const MONGO_URI = process.env.MONGODB_URI;

console.log('Using URI:', MONGO_URI.replace(/:([^:@]+)@/, ':****@'));

async function rollbackIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const collection = mongoose.connection.collection('attendances');

        console.log('Fetching existing indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        // 1. Revert Class Attendance Index
        // Find new index: student_class_session_unique OR by key { studentId: 1, type: 1, date: 1, classId: 1 }
        const newClassIndex = indexes.find(i =>
            i.name === 'student_class_session_unique' ||
            (i.key.studentId === 1 && i.key.type === 1 && i.key.date === 1 && i.key.classId === 1)
        );

        if (newClassIndex) {
            console.log(`Found new class attendance index: ${newClassIndex.name}. Dropping it...`);
            await collection.dropIndex(newClassIndex.name);
            console.log('New class index dropped.');
        } else {
            console.log('New class attendance index not found.');
        }

        // Re-create OLD unique index: studentId_1_type_1_date_1 (without classId)
        // Check if it already exists (it shouldn't if we dropped it, but check anyway)
        const oldClassIndex = indexes.find(i =>
            i.key.studentId === 1 && i.key.type === 1 && i.key.date === 1 && !i.key.classId
        );

        if (!oldClassIndex) {
            console.log('Restoring OLD unique index on { studentId: 1, type: 1, date: 1 }...');
            await collection.createIndex(
                { studentId: 1, type: 1, date: 1 },
                { unique: true, partialFilterExpression: { type: 'class' } }
            );
            console.log('Old class attendance index restored.');
        } else {
            console.log('Old class attendance index already exists.');
        }

        // 2. Revert Test Attendance Index (from partialFilter to sparse)
        // Find existing test index
        const testIndex = indexes.find(i =>
            i.key.studentId === 1 && i.key.testId === 1
        );

        if (testIndex) {
            console.log(`Found test attendance index: ${testIndex.name}. Dropping it to revert to sparse...`);
            await collection.dropIndex(testIndex.name);
            console.log('Test index dropped.');
        }

        console.log('Restoring OLD test index on { studentId: 1, testId: 1 } with sparse: true...');
        await collection.createIndex(
            { studentId: 1, testId: 1 },
            { unique: true, sparse: true }
        );
        console.log('Old test attendance index restored.');

    } catch (error) {
        console.error('Rollback failed:', error);
    } finally {
        console.log('Connection closed.');
        await mongoose.disconnect();
    }
}

rollbackIndexes();
