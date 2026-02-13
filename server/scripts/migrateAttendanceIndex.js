const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB using the application URI from .env
const MONGO_URI = process.env.MONGODB_URI;

console.log('Using URI:', MONGO_URI.replace(/:([^:@]+)@/, ':****@')); // Log masked URI for verification

async function migrateIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const collection = mongoose.connection.collection('attendances');

        console.log('Fetching existing indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        // 1. Handle Class Attendance Uniqueness Index
        // Check if new index already exists by likely name or key
        const newClassIndex = indexes.find(i => i.name === 'student_class_session_unique' || (i.key.studentId === 1 && i.key.classId === 1));

        if (!newClassIndex) {
            // Find old unique index: studentId_1_type_1_date_1 (without classId)
            const oldClassIndex = indexes.find(index =>
                index.key.studentId === 1 &&
                index.key.type === 1 &&
                index.key.date === 1 &&
                !index.key.classId
            );

            if (oldClassIndex) {
                console.log(`Found old class attendance index: ${oldClassIndex.name}. Dropping it...`);
                await collection.dropIndex(oldClassIndex.name);
                console.log('Old class index dropped.');
            } else {
                console.log('Old class attendance index not found.');
            }

            console.log('Creating new unique index for class sessions...');
            // We use the specific name 'student_class_session_unique' to avoid "Index already exists with different name" error if it somehow exists partially
            await collection.createIndex(
                { studentId: 1, type: 1, date: 1, classId: 1 },
                { name: 'student_class_session_unique', unique: true, partialFilterExpression: { type: 'class' } }
            );
            console.log('New class attendance index created successfully.');
        } else {
            console.log('New class attendance index (student_class_session_unique) already exists. Skipping creation.');
        }


        // 2. Handle Test Attendance Uniqueness Index
        // Find old sparse index: studentId_1_testId_1
        // We look for it by name 'studentId_1_testId_1' or by key
        const oldTestIndex = indexes.find(index =>
            index.name === 'studentId_1_testId_1' ||
            (index.key.studentId === 1 && index.key.testId === 1)
        );

        if (oldTestIndex) {
            // Check if it already has the partialFilterExpression we want
            if (oldTestIndex.partialFilterExpression && oldTestIndex.partialFilterExpression.type === 'test') {
                console.log('Test index already has correct partial filter. Skipping.');
            } else {
                console.log(`Found old test attendance index: ${oldTestIndex.name}. Dropping it to apply/update partial filter...`);
                await collection.dropIndex(oldTestIndex.name);
                console.log('Old test index dropped.');

                console.log('Creating updated test index on { studentId: 1, testId: 1 } with partial filter...');
                await collection.createIndex(
                    { studentId: 1, testId: 1 },
                    { unique: true, partialFilterExpression: { type: 'test' } }
                );
                console.log('New test attendance index created successfully.');
            }
        } else {
            // If completely missing, create it
            console.log('Test attendance index not found. Creating it...');
            await collection.createIndex(
                { studentId: 1, testId: 1 },
                { unique: true, partialFilterExpression: { type: 'test' } }
            );
            console.log('New test attendance index created successfully.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        console.log('Connection closed.');
        await mongoose.disconnect();
    }
}

migrateIndexes();
