const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const student = await Student.findOne();
    console.log(`Roll: ${student.roll}`);
    console.log(`Phone: ${student.phone}`);
    console.log(`Class: ${student.class}`);
    process.exit(0);
}
run();
