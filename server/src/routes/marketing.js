/**
 * Marketing Routes
 * All routes for the isolated marketing module
 * Public routes: no auth required
 * Admin routes: require authentication + admin role
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const mkt = require('../controllers/mktController');

// ============================================================
// Multer config — memory storage for Cloudinary uploads
// Supports both image and video files
// ============================================================
const mktUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max (for video uploads)
    },
    fileFilter: (req, file, cb) => {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
        const allowed = [...allowedImageTypes, ...allowedVideoTypes];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed. Supported: images (jpg/png/gif/webp) and videos (mp4/webm/mov/avi)`), false);
        }
    }
});

// ============================================================
// PUBLIC ROUTES (no auth — used by marketing.js on frontend)
// ============================================================

// Get all active marketing content for the homepage
router.get('/active', mkt.getActiveMarketing);

// Get QR video data for the standalone player page
router.get('/qr/:id', mkt.getQrVideoPublic);

// Analytics: log QR scan
router.post('/qr/:id/scan', mkt.logQrScan);

// Analytics: log video completion
router.post('/qr/:id/complete', mkt.logQrComplete);

// ============================================================
// ADMIN ROUTES (require auth + admin/staff role)
// ============================================================

// --- Settings ---
router.get('/settings', authenticate, authorize('admin', 'staff'), mkt.getSettings);
router.put('/settings', authenticate, authorize('admin', 'staff'), mkt.updateSettings);

// --- Popups ---
router.get('/popups', authenticate, authorize('admin', 'staff'), mkt.getPopups);
router.post('/popups', authenticate, authorize('admin', 'staff'), mktUpload.single('image'), mkt.createPopup);
router.put('/popups/:id', authenticate, authorize('admin', 'staff'), mktUpload.single('image'), mkt.updatePopup);
router.delete('/popups/:id', authenticate, authorize('admin', 'staff'), mkt.deletePopup);

// --- Promo Sections ---
router.get('/promos', authenticate, authorize('admin', 'staff'), mkt.getPromos);
router.post('/promos', authenticate, authorize('admin', 'staff'), mktUpload.single('image'), mkt.createPromo);
router.put('/promos/:id', authenticate, authorize('admin', 'staff'), mktUpload.single('image'), mkt.updatePromo);
router.delete('/promos/:id', authenticate, authorize('admin', 'staff'), mkt.deletePromo);
router.post('/promos/reorder', authenticate, authorize('admin', 'staff'), mkt.reorderPromos);

// --- Offer Banners ---
router.get('/banners', authenticate, authorize('admin', 'staff'), mkt.getBanners);
router.post('/banners', authenticate, authorize('admin', 'staff'), mkt.createBanner);
router.put('/banners/:id', authenticate, authorize('admin', 'staff'), mkt.updateBanner);
router.delete('/banners/:id', authenticate, authorize('admin', 'staff'), mkt.deleteBanner);

// --- QR Videos ---
router.get('/qr-videos', authenticate, authorize('admin', 'staff'), mkt.getQrVideos);
router.post('/qr-videos', authenticate, authorize('admin', 'staff'), mktUpload.single('video'), mkt.createQrVideo);
router.put('/qr-videos/:id', authenticate, authorize('admin', 'staff'), mktUpload.single('video'), mkt.updateQrVideo);
router.delete('/qr-videos/:id', authenticate, authorize('admin', 'staff'), mkt.deleteQrVideo);

module.exports = router;
