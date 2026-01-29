/**
 * Attendance Routes
 * Manage student attendance for classes and tests
 */

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Admin/Staff routes
router.post('/bulk', authorize('admin', 'staff'), attendanceController.markAttendance);
router.get('/', authorize('admin', 'staff'), attendanceController.getAttendance);
// Get attendance history summary
router.get('/history', authorize('admin', 'staff'), attendanceController.getAttendanceHistory);

router.get('/test/:testId', authorize('admin', 'staff'), attendanceController.getTestAttendees);
router.delete('/:id', authorize('admin', 'staff'), attendanceController.deleteAttendance);

// Student can view their own attendance
router.get('/student/:studentId', attendanceController.getStudentAttendance);
router.get('/check/:testId/:studentId', attendanceController.checkTestAttendance);

module.exports = router;
