const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Course = require('../models/Course');

const checkCourse = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        const course = await Course.findOne().sort({ createdAt: -1 });

        if (!course) {
            console.log('❌ No courses found.');
        } else {
            console.log('✅ Latest Course Found:');
            console.log(`Name: ${course.name}`);
            console.log(`Slug: ${course.slug}`);
            console.log(`Image URL: ${course.image?.url}`);
            console.log(`Image Public ID: ${course.image?.publicId}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

checkCourse();
