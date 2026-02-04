/**
 * Settings Routes
 * Routes for global settings management
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route - get public settings
router.get('/public', settingsController.getPublicSettings);

// Protected routes
router.use(authenticate);

// Get all settings (admin only)
router.get('/', authorize('admin'), settingsController.getSettings);

// Update settings (admin only)
router.put('/', authorize('admin'), settingsController.updateSettings);

module.exports = router;
