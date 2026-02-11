/**
 * Student Routes
 * CRUD operations for students
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

// Admin/Staff routes
router.get('/', authorize('admin', 'staff'), studentController.getAllStudents);
router.get('/export', authorize('admin', 'staff'), studentController.exportStudents);
router.get('/classes-list', authorize('admin', 'staff'), studentController.getStudentClasses);
router.post('/', authorize('admin', 'staff'), uploadImage.single('photo'), studentController.createStudent);
router.get('/:id', authorize('admin', 'staff'), studentController.getStudent);
router.put('/:id', authorize('admin', 'staff'), uploadImage.single('photo'), studentController.updateStudent);
router.delete('/:id', authorize('admin'), studentController.deleteStudent);

// Student portal route
router.get('/:roll/dashboard', studentController.getStudentDashboard);

module.exports = router;
