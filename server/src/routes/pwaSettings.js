/**
 * PWA Settings Routes
 */

const express = require('express');
const router = express.Router();
const pwaSettingsController = require('../controllers/pwaSettingsController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route — no auth needed (used by portal-entry page)
router.get('/public', pwaSettingsController.getPublicSettings);

// Protected routes
router.use(authenticate);

// Admin only
router.get('/', authorize('admin'), pwaSettingsController.getSettings);
router.put('/', authorize('admin'), pwaSettingsController.updateSettings);
router.get('/analytics', authorize('admin'), pwaSettingsController.getAnalytics);

module.exports = router;
