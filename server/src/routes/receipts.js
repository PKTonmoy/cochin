/**
 * Receipt Routes
 * View and download payment receipts
 */

const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// Get receipt (can be accessed by student for their own receipt or admin/staff)
router.get('/:receiptId', optionalAuth, receiptController.getReceipt);
router.get('/:receiptId/pdf', optionalAuth, receiptController.downloadPDF);
router.post('/:receiptId/email', authenticate, authorize('admin', 'staff'), receiptController.emailReceipt);

module.exports = router;
