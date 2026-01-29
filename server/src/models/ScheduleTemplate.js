/**
 * Schedule Template Model
 * Recurring schedule templates for bulk class creation
 */

const mongoose = require('mongoose');

const scheduleTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Template name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true
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
        default: 0
    },
    recurrencePattern: {
        type: String,
        enum: ['daily', 'weekly', 'custom'],
        required: true
    },
    // For weekly pattern - array of day numbers (0 = Sunday, 6 = Saturday)
    recurrenceDays: [{
        type: Number,
        min: 0,
        max: 6
    }],
    startTime: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    },
    endTime: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    },
    duration: {
        type: Number,
        min: 1
    },
    // Template application period
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    numberOfWeeks: {
        type: Number,
        min: 1,
        max: 52
    },
    // Track which classes were created from this template
    generatedClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    lastApplied: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes
scheduleTemplateSchema.index({ class: 1, isActive: 1 });
scheduleTemplateSchema.index({ subject: 1 });
scheduleTemplateSchema.index({ createdBy: 1 });
scheduleTemplateSchema.index({ createdAt: -1 });

/**
 * Calculate duration before saving
 */
scheduleTemplateSchema.pre('save', function (next) {
    if (this.startTime && this.endTime) {
        const [startH, startM] = this.startTime.split(':').map(Number);
        const [endH, endM] = this.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        this.duration = endMinutes - startMinutes;
    }
    next();
});

/**
 * Generate dates for the template within a date range
 */
scheduleTemplateSchema.methods.generateDates = function (startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        const dayOfWeek = current.getDay();

        if (this.recurrencePattern === 'daily') {
            dates.push(new Date(current));
        } else if (this.recurrencePattern === 'weekly' || this.recurrencePattern === 'custom') {
            if (this.recurrenceDays.includes(dayOfWeek)) {
                dates.push(new Date(current));
            }
        }

        current.setDate(current.getDate() + 1);
    }

    return dates;
};

/**
 * Generate class objects from template
 */
scheduleTemplateSchema.methods.generateClasses = function (userId, startDate = null, endDate = null) {
    // Use template dates or provided dates
    const start = startDate || this.startDate || new Date();
    let end = endDate || this.endDate;

    // If no end date, calculate from numberOfWeeks
    if (!end && this.numberOfWeeks) {
        end = new Date(start);
        end.setDate(end.getDate() + (this.numberOfWeeks * 7));
    }

    if (!end) {
        throw new Error('End date or number of weeks must be specified');
    }

    const dates = this.generateDates(start, end);

    return dates.map(date => ({
        title: `${this.subject} - ${this.class}`,
        subject: this.subject,
        class: this.class,
        section: this.section,
        instructorId: this.instructorId,
        instructorName: this.instructorName,
        date: date,
        startTime: this.startTime,
        endTime: this.endTime,
        duration: this.duration,
        room: this.room,
        meetingLink: this.meetingLink,
        isOnline: this.isOnline,
        capacity: this.capacity,
        recurrenceId: this._id,
        status: 'scheduled',
        createdBy: userId
    }));
};

const ScheduleTemplate = mongoose.model('ScheduleTemplate', scheduleTemplateSchema);

module.exports = ScheduleTemplate;
