const express = require('express');
const {
    createLead,
    getLeads,
    updateLead,
    deleteLead
} = require('../controllers/leadController');

const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');

router
    .route('/')
    .get(authenticate, authorize('admin', 'super-admin'), getLeads)
    .post(createLead);

router
    .route('/:id')
    .patch(authenticate, authorize('admin', 'super-admin'), updateLead)
    .delete(authenticate, authorize('admin', 'super-admin'), deleteLead);

module.exports = router;
