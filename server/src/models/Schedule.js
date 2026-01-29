/**
 * Schedule Model
 * Class schedules for students
 */

const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    class: {
        type: String,
        required: [true, 'Class is required'],
        trim: true
    },
    section: {
        type: String,
        trim: true
    },
    dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6 // 0 = Sunday, 6 = Saturday
    },
    startTime: {
        type: String,
        required: true // Format: "HH:MM"
    },
    endTime: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    teacher: {
        type: String,
        trim: true
    },
    room: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
scheduleSchema.index({ class: 1, dayOfWeek: 1 });
scheduleSchema.index({ isActive: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
