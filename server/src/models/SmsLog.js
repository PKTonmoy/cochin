/**
 * SmsLog Model
 * Tracks all SMS sent through the system
 */

const mongoose = require('mongoose');

const smsLogSchema = new mongoose.Schema({
    recipientName: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['result_sms', 'custom_sms'],
        required: true
    },
    status: {
        type: String,
        enum: ['queued', 'sent', 'failed'],
        default: 'queued'
    },
    apiResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    errorMessage: {
        type: String
    },
    retryCount: {
        type: Number,
        default: 0
    },
    // Related entities
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sentAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes
smsLogSchema.index({ status: 1, createdAt: -1 });
smsLogSchema.index({ type: 1, createdAt: -1 });
smsLogSchema.index({ testId: 1, createdAt: -1 });
smsLogSchema.index({ studentId: 1, createdAt: -1 });
smsLogSchema.index({ phone: 1, createdAt: -1 });
smsLogSchema.index({ createdAt: -1 });

const SmsLog = mongoose.model('SmsLog', smsLogSchema);

module.exports = SmsLog;
