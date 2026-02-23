/**
 * Notification Routes
 * API routes for notification management
 * Includes push subscription and multi-channel notice delivery
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

// ─── Public routes (no auth) ─────────────────────────────────────
// VAPID public key needed by client to subscribe to push
router.get('/vapid-public-key', notificationController.getVapidPublicKey);

// All remaining routes require authentication
router.use(authenticate);

// ─── Push subscription routes ────────────────────────────────────
router.post('/push-subscription', notificationController.savePushSubscription);
router.delete('/push-subscription', notificationController.removePushSubscription);

// ─── Student notice routes ───────────────────────────────────────
router.get('/student-notices', notificationController.getStudentNotices);

// ─── User notification routes ────────────────────────────────────
router.get('/', notificationController.getNotifications);
router.get('/class', notificationController.getClassNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/mark-read', notificationController.markMultipleAsRead);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

// ─── Admin routes ────────────────────────────────────────────────
router.get('/all', authorize('admin', 'staff'), notificationController.getAllNotifications);
router.post('/broadcast', authorize('admin', 'staff'), notificationController.createBroadcast);
router.post('/send-notice', authorize('admin', 'staff'), notificationController.sendNotice);

module.exports = router;
