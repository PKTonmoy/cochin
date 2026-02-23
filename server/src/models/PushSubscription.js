/**
 * Push Subscription Model
 * Stores Web Push API subscriptions for PWA push notifications
 */

const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    endpoint: {
        type: String,
        required: true,
        unique: true
    },
    keys: {
        p256dh: {
            type: String,
            required: true
        },
        auth: {
            type: String,
            required: true
        }
    },
    userAgent: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
pushSubscriptionSchema.index({ studentId: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
pushSubscriptionSchema.index({ studentId: 1, isActive: 1 });

/**
 * Get all active subscriptions for a student
 */
pushSubscriptionSchema.statics.getForStudent = async function (studentId) {
    return this.find({ studentId, isActive: true });
};

/**
 * Get subscriptions for multiple students
 */
pushSubscriptionSchema.statics.getForStudents = async function (studentIds) {
    return this.find({ studentId: { $in: studentIds }, isActive: true });
};

/**
 * Remove expired/invalid subscription by endpoint
 */
pushSubscriptionSchema.statics.removeByEndpoint = async function (endpoint) {
    return this.deleteOne({ endpoint });
};

/**
 * Upsert subscription — create or update if endpoint already exists
 */
pushSubscriptionSchema.statics.upsertSubscription = async function (studentId, subscription, userAgent) {
    return this.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        {
            studentId,
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            },
            userAgent: userAgent || '',
            isActive: true
        },
        { upsert: true, new: true }
    );
};

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

module.exports = PushSubscription;
