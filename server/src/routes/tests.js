/**
 * Test Routes
 * CRUD operations for tests/exams
 */

const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// Public route for published tests
router.get('/upcoming', optionalAuth, testController.getUpcomingTests);

// Protected routes
router.use(authenticate);

router.get('/', authorize('admin', 'staff'), testController.getAllTests);
router.post('/', authorize('admin', 'staff'), testController.createTest);
router.get('/:id', authorize('admin', 'staff'), testController.getTest);
router.put('/:id', authorize('admin', 'staff'), testController.updateTest);
router.delete('/:id', authorize('admin'), testController.deleteTest);
router.post('/:id/publish', authorize('admin', 'staff'), testController.publishTest);

module.exports = router;
