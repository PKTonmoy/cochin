/**
 * Faculty Routes
 * Routes for faculty management
 */

const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/public', facultyController.getActiveFaculty);

// Protected routes
router.use(authenticate);

// Admin/Staff routes
router.get('/', authorize('admin', 'staff'), facultyController.getAllFaculty);
router.get('/:id', authorize('admin', 'staff'), facultyController.getFaculty);
router.post('/', authorize('admin', 'staff'), facultyController.createFaculty);
router.put('/:id', authorize('admin', 'staff'), facultyController.updateFaculty);
router.patch('/:id/toggle-active', authorize('admin'), facultyController.toggleActive);
router.put('/reorder', authorize('admin', 'staff'), facultyController.reorderFaculty);
router.delete('/:id', authorize('admin'), facultyController.deleteFaculty);

module.exports = router;
