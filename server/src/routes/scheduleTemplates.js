/**
 * Schedule Template Routes
 * API routes for recurring schedule templates
 */

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/scheduleTemplateController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and staff/admin role
router.use(authenticate);
router.use(authorize('admin', 'staff'));

router.get('/', templateController.getAllTemplates);
router.get('/:id', templateController.getTemplate);
router.post('/', templateController.createTemplate);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);
router.post('/:id/preview', templateController.previewTemplate);
router.post('/:id/apply', templateController.applyTemplate);

module.exports = router;
