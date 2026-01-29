/**
 * Notification Model
 * In-app and email notifications for users and students
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientType: {
        type: String,
        enum: ['student', 'user', 'class', 'all'],
        required: true
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'recipientModel'
    },
    recipientModel: {
        type: String,
        enum: ['Student', 'User']
    },
    recipientClass: {
        type: String,
        trim: true
    },
    recipientSection: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: [
            'class_scheduled',
            'class_cancelled',
            'class_rescheduled',
            'class_reminder',
            'class_materials_added',
            'test_scheduled',
            'test_cancelled',
            'test_rescheduled',
            'test_reminder',
            'result_published',
            'attendance_marked',
            'payment_received',
            'payment_reminder',
            'general',
            'system'
        ],
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true,
        maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    relatedEntityType: {
        type: String,
        enum: ['class', 'test', 'result', 'payment', 'attendance', 'student', null]
    },
    relatedEntityId: {
        type: mongoose.Schema.Types.ObjectId
    },
    actionUrl: {
        type: String,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: {
        type: Date
    },
    emailError: {
        type: String
    },
    scheduledFor: {
        type: Date
    },
    isScheduled: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientType: 1, recipientClass: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ isScheduled: 1, scheduledFor: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Compound index for fetching user notifications
notificationSchema.index({
    recipientId: 1,
    recipientType: 1,
    createdAt: -1
});

/**
 * Mark notification as read
 */
notificationSchema.methods.markAsRead = async function () {
    if (!this.isRead) {
        this.isRead = true;
        this.readAt = new Date();
        await this.save();
    }
    return this;
};

/**
 * Get unread count for a recipient
 */
notificationSchema.statics.getUnreadCount = async function (recipientId, recipientType = 'student') {
    return this.countDocuments({
        recipientId,
        recipientType,
        isRead: false
    });
};

/**
 * Get notifications for a recipient with optional filters
 */
notificationSchema.statics.getForRecipient = async function (recipientId, recipientType = 'student', options = {}) {
    const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        types = null
    } = options;

    const query = {
        recipientId,
        recipientType
    };

    if (unreadOnly) {
        query.isRead = false;
    }

    if (types && types.length > 0) {
        query.type = { $in: types };
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
        this.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);

    return {
        notifications,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Mark multiple notifications as read
 */
notificationSchema.statics.markMultipleAsRead = async function (ids, recipientId) {
    return this.updateMany(
        {
            _id: { $in: ids },
            recipientId,
            isRead: false
        },
        {
            $set: {
                isRead: true,
                readAt: new Date()
            }
        }
    );
};

/**
 * Create broadcast notification for a class
 */
notificationSchema.statics.createClassBroadcast = async function (classValue, section, notificationData) {
    const baseNotification = {
        ...notificationData,
        recipientType: 'class',
        recipientClass: classValue,
        recipientSection: section || undefined
    };

    return this.create(baseNotification);
};

/**
 * Get pending scheduled notifications
 */
notificationSchema.statics.getPendingScheduled = async function () {
    return this.find({
        isScheduled: true,
        scheduledFor: { $lte: new Date() },
        sentAt: { $exists: false }
    });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
