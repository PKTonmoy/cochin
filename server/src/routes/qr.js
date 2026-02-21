/**
 * QR Code Routes
 */

const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route — track scan events (no auth)
router.post('/track-scan', qrController.trackScan);

// Protected routes (admin only)
router.use(authenticate);
router.post('/generate', authorize('admin', 'staff'), qrController.generateQR);
router.post('/bulk', authorize('admin', 'staff'), qrController.bulkGenerateQR);
router.get('/student/:roll', authorize('admin', 'staff'), qrController.getStudentForQR);

module.exports = router;
