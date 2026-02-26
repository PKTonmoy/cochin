/**
 * Notification Controller
 * Handles notification retrieval and management
 * Includes multi-channel delivery: push, SMS, and in-portal
 */

const Notification = require('../models/Notification');
const Student = require('../models/Student');
const GlobalSettings = require('../models/GlobalSettings');
const { ApiError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');
const pushService = require('../services/pushService');
const smsService = require('../services/smsService');

/**
 * Build the notice SMS text from the saved template.
 * Supports placeholders: {title}, {message}
 */
function buildNoticeSmsText(template, title, message) {
    const truncatedMsg = message.length > 100 ? message.substring(0, 100) : message;
    return template
        .replace(/\{title\}/g, title)
        .replace(/\{message\}/g, truncatedMsg);
}

/**
 * Get notifications for the current user
 */
exports.getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false, types } = req.query;

        const recipientType = req.user.role === 'student' ? 'student' : 'user';
        const recipientId = req.user.role === 'student' ? req.user.studentId : req.user.id;

        // Parse types if provided
        const typeArray = types ? types.split(',') : null;

        const result = await Notification.getForRecipient(recipientId, recipientType, {
            page: parseInt(page),
            limit: parseInt(limit),
            unreadOnly: unreadOnly === 'true',
            types: typeArray
        });

        // Also get unread count
        const unreadCount = await Notification.getUnreadCount(recipientId, recipientType);

        res.json({
            success: true,
            data: {
                notifications: result.notifications,
                pagination: result.pagination,
                unreadCount
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get class-wide notifications for a student
 */
exports.getClassNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const { class: studentClass, section } = req.user;

        if (!studentClass) {
            return res.json({
                success: true,
                data: {
                    notifications: [],
                    pagination: { page: 1, limit: 20, total: 0, pages: 0 }
                }
            });
        }

        const query = {
            recipientType: 'class',
            recipientClass: studentClass,
            $or: [
                { recipientSection: section },
                { recipientSection: { $exists: false } },
                { recipientSection: null }
            ]
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Notification.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get unread notification count
 * For students: counts personal unread + all broadcast/class notifications
 * (broadcast/class are always "unread" per-student since they're shared docs)
 */
exports.getUnreadCount = async (req, res, next) => {
    try {
        if (req.user.role === 'student') {
            const studentId = req.user.studentId;
            const studentClass = req.user.class;
            const studentSection = req.user.section;

            const orConditions = [
                { recipientType: 'student', recipientId: studentId, isRead: false },
                { recipientType: 'all' }
            ];

            if (studentClass) {
                orConditions.push({
                    recipientType: 'class',
                    recipientClass: studentClass,
                    $or: [
                        { recipientSection: studentSection },
                        { recipientSection: { $exists: false } },
                        { recipientSection: null },
                        { recipientSection: '' }
                    ]
                });
            }

            const count = await Notification.countDocuments({ $or: orConditions });

            return res.json({
                success: true,
                data: { unreadCount: count }
            });
        }

        // Admin/staff — only personal notifications
        const count = await Notification.getUnreadCount(req.user.id, 'user');

        res.json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            throw new ApiError('Notification not found', 404);
        }

        // Broadcast/class notifications are shared documents — don't modify
        // their isRead flag since it would affect all students.
        // The frontend tracks read state locally for these types.
        if (['all', 'class'].includes(notification.recipientType)) {
            return res.json({
                success: true,
                message: 'Notification marked as read'
            });
        }

        // Verify ownership for personal notifications
        const recipientType = req.user.role === 'student' ? 'student' : 'user';
        const recipientId = req.user.role === 'student' ? req.user.studentId : req.user.id;

        if (notification.recipientId && notification.recipientId.toString() !== recipientId.toString()) {
            throw new ApiError('Unauthorized', 403);
        }

        await notification.markAsRead();

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark multiple notifications as read
 */
exports.markMultipleAsRead = async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new ApiError('Notification IDs are required', 400);
        }

        const recipientId = req.user.role === 'student' ? req.user.studentId : req.user.id;

        const result = await Notification.markMultipleAsRead(ids, recipientId);

        res.json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res, next) => {
    try {
        let query;

        if (req.user.role === 'student') {
            // Only mark PERSONAL notifications as read.
            // Broadcast ('all') and class notifications are shared documents —
            // modifying their isRead flag would affect ALL students.
            // The frontend tracks read state locally for shared notices.
            query = {
                recipientType: 'student',
                recipientId: req.user.studentId || req.user.id,
                isRead: false
            };
        } else {
            // Admin/staff — mark their own notifications
            query = {
                recipientId: req.user.id,
                isRead: false
            };
        }

        const result = await Notification.updateMany(
            query,
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            throw new ApiError('Notification not found', 404);
        }

        // Verify ownership
        const recipientId = req.user.role === 'student' ? req.user.studentId : req.user.id;

        if (notification.recipientId && notification.recipientId.toString() !== recipientId.toString()) {
            throw new ApiError('Unauthorized', 403);
        }

        await notification.deleteOne();

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Send a notice with multi-channel delivery (admin only)
 * Channels: In-Portal (DB + Socket), PWA Push, SMS
 */
exports.sendNotice = async (req, res, next) => {
    try {
        const {
            title,
            message,
            priority = 'normal',
            targetType = 'all',       // 'all', 'class', 'students'
            targetClass,
            targetSection,
            studentIds = [],          // for targetType = 'students'
            channels = { portal: true, push: false, sms: false },
            scheduledAt,              // ISO date string for scheduling
            smsTemplate: customSmsTemplate, // optional per-notice SMS template override
            type = 'general'
        } = req.body;

        if (!title || !message) {
            throw new ApiError('Title and message are required', 400);
        }

        const deliveryStatus = { portal: false, push: { sent: 0, failed: 0 }, sms: { sent: 0, failed: 0 } };

        // ── Handle scheduling ──
        if (scheduledAt && new Date(scheduledAt) > new Date()) {
            // Create a scheduled notification
            const notification = await Notification.create({
                recipientType: targetType === 'students' ? 'student' : (targetType === 'class' ? 'class' : 'all'),
                recipientClass: targetClass,
                recipientSection: targetSection,
                type,
                priority,
                title,
                message,
                actionUrl: '/student/notices',
                createdBy: req.user.id,
                isScheduled: true,
                scheduledFor: new Date(scheduledAt),
                metadata: { channels, targetType, studentIds }
            });

            return res.status(201).json({
                success: true,
                message: `Notice scheduled for ${new Date(scheduledAt).toLocaleString()}`,
                data: { notification, deliveryStatus, scheduled: true }
            });
        }

        // ── Send to specific students ──
        if (targetType === 'students' && studentIds.length > 0) {
            const notifications = [];
            for (const studentId of studentIds) {
                const notification = await notificationService.createNotification({
                    recipientType: 'student',
                    recipientId: studentId,
                    recipientModel: 'Student',
                    type,
                    priority,
                    title,
                    message,
                    actionUrl: '/student/notices',
                    createdBy: req.user.id
                }, {
                    sendSocket: channels.portal !== false,
                    sendPush: channels.push === true,
                    sendEmail: false
                });
                notifications.push(notification);
            }
            deliveryStatus.portal = true;

            // Send SMS if enabled
            if (channels.sms) {
                const settings = await GlobalSettings.getSettings();
                const smsTemplate = customSmsTemplate || settings?.smsSettings?.noticeSmsTemplate || 'Notice: {title} - {message}. Login to portal for details.';
                const smsText = buildNoticeSmsText(smsTemplate, title, message);
                const smsResult = await smsService.sendCustomSms(
                    { studentIds },
                    smsText,
                    'guardianPhone',
                    req.user.id
                );
                deliveryStatus.sms = smsResult.results || { sent: 0, failed: 0 };
            }

            return res.status(201).json({
                success: true,
                message: `Notice sent to ${studentIds.length} student(s)`,
                data: { notifications, deliveryStatus }
            });
        }

        // ── Send to class or all ──
        const recipientType = targetType === 'class' ? 'class' : 'all';
        const notification = await notificationService.createNotification({
            recipientType,
            recipientClass: targetClass,
            recipientSection: targetSection,
            type,
            priority,
            title,
            message,
            actionUrl: '/student/notices',
            createdBy: req.user.id
        }, {
            sendSocket: channels.portal !== false,
            sendPush: channels.push === true,
            sendEmail: false
        });
        deliveryStatus.portal = true;

        // Send SMS if enabled
        if (channels.sms) {
            const filters = {};
            if (targetType === 'class' && targetClass) {
                filters.class = targetClass;
                if (targetSection) filters.section = targetSection;
            }
            const settings = await GlobalSettings.getSettings();
            const smsTemplate = customSmsTemplate || settings?.smsSettings?.noticeSmsTemplate || 'Notice: {title} - {message}. Login to portal for details.';
            const smsText = buildNoticeSmsText(smsTemplate, title, message);
            const smsResult = await smsService.sendCustomSms(
                filters,
                smsText,
                'guardianPhone',
                req.user.id
            );
            deliveryStatus.sms = smsResult.results || { sent: 0, failed: 0 };
        }

        res.status(201).json({
            success: true,
            message: 'Notice sent successfully',
            data: { notification, deliveryStatus }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a broadcast notification (admin only) — legacy endpoint
 */
exports.createBroadcast = async (req, res, next) => {
    try {
        const {
            recipientType,
            recipientClass,
            recipientSection,
            type = 'general',
            priority = 'normal',
            title,
            message,
            actionUrl
        } = req.body;

        if (!title || !message) {
            throw new ApiError('Title and message are required', 400);
        }

        const notification = await notificationService.createNotification({
            recipientType: recipientType || 'all',
            recipientClass,
            recipientSection,
            type,
            priority,
            title,
            message,
            actionUrl,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Broadcast notification created',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all notifications (admin view)
 */
exports.getAllNotifications = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 50,
            type,
            recipientType,
            priority,
            fromDate,
            toDate
        } = req.query;

        const query = {};

        if (type) query.type = type;
        if (recipientType) query.recipientType = recipientType;
        if (priority) query.priority = priority;
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', 'name')
                .lean(),
            Notification.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// ─── Push Subscription Endpoints ─────────────────────────────────

/**
 * Save a push subscription for the authenticated student
 */
exports.savePushSubscription = async (req, res, next) => {
    try {
        const { subscription } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            throw new ApiError('Valid push subscription is required', 400);
        }

        const studentId = req.user.studentId || req.user.id;
        const userAgent = req.headers['user-agent'] || '';

        await pushService.saveSubscription(studentId, subscription, userAgent);

        res.json({
            success: true,
            message: 'Push subscription saved'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove a push subscription
 */
exports.removePushSubscription = async (req, res, next) => {
    try {
        const { endpoint } = req.body;

        if (!endpoint) {
            throw new ApiError('Endpoint is required', 400);
        }

        await pushService.removeSubscription(endpoint);

        res.json({
            success: true,
            message: 'Push subscription removed'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get VAPID public key (no auth required for subscribing)
 */
exports.getVapidPublicKey = async (req, res) => {
    const key = pushService.getVapidPublicKey();
    res.json({
        success: true,
        data: { vapidPublicKey: key }
    });
};

// ─── Student Combined Notice Feed ────────────────────────────────

/**
 * Get all notices for a student (personal + class + broadcast)
 * This combines personal and class-wide notifications into one feed.
 * NOTE: Broadcast ('all') and class notifications are shared documents
 * with a single isRead flag. We never filter shared notices by isRead
 * since the flag doesn't represent per-student read state.
 * The frontend tracks read state locally for shared notices.
 */
exports.getStudentNotices = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, priority, fromDate, toDate, unreadOnly } = req.query;
        const studentId = req.user.studentId;
        const studentClass = req.user.class;
        const studentSection = req.user.section;

        // Build date filter if provided
        let dateFilter = {};
        if (fromDate || toDate) {
            dateFilter.createdAt = {};
            if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
            if (toDate) dateFilter.createdAt.$lte = new Date(toDate);
        }

        // Personal notifications (isRead is meaningful here)
        const personalCondition = {
            recipientType: 'student',
            recipientId: studentId,
            ...(priority ? { priority } : {}),
            ...dateFilter
        };

        // Shared notifications — never filter by isRead
        const broadcastCondition = {
            recipientType: 'all',
            ...(priority ? { priority } : {}),
            ...dateFilter
        };

        const orConditions = [personalCondition, broadcastCondition];

        // Class notifications (shared — never filter by isRead)
        if (studentClass) {
            orConditions.push({
                recipientType: 'class',
                recipientClass: studentClass,
                $or: [
                    { recipientSection: studentSection },
                    { recipientSection: { $exists: false } },
                    { recipientSection: null },
                    { recipientSection: '' }
                ],
                ...(priority ? { priority } : {}),
                ...dateFilter
            });
        }

        // For "unread only" filter, only apply to personal notifications
        let query;
        if (unreadOnly === 'true') {
            const personalUnread = { ...personalCondition, isRead: false };
            query = { $or: [personalUnread, broadcastCondition, ...(studentClass ? [orConditions[2]] : [])] };
        } else {
            query = { $or: orConditions };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // For unread count, count personal unread + all broadcast/class notices
        // (broadcast/class are always "unread" from a per-student perspective)
        const unreadOrConditions = [
            { recipientType: 'student', recipientId: studentId, isRead: false },
            { recipientType: 'all' }
        ];
        if (studentClass) {
            unreadOrConditions.push({
                recipientType: 'class',
                recipientClass: studentClass,
                $or: [
                    { recipientSection: studentSection },
                    { recipientSection: { $exists: false } },
                    { recipientSection: null },
                    { recipientSection: '' }
                ]
            });
        }

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({ $or: unreadOrConditions })
        ]);

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                },
                unreadCount
            }
        });
    } catch (error) {
        next(error);
    }
};
