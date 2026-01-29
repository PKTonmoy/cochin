/**
 * Upload Routes
 * Excel import for test results
 */

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadExcel } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

// All routes require admin/staff authentication
router.use(authenticate);
router.use(authorize('admin', 'staff'));

// Upload and preview Excel file
router.post('/results/upload', uploadLimiter, uploadExcel.single('file'), uploadController.uploadFile);

// Validate with mapping
router.post('/results/validate', uploadController.validateMapping);

// Execute import
router.post('/results/import', uploadController.executeImport);

// Rollback import batch
router.post('/results/rollback', uploadController.rollbackImport);

// Get upload batches
router.get('/batches', uploadController.getBatches);
router.get('/batches/:id', uploadController.getBatch);

// Download template
router.get('/template', uploadController.downloadTemplate);

// Image upload for site content
const { uploadImage } = require('../middleware/upload');
const { uploadImage: cloudinaryUpload } = require('../config/cloudinary');
const fs = require('fs');

router.post('/image', uploadImage.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        // Upload to Cloudinary
        const result = await cloudinaryUpload(req.file.path, 'paragon/site-content');

        // Delete local file after upload
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });

        if (!result.success) {
            return res.status(500).json({ success: false, message: 'Failed to upload image' });
        }

        res.json({
            success: true,
            data: {
                url: result.url,
                publicId: result.publicId
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
