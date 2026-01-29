/**
 * Class Routes
 * API routes for class management
 */

const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Public routes (for students)
router.get('/upcoming', classController.getUpcomingClasses);
router.get('/calendar', classController.getCalendarEvents);

// Staff/Admin routes
router.get('/', authorize('admin', 'staff'), classController.getAllClasses);
router.get('/:id', authorize('admin', 'staff'), classController.getClass);
router.post('/', authorize('admin', 'staff'), classController.createClass);
router.post('/from-template', authorize('admin', 'staff'), classController.createFromTemplate);
router.post('/check-conflicts', authorize('admin', 'staff'), classController.checkConflicts);
router.put('/:id', authorize('admin', 'staff'), classController.updateClass);
router.post('/:id/reschedule', authorize('admin', 'staff'), classController.rescheduleClass);
router.post('/:id/cancel', authorize('admin', 'staff'), classController.cancelClass);
router.post('/:id/materials', authorize('admin', 'staff'), classController.addMaterials);
router.delete('/:id', authorize('admin'), classController.deleteClass);

module.exports = router;
