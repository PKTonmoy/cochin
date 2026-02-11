/**
 * Workflow Routes
 * API routes for workflow validation and status checks
 */

const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Workflow status checks (admin/staff only)
router.get('/overview', authorize('admin', 'staff'), workflowController.getWorkflowOverview);
router.get('/attendance-status/:testId', authorize('admin', 'staff'), workflowController.checkTestAttendance);
router.get('/eligible-students/:testId', authorize('admin', 'staff'), workflowController.getEligibleStudents);
router.get('/class-status/:classId', authorize('admin', 'staff'), workflowController.getClassStatus);
router.post('/validate-result-entry', authorize('admin', 'staff'), workflowController.validateResultEntry);

module.exports = router;
