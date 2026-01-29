/**
 * Notification Routes
 * API routes for notification management
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// User notification routes
router.get('/', notificationController.getNotifications);
router.get('/class', notificationController.getClassNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/mark-read', notificationController.markMultipleAsRead);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

// Admin routes
router.get('/all', authorize('admin', 'staff'), notificationController.getAllNotifications);
router.post('/broadcast', authorize('admin', 'staff'), notificationController.createBroadcast);

module.exports = router;
