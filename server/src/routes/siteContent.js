/**
 * Site Content Routes
 * Editable content management for landing page
 */

const express = require('express');
const router = express.Router();
const siteContentController = require('../controllers/siteContentController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

// Public routes - get content
router.get('/', siteContentController.getAllContent);
router.get('/:key', siteContentController.getContent);

// Protected routes - update content
router.put('/:key', authenticate, authorize('admin'), uploadImage.array('images', 10), siteContentController.updateContent);

// Upload images for site content
router.post('/upload-image', authenticate, authorize('admin'), uploadImage.single('image'), siteContentController.uploadContentImage);

module.exports = router;
