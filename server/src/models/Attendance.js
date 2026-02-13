/**
 * Attendance Model
 * Tracks student attendance for classes and tests
 */

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    type: {
        type: String,
        enum: ['class', 'test'],
        required: true
    },
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
        // Required only when type is 'test'
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
        // Required only when type is 'class' and linked to a session
    },
    date: {
        type: Date,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    section: {
        type: String
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late'],
        default: 'present'
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
attendanceSchema.index({ studentId: 1, type: 1, date: -1 });
// Prevent duplicate attendance for same student on same date for class type
attendanceSchema.index(
    { studentId: 1, type: 1, date: 1 },
    { unique: true, partialFilterExpression: { type: 'class' } }
);

attendanceSchema.index({ studentId: 1, testId: 1 }, { unique: true, sparse: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
