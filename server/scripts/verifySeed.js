const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Faculty = require('../src/models/Faculty');
const Course = require('../src/models/Course');
const Topper = require('../src/models/Topper');
const Testimonial = require('../src/models/Testimonial');
const Media = require('../src/models/Media');

const verify = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/paragon';
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        const fCount = await Faculty.countDocuments();
        const cCount = await Course.countDocuments();
        const tCount = await Topper.countDocuments();
        const tmCount = await Testimonial.countDocuments();
        const mCount = await Media.countDocuments();

        console.log('--- Verification Results ---');
        console.log(`Faculty: ${fCount}`);
        console.log(`Courses: ${cCount}`);
        console.log(`Toppers: ${tCount}`);
        console.log(`Testimonials: ${tmCount}`);
        console.log(`Media: ${mCount}`);

        if (fCount > 0 && cCount > 0) {
            console.log('SUCCESS: Data found in database.');
        } else {
            console.log('FAILURE: Database appears empty or incomplete.');
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verify();
