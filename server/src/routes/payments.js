/**
 * Payment Routes
 * Payment management and verification
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Admin/Staff routes
router.get('/', authorize('admin', 'staff'), paymentController.getAllPayments);
router.post('/', authorize('admin', 'staff'), paymentController.createPayment);
router.post('/verify', authorize('admin', 'staff'), paymentController.verifyPayment);
router.get('/student/:studentId', authorize('admin', 'staff'), paymentController.getStudentPayments);
router.get('/:id', authorize('admin', 'staff'), paymentController.getPayment);
router.put('/:id', authorize('admin', 'staff'), paymentController.updatePayment);

module.exports = router;
