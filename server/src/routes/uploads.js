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
const cloudinary = require('cloudinary').v2;

router.post('/image', uploadImage.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        // Upload to Cloudinary using buffer stream
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'paragon/site-content',
                    resource_type: 'auto',
                    transformation: [
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        res.json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
