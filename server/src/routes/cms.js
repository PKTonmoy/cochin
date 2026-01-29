/**
 * CMS Routes
 * Consolidated routes for page management and content blocks
 */

const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const blockController = require('../controllers/blockController');
const siteContentController = require('../controllers/siteContentController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

// ==================== PAGE ROUTES ====================

// Public routes (published pages)
router.get('/public/pages/:slug', pageController.getPublishedPage);
router.get('/preview/:token', pageController.getPreviewPage);

// Protected routes (admin/staff)
router.use('/pages', authenticate);

// List & Get pages
router.get('/pages', authorize('admin', 'staff'), pageController.getAllPages);
router.get('/pages/:slug', authorize('admin', 'staff'), pageController.getPage);

// Create & Update pages
router.post('/pages', authorize('admin', 'staff'), pageController.createPage);
router.put('/pages/:id', authorize('admin', 'staff'), pageController.updatePage);
router.delete('/pages/:id', authorize('admin'), pageController.deletePage);
router.post('/pages/:id/duplicate', authorize('admin', 'staff'), pageController.duplicatePage);

// Section management
router.post('/pages/:id/sections', authorize('admin', 'staff'), pageController.addSection);
router.put('/pages/:id/sections/:sectionId', authorize('admin', 'staff'), pageController.updateSection);
router.delete('/pages/:id/sections/:sectionId', authorize('admin', 'staff'), pageController.deleteSection);
router.put('/pages/:id/sections/reorder', authorize('admin', 'staff'), pageController.reorderSections);

// Publishing (admin only)
router.post('/pages/:id/publish', authorize('admin'), pageController.publishPage);
router.post('/pages/:id/unpublish', authorize('admin'), pageController.unpublishPage);
router.post('/pages/:id/schedule', authorize('admin'), pageController.schedulePage);
router.post('/pages/:id/preview-link', authorize('admin', 'staff'), pageController.generatePreviewLink);

// Version control
router.get('/pages/:id/versions', authorize('admin', 'staff'), pageController.getVersions);
router.post('/pages/:id/restore/:versionId', authorize('admin', 'staff'), pageController.restoreVersion);

// ==================== BLOCK ROUTES ====================

router.get('/blocks', authenticate, authorize('admin', 'staff'), blockController.getAllBlocks);
router.get('/blocks/:id', authenticate, authorize('admin', 'staff'), blockController.getBlock);
router.post('/blocks', authenticate, authorize('admin'), blockController.createBlock);
router.put('/blocks/:id', authenticate, authorize('admin'), blockController.updateBlock);
router.delete('/blocks/:id', authenticate, authorize('admin'), blockController.deleteBlock);

// ==================== MEDIA ROUTES ====================

router.post('/media/upload',
    authenticate,
    authorize('admin', 'staff'),
    uploadImage.single('image'),
    siteContentController.uploadContentImage
);

module.exports = router;
