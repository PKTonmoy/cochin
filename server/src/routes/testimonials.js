/**
 * Testimonial Routes
 * Routes for testimonial management
 */

const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/public', testimonialController.getActiveTestimonials);
router.get('/public/homepage', testimonialController.getHomepageTestimonials);

// Protected routes
router.use(authenticate);

// Admin/Staff routes
router.get('/', authorize('admin', 'staff'), testimonialController.getAllTestimonials);
router.get('/:id', authorize('admin', 'staff'), testimonialController.getTestimonial);
router.post('/', authorize('admin', 'staff'), testimonialController.createTestimonial);
router.put('/:id', authorize('admin', 'staff'), testimonialController.updateTestimonial);
router.patch('/:id/toggle-active', authorize('admin'), testimonialController.toggleActive);
router.put('/reorder', authorize('admin', 'staff'), testimonialController.reorderTestimonials);
router.delete('/:id', authorize('admin'), testimonialController.deleteTestimonial);

module.exports = router;
