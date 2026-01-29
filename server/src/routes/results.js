/**
 * Result Routes
 * View, upload, and export test results
 */

const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// ==========================================
// ADMIN/STAFF ROUTES
// ==========================================

// Get all results with filters and pagination
router.get('/', authorize('admin', 'staff'), resultController.getAllResults);

// Get results for a specific test
router.get('/test/:testId', authorize('admin', 'staff'), resultController.getTestResults);

// Get merit list for a test (with topper & statistics)
router.get('/merit-list/:testId', authorize('admin', 'staff'), resultController.getMeritList);

// Download Excel template for result upload
router.get('/template/:testId', authorize('admin', 'staff'), resultController.downloadTemplate);

// Bulk create/update results (for form-based entry)
router.post('/bulk', authorize('admin', 'staff'), resultController.bulkCreateResults);

// Validate results before saving (preview validation)
router.post('/validate', authorize('admin', 'staff'), resultController.validateResults);

// Export results to Excel
router.post('/export', authorize('admin', 'staff'), resultController.exportResults);

// Publish/unpublish test results
router.post('/publish/:testId', authorize('admin', 'staff'), resultController.publishResults);

// Update a single result
router.put('/:resultId', authorize('admin', 'staff'), resultController.updateResult);

// Delete a single result
router.delete('/:resultId', authorize('admin', 'staff'), resultController.deleteResult);

// ==========================================
// STUDENT ROUTES
// ==========================================

// Student can view their own results (all tests)
router.get('/student/:studentId', resultController.getStudentResults);

// Student can view detailed result for a specific test
router.get('/student/:studentId/test/:testId', resultController.getStudentTestResult);

// Merit list is also accessible to students for published tests
router.get('/public/merit-list/:testId', resultController.getMeritList);

module.exports = router;
