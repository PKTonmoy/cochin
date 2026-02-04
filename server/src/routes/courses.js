/**
 * Course Routes
 * Routes for course management
 */

const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/public', courseController.getPublishedCourses);
router.get('/public/featured', courseController.getFeaturedCourses);
router.get('/public/:identifier', courseController.getCourse);

// Protected routes
router.use(authenticate);

// Admin/Staff routes
router.get('/', authorize('admin', 'staff'), courseController.getAllCourses);
router.get('/:identifier', authorize('admin', 'staff'), courseController.getCourse);
router.post('/', authorize('admin', 'staff'), courseController.createCourse);
router.put('/:id', authorize('admin', 'staff'), courseController.updateCourse);
router.patch('/:id/status', authorize('admin'), courseController.toggleStatus);
router.delete('/:id', authorize('admin'), courseController.deleteCourse);

module.exports = router;
