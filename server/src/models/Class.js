/**
 * Class Model
 * Represents individual class sessions at the coaching center
 */

const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
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
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const classSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Class title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    class: {
        type: String,
        required: [true, 'Target class is required'],
        trim: true
    },
    section: {
        type: String,
        trim: true
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    instructorName: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Class date is required']
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    },
    endTime: {
        type: String,
        required: [true, 'End time is required'],
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
    meetingLink: {
        type: String,
        trim: true
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    capacity: {
        type: Number,
        default: 0, // 0 means unlimited
        min: 0
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    enrolledCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
    },
    cancelReason: {
        type: String,
        trim: true
    },
    rescheduledFrom: {
        type: Date
    },
    rescheduledTo: {
        type: Date
    },
    materials: [materialSchema],
    prerequisites: [{
        type: String,
        trim: true
    }],
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    recurrenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScheduleTemplate'
    },
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

// Indexes for efficient queries
classSchema.index({ date: 1, status: 1 });
classSchema.index({ class: 1, date: 1 });
classSchema.index({ class: 1, section: 1, date: 1 });
classSchema.index({ instructorId: 1, date: 1 });
classSchema.index({ status: 1, date: 1 });
classSchema.index({ subject: 1, date: 1 });
classSchema.index({ recurrenceId: 1 });
classSchema.index({ createdAt: -1 });

// Text search
classSchema.index({
    title: 'text',
    subject: 'text',
    description: 'text',
    instructorName: 'text'
}, {
    weights: {
        title: 10,
        subject: 5,
        instructorName: 3,
        description: 1
    },
    name: 'class_text_search'
});

/**
 * Calculate duration before saving
 */
classSchema.pre('save', function (next) {
    if (this.startTime && this.endTime) {
        const [startH, startM] = this.startTime.split(':').map(Number);
        const [endH, endM] = this.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        this.duration = endMinutes - startMinutes;
    }

    // Update enrolled count
    if (this.enrolledStudents) {
        this.enrolledCount = this.enrolledStudents.length;
    }

    next();
});

/**
 * Check if class is full
 */
classSchema.methods.isFull = function () {
    return this.capacity > 0 && this.enrolledCount >= this.capacity;
};

/**
 * Get available spots
 */
classSchema.methods.availableSpots = function () {
    if (this.capacity === 0) return Infinity;
    return Math.max(0, this.capacity - this.enrolledCount);
};

/**
 * Check for time conflict with another class
 */
classSchema.methods.hasConflictWith = function (otherClass) {
    if (this.date.toDateString() !== otherClass.date.toDateString()) {
        return false;
    }

    const [thisStartH, thisStartM] = this.startTime.split(':').map(Number);
    const [thisEndH, thisEndM] = this.endTime.split(':').map(Number);
    const [otherStartH, otherStartM] = otherClass.startTime.split(':').map(Number);
    const [otherEndH, otherEndM] = otherClass.endTime.split(':').map(Number);

    const thisStart = thisStartH * 60 + thisStartM;
    const thisEnd = thisEndH * 60 + thisEndM;
    const otherStart = otherStartH * 60 + otherStartM;
    const otherEnd = otherEndH * 60 + otherEndM;

    // Overlap exists if one starts before the other ends
    return thisStart < otherEnd && otherStart < thisEnd;
};

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
