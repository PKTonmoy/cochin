/**
 * Dashboard Routes
 * KPIs and statistics for admin dashboard
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require admin/staff authentication
router.use(authenticate);
router.use(authorize('admin', 'staff'));

router.get('/stats', dashboardController.getStats);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/payment-summary', dashboardController.getPaymentSummary);

module.exports = router;
