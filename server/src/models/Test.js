/**
 * Test Model
 * Represents exams/tests conducted by the coaching center
 */

const mongoose = require('mongoose');

const preparationMaterialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['pdf', 'video', 'link', 'document', 'other'],
        default: 'other'
    }
}, { _id: true });

const testSchema = new mongoose.Schema({
    testName: {
        type: String,
        required: [true, 'Test name is required'],
        trim: true
    },
    testCode: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true
    },
    class: {
        type: String,
        required: [true, 'Class is required'],
        trim: true
    },
    section: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Test date is required']
    },
    startTime: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    },
    endTime: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    },
    duration: {
        type: Number,
        min: [1, 'Duration must be at least 1 minute']
    },
    room: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    cancelReason: {
        type: String,
        trim: true
    },
    subjects: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        maxMarks: {
            type: Number,
            required: true,
            min: 0
        },
        passMarks: {
            type: Number,
            default: 0
        }
    }],
    totalMaxMarks: {
        type: Number,
        default: 0
    },
    // Test parameters
    parameters: {
        openBook: {
            type: Boolean,
            default: false
        },
        calculatorsAllowed: {
            type: Boolean,
            default: false
        },
        onlineSubmission: {
            type: Boolean,
            default: false
        },
        negativeMarking: {
            type: Boolean,
            default: false
        },
        negativeMarkValue: {
            type: Number,
            default: 0
        }
    },
    // Question paper and marking scheme
    questionPaperUrl: {
        type: String,
        trim: true
    },
    markingSchemeUrl: {
        type: String,
        trim: true
    },
    // Syllabus and preparation
    syllabus: [{
        type: String,
        trim: true
    }],
    preparationMaterials: [preparationMaterialSchema],
    description: {
        type: String,
        trim: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    // Notification tracking
    notificationsSent: {
        created: { type: Boolean, default: false },
        reminder24h: { type: Boolean, default: false },
        reminder1h: { type: Boolean, default: false }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for faster queries
// Primary lookup indexes (testCode has unique: true which auto-creates index)
testSchema.index({ status: 1, date: 1 }); // Tests by status and date

// Class and section filtering
testSchema.index({ class: 1, date: -1 }); // Tests for a class by date
testSchema.index({ class: 1, section: 1, date: -1 }); // Tests for class+section
testSchema.index({ class: 1, isPublished: 1, date: -1 }); // Published tests for a class

// Publication status queries
testSchema.index({ isPublished: 1, date: -1 }); // Published tests by date
testSchema.index({ isPublished: 1, class: 1 }); // Published tests by class

// Date-based queries
testSchema.index({ date: -1 }); // Recent tests
testSchema.index({ createdAt: -1 }); // Recently created
testSchema.index({ publishedAt: -1 }, { sparse: true }); // Recently published

// Text search for test name and description
testSchema.index({
    testName: 'text',
    testCode: 'text',
    description: 'text'
}, {
    weights: {
        testCode: 10,
        testName: 5,
        description: 1
    },
    name: 'test_text_search'
});

/**
 * Generate test code and calculate duration before saving
 */
testSchema.pre('save', async function (next) {
    if (!this.testCode) {
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.testCode = `T${year}${month}${random}`;
    }

    // Calculate total max marks
    if (this.subjects && this.subjects.length > 0) {
        this.totalMaxMarks = this.subjects.reduce((sum, subject) => sum + subject.maxMarks, 0);
    }

    // Calculate duration from start and end time
    if (this.startTime && this.endTime && !this.duration) {
        const [startH, startM] = this.startTime.split(':').map(Number);
        const [endH, endM] = this.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        this.duration = endMinutes - startMinutes;
    }

    next();
});

/**
 * Check for time conflict with another test
 */
testSchema.methods.hasConflictWith = function (otherTest) {
    if (!this.startTime || !this.endTime || !otherTest.startTime || !otherTest.endTime) {
        return false;
    }

    if (this.date.toDateString() !== otherTest.date.toDateString()) {
        return false;
    }

    const [thisStartH, thisStartM] = this.startTime.split(':').map(Number);
    const [thisEndH, thisEndM] = this.endTime.split(':').map(Number);
    const [otherStartH, otherStartM] = otherTest.startTime.split(':').map(Number);
    const [otherEndH, otherEndM] = otherTest.endTime.split(':').map(Number);

    const thisStart = thisStartH * 60 + thisStartM;
    const thisEnd = thisEndH * 60 + thisEndM;
    const otherStart = otherStartH * 60 + otherStartM;
    const otherEnd = otherEndH * 60 + otherEndM;

    return thisStart < otherEnd && otherStart < thisEnd;
};

const Test = mongoose.model('Test', testSchema);

module.exports = Test;
