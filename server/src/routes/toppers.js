/**
 * Topper Routes
 * Routes for results/toppers management
 */

const express = require('express');
const router = express.Router();
const topperController = require('../controllers/topperController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/public', topperController.getPublicToppers);
router.get('/public/homepage', topperController.getHomepageToppers);
router.get('/public/years', topperController.getYears);

// Protected routes
router.use(authenticate);

// Admin/Staff routes
router.get('/', authorize('admin', 'staff'), topperController.getAllToppers);
router.get('/stats', authorize('admin', 'staff'), topperController.getStats);
router.get('/:id', authorize('admin', 'staff'), topperController.getTopper);
router.post('/', authorize('admin', 'staff'), topperController.createTopper);
router.post('/bulk', authorize('admin'), topperController.bulkCreate);
router.put('/:id', authorize('admin', 'staff'), topperController.updateTopper);
router.delete('/:id', authorize('admin'), topperController.deleteTopper);

module.exports = router;
