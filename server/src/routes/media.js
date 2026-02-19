/**
 * Media Routes
 * Routes for media library management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const mediaController = require('../controllers/mediaController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

// All routes are protected
router.use(authenticate);

// Admin/Staff routes
router.get('/', authorize('admin', 'staff'), mediaController.getAllMedia);
router.get('/stats', authorize('admin', 'staff'), mediaController.getStats);
router.get('/cloudinary-usage', authorize('admin'), mediaController.getCloudinaryUsage);
router.get('/folders', authorize('admin', 'staff'), mediaController.getFolders);
router.get('/:id', authorize('admin', 'staff'), mediaController.getMedia);

// Upload with proper error handling
router.post('/upload',
    authorize('admin', 'staff'),
    (req, res, next) => {
        uploadImage.single('file')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                console.error('[Media Upload] Multer error:', err.message, err.code);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File size too large. Maximum size is 5MB.'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: `Upload error: ${err.message}`
                });
            } else if (err) {
                console.error('[Media Upload] File filter error:', err.message);
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            next();
        });
    },
    mediaController.uploadMedia
);

// Update and delete
router.put('/:id', authorize('admin', 'staff'), mediaController.updateMedia);
router.delete('/:id', authorize('admin'), mediaController.deleteMedia);
router.post('/bulk-delete', authorize('admin'), mediaController.bulkDelete);

// Folder management
router.post('/folders', authorize('admin', 'staff'), mediaController.createFolder);

module.exports = router;
