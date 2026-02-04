/**
 * Media Routes
 * Routes for media library management
 */

const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

// All routes are protected
router.use(authenticate);

// Admin/Staff routes
router.get('/', authorize('admin', 'staff'), mediaController.getAllMedia);
router.get('/stats', authorize('admin', 'staff'), mediaController.getStats);
router.get('/folders', authorize('admin', 'staff'), mediaController.getFolders);
router.get('/:id', authorize('admin', 'staff'), mediaController.getMedia);

// Upload
router.post('/upload',
    authorize('admin', 'staff'),
    uploadImage.single('file'),
    mediaController.uploadMedia
);

// Update and delete
router.put('/:id', authorize('admin', 'staff'), mediaController.updateMedia);
router.delete('/:id', authorize('admin'), mediaController.deleteMedia);
router.post('/bulk-delete', authorize('admin'), mediaController.bulkDelete);

// Folder management
router.post('/folders', authorize('admin', 'staff'), mediaController.createFolder);

module.exports = router;
