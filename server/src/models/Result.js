/**
 * Result Model
 * Stores test results for students
 */

const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: [true, 'Test ID is required']
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required']
    },
    roll: {
        type: String,
        required: true,
        trim: true
    },
    subjectMarks: {
        type: Map,
        of: Number,
        default: {}
    },
    totalMarks: {
        type: Number,
        default: 0
    },
    maxMarks: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0
    },
    grade: {
        type: String,
        trim: true
    },
    rank: {
        type: Number
    },
    remarks: {
        type: String,
        trim: true
    },
    isAbsent: {
        type: Boolean,
        default: false
    },
    uploadBatchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UploadBatch'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
// Unique constraint: one result per student per test
resultSchema.index({ testId: 1, studentId: 1 }, { unique: true });

// Primary lookup indexes
resultSchema.index({ studentId: 1 }); // All results for a student
resultSchema.index({ testId: 1 }); // All results for a test
resultSchema.index({ roll: 1 }); // Results by roll number
resultSchema.index({ uploadBatchId: 1 }); // Results by batch (for rollback)

// Ranking and leaderboard indexes
resultSchema.index({ testId: 1, percentage: -1 }); // Top performers in a test
resultSchema.index({ testId: 1, totalMarks: -1 }); // Sort by marks in a test
resultSchema.index({ testId: 1, rank: 1 }); // Results by rank

// Grade and performance filtering
resultSchema.index({ testId: 1, grade: 1 }); // Filter by grade in a test
resultSchema.index({ studentId: 1, percentage: -1 }); // Student's best performances
resultSchema.index({ studentId: 1, createdAt: -1 }); // Student's recent results

// Absent/present tracking
resultSchema.index({ testId: 1, isAbsent: 1 }); // Absent students in a test

// Date-based queries
resultSchema.index({ createdAt: -1 }); // Recently added results

/**
 * Calculate grade based on percentage
 */
resultSchema.methods.calculateGrade = function () {
    const percentage = this.percentage;

    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
};

/**
 * Calculate totals before saving
 */
resultSchema.pre('save', function (next) {
    if (this.subjectMarks && this.subjectMarks.size > 0) {
        let total = 0;
        for (const marks of this.subjectMarks.values()) {
            total += marks || 0;
        }
        this.totalMarks = total;

        if (this.maxMarks > 0) {
            this.percentage = Math.round((this.totalMarks / this.maxMarks) * 100 * 100) / 100;
            this.grade = this.calculateGrade();
        }
    }
    next();
});

/**
 * Populate references on find
 */


const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
