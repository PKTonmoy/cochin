/**
 * SMS Routes
 * Admin-only routes for SMS management
 */

const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin', 'staff'));

// Send custom SMS to filtered students
router.post('/send-custom', smsController.sendCustomSms);

// Manually trigger result SMS for a test
router.post('/send-result/:testId', smsController.sendResultSms);

// Get recipient count preview
router.post('/recipient-count', smsController.getRecipientCount);

// Get SMS logs
router.get('/logs', smsController.getLogs);

// Get SMS statistics
router.get('/stats', smsController.getStats);

// Check SMS API balance
router.get('/balance', smsController.getBalance);

module.exports = router;
