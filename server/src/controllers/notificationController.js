/**
 * Notification Controller
 * Handles notification retrieval and management
 */

const Notification = require('../models/Notification');
const { ApiError } = require('../middleware/errorHandler');

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
 */
exports.getUnreadCount = async (req, res, next) => {
    try {
        const recipientType = req.user.role === 'student' ? 'student' : 'user';
        const recipientId = req.user.role === 'student' ? req.user.studentId : req.user.id;

        const count = await Notification.getUnreadCount(recipientId, recipientType);

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

        // Verify ownership
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
        const recipientType = req.user.role === 'student' ? 'student' : 'user';
        const recipientId = req.user.role === 'student' ? req.user.studentId : req.user.id;

        const result = await Notification.updateMany(
            {
                recipientId,
                recipientType,
                isRead: false
            },
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
 * Create a broadcast notification (admin only)
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

        const notification = await Notification.create({
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

        // Emit via socket
        const socketService = require('../services/socketService');
        socketService.emitNotification(notification);

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
            fromDate,
            toDate
        } = req.query;

        const query = {};

        if (type) query.type = type;
        if (recipientType) query.recipientType = recipientType;
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
