/**
 * Marketing Controller
 * Handles all CRUD operations for the isolated marketing module
 * Features: Pop-ups, Promo Sections, Offer Banners, QR Videos
 * All uploads go to Cloudinary (images + videos)
 */

const MktSettings = require('../models/MktSettings');
const MktPopup = require('../models/MktPopup');
const MktPromoSection = require('../models/MktPromoSection');
const MktOfferBanner = require('../models/MktOfferBanner');
const MktQrVideo = require('../models/MktQrVideo');
const { cloudinary, uploadImageFromBuffer } = require('../config/cloudinary');
const QRCode = require('qrcode');

// ============================================================
// HELPER: Upload buffer to Cloudinary (supports image + video)
// ============================================================
const uploadBufferToCloudinary = (buffer, folder, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                quality: 'auto:good'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

// ============================================================
// SETTINGS — Master Toggle
// ============================================================

/**
 * GET /api/marketing/settings
 * Returns the marketing module settings (master toggle)
 */
const getSettings = async (req, res) => {
    try {
        const settings = await MktSettings.getSettings();
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('[MKT] getSettings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch marketing settings' });
    }
};

/**
 * PUT /api/marketing/settings
 * Update the marketing module settings
 */
const updateSettings = async (req, res) => {
    try {
        const settings = await MktSettings.updateSettings(req.body, req.user?.id);
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('[MKT] updateSettings error:', error);
        res.status(500).json({ success: false, message: 'Failed to update marketing settings' });
    }
};

// ============================================================
// POPUPS — CRUD
// ============================================================

/** GET /api/marketing/popups */
const getPopups = async (req, res) => {
    try {
        const popups = await MktPopup.find().sort({ createdAt: -1 });
        res.json({ success: true, data: popups });
    } catch (error) {
        console.error('[MKT] getPopups error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch popups' });
    }
};

/** POST /api/marketing/popups */
const createPopup = async (req, res) => {
    try {
        const data = { ...req.body };

        // Handle image upload if file is present
        if (req.file) {
            const result = await uploadBufferToCloudinary(req.file.buffer, 'marketing/popups', 'image');
            data.imageUrl = result.secure_url;
            data.imagePublicId = result.public_id;
        }

        const popup = await MktPopup.create(data);
        res.status(201).json({ success: true, data: popup });
    } catch (error) {
        console.error('[MKT] createPopup error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create popup' });
    }
};

/** PUT /api/marketing/popups/:id */
const updatePopup = async (req, res) => {
    try {
        const data = { ...req.body };

        // Handle image upload if new file is present
        if (req.file) {
            // Delete old image from Cloudinary if exists
            const existing = await MktPopup.findById(req.params.id);
            if (existing?.imagePublicId) {
                await cloudinary.uploader.destroy(existing.imagePublicId).catch(() => { });
            }
            const result = await uploadBufferToCloudinary(req.file.buffer, 'marketing/popups', 'image');
            data.imageUrl = result.secure_url;
            data.imagePublicId = result.public_id;
        }

        const popup = await MktPopup.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });
        res.json({ success: true, data: popup });
    } catch (error) {
        console.error('[MKT] updatePopup error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update popup' });
    }
};

/** DELETE /api/marketing/popups/:id */
const deletePopup = async (req, res) => {
    try {
        const popup = await MktPopup.findById(req.params.id);
        if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });

        // Delete image from Cloudinary
        if (popup.imagePublicId) {
            await cloudinary.uploader.destroy(popup.imagePublicId).catch(() => { });
        }

        await MktPopup.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Popup deleted' });
    } catch (error) {
        console.error('[MKT] deletePopup error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete popup' });
    }
};

// ============================================================
// PROMO SECTIONS — CRUD + Reorder
// ============================================================

/** GET /api/marketing/promos */
const getPromos = async (req, res) => {
    try {
        const promos = await MktPromoSection.find().sort({ sortOrder: 1, createdAt: -1 });
        res.json({ success: true, data: promos });
    } catch (error) {
        console.error('[MKT] getPromos error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch promo sections' });
    }
};

/** POST /api/marketing/promos */
const createPromo = async (req, res) => {
    try {
        const data = { ...req.body };

        if (req.file) {
            const result = await uploadBufferToCloudinary(req.file.buffer, 'marketing/promos', 'image');
            data.imageUrl = result.secure_url;
            data.imagePublicId = result.public_id;
        }

        // Auto-assign sort order
        const count = await MktPromoSection.countDocuments();
        data.sortOrder = data.sortOrder || count;

        const promo = await MktPromoSection.create(data);
        res.status(201).json({ success: true, data: promo });
    } catch (error) {
        console.error('[MKT] createPromo error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create promo section' });
    }
};

/** PUT /api/marketing/promos/:id */
const updatePromo = async (req, res) => {
    try {
        const data = { ...req.body };

        if (req.file) {
            const existing = await MktPromoSection.findById(req.params.id);
            if (existing?.imagePublicId) {
                await cloudinary.uploader.destroy(existing.imagePublicId).catch(() => { });
            }
            const result = await uploadBufferToCloudinary(req.file.buffer, 'marketing/promos', 'image');
            data.imageUrl = result.secure_url;
            data.imagePublicId = result.public_id;
        }

        const promo = await MktPromoSection.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        if (!promo) return res.status(404).json({ success: false, message: 'Promo section not found' });
        res.json({ success: true, data: promo });
    } catch (error) {
        console.error('[MKT] updatePromo error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update promo section' });
    }
};

/** DELETE /api/marketing/promos/:id */
const deletePromo = async (req, res) => {
    try {
        const promo = await MktPromoSection.findById(req.params.id);
        if (!promo) return res.status(404).json({ success: false, message: 'Promo section not found' });

        if (promo.imagePublicId) {
            await cloudinary.uploader.destroy(promo.imagePublicId).catch(() => { });
        }

        await MktPromoSection.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Promo section deleted' });
    } catch (error) {
        console.error('[MKT] deletePromo error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete promo section' });
    }
};

/** POST /api/marketing/promos/reorder */
const reorderPromos = async (req, res) => {
    try {
        const { orderedIds } = req.body; // Array of IDs in desired order
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ success: false, message: 'orderedIds array is required' });
        }

        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { sortOrder: index } }
            }
        }));

        await MktPromoSection.bulkWrite(bulkOps);
        const promos = await MktPromoSection.find().sort({ sortOrder: 1 });
        res.json({ success: true, data: promos });
    } catch (error) {
        console.error('[MKT] reorderPromos error:', error);
        res.status(500).json({ success: false, message: 'Failed to reorder promo sections' });
    }
};

// ============================================================
// OFFER BANNERS — CRUD
// ============================================================

/** GET /api/marketing/banners */
const getBanners = async (req, res) => {
    try {
        const banners = await MktOfferBanner.find().sort({ createdAt: -1 });
        res.json({ success: true, data: banners });
    } catch (error) {
        console.error('[MKT] getBanners error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch banners' });
    }
};

/** POST /api/marketing/banners */
const createBanner = async (req, res) => {
    try {
        const banner = await MktOfferBanner.create(req.body);
        res.status(201).json({ success: true, data: banner });
    } catch (error) {
        console.error('[MKT] createBanner error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create banner' });
    }
};

/** PUT /api/marketing/banners/:id */
const updateBanner = async (req, res) => {
    try {
        const banner = await MktOfferBanner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
        res.json({ success: true, data: banner });
    } catch (error) {
        console.error('[MKT] updateBanner error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update banner' });
    }
};

/** DELETE /api/marketing/banners/:id */
const deleteBanner = async (req, res) => {
    try {
        const banner = await MktOfferBanner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
        res.json({ success: true, message: 'Banner deleted' });
    } catch (error) {
        console.error('[MKT] deleteBanner error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete banner' });
    }
};

// ============================================================
// QR VIDEOS — CRUD + QR Generation + Analytics
// ============================================================

/** GET /api/marketing/qr-videos */
const getQrVideos = async (req, res) => {
    try {
        const videos = await MktQrVideo.find().sort({ createdAt: -1 });
        res.json({ success: true, data: videos });
    } catch (error) {
        console.error('[MKT] getQrVideos error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch QR videos' });
    }
};

/** POST /api/marketing/qr-videos */
const createQrVideo = async (req, res) => {
    try {
        const data = { ...req.body };

        // Handle video upload if file is present (MP4 to Cloudinary)
        if (req.file) {
            const result = await uploadBufferToCloudinary(req.file.buffer, 'marketing/videos', 'video');
            data.videoSource = result.secure_url;
            data.videoPublicId = result.public_id;
            data.videoType = 'upload';
            // Cloudinary auto-generates thumbnail for videos
            if (result.secure_url) {
                data.thumbnailUrl = result.secure_url.replace(/\.\w+$/, '.jpg');
            }
        }

        // Create the document first to get the _id
        const video = await MktQrVideo.create(data);

        // Generate QR code pointing to /qr/{id}
        const baseUrl = process.env.CLIENT_URL || process.env.BASE_URL || 'http://localhost:5173';
        const qrTargetUrl = `${baseUrl}/qr/${video._id}`;
        const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
            width: 512,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        });

        // Upload QR code image to Cloudinary
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        const qrResult = await uploadBufferToCloudinary(qrBuffer, 'marketing/qrcodes', 'image');

        // Update video with QR code URLs
        video.qrCodeUrl = qrResult.secure_url;
        video.qrCodePublicId = qrResult.public_id;
        await video.save();

        res.status(201).json({ success: true, data: video });
    } catch (error) {
        console.error('[MKT] createQrVideo error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create QR video' });
    }
};

/** PUT /api/marketing/qr-videos/:id */
const updateQrVideo = async (req, res) => {
    try {
        const data = { ...req.body };
        const existing = await MktQrVideo.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'QR video not found' });

        // Handle new video upload
        if (req.file) {
            // Delete old video from Cloudinary
            if (existing.videoPublicId) {
                await cloudinary.uploader.destroy(existing.videoPublicId, { resource_type: 'video' }).catch(() => { });
            }
            const result = await uploadBufferToCloudinary(req.file.buffer, 'marketing/videos', 'video');
            data.videoSource = result.secure_url;
            data.videoPublicId = result.public_id;
            data.videoType = 'upload';
            if (result.secure_url) {
                data.thumbnailUrl = result.secure_url.replace(/\.\w+$/, '.jpg');
            }
        }

        const video = await MktQrVideo.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
        res.json({ success: true, data: video });
    } catch (error) {
        console.error('[MKT] updateQrVideo error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update QR video' });
    }
};

/** DELETE /api/marketing/qr-videos/:id */
const deleteQrVideo = async (req, res) => {
    try {
        const video = await MktQrVideo.findById(req.params.id);
        if (!video) return res.status(404).json({ success: false, message: 'QR video not found' });

        // Clean up Cloudinary assets
        if (video.videoPublicId) {
            await cloudinary.uploader.destroy(video.videoPublicId, { resource_type: 'video' }).catch(() => { });
        }
        if (video.qrCodePublicId) {
            await cloudinary.uploader.destroy(video.qrCodePublicId).catch(() => { });
        }

        await MktQrVideo.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'QR video deleted' });
    } catch (error) {
        console.error('[MKT] deleteQrVideo error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete QR video' });
    }
};

// ============================================================
// PUBLIC ENDPOINTS — Fetch active marketing data + QR analytics
// ============================================================

/**
 * GET /api/marketing/active
 * Returns all currently active marketing content for the public homepage
 * Checks master toggle, date ranges, and isActive flags
 */
const getActiveMarketing = async (req, res) => {
    try {
        // Check master toggle
        const settings = await MktSettings.getSettings();
        if (!settings.marketingEnabled) {
            res.set('Cache-Control', 'public, max-age=60');
            return res.json({
                success: true,
                data: { enabled: false, popups: [], promos: [], banners: [] }
            });
        }

        const now = new Date();

        // Lean projection — exclude internal fields from public response
        const leanSelect = '-__v -createdAt -updatedAt';

        // Active popups (within date range or no date set)
        const popups = await MktPopup.find({
            isActive: true,
            $or: [
                { startDate: null, endDate: null },
                { startDate: { $lte: now }, endDate: null },
                { startDate: null, endDate: { $gte: now } },
                { startDate: { $lte: now }, endDate: { $gte: now } }
            ]
        }).select(leanSelect).sort({ createdAt: -1 }).lean();

        // Active promo sections
        const promos = await MktPromoSection.find({ isActive: true })
            .select(leanSelect).sort({ sortOrder: 1 }).lean();

        // Active offer banners (within date range and not expired)
        const banners = await MktOfferBanner.find({
            isActive: true,
            $or: [
                { startDate: null, endDate: null },
                { startDate: { $lte: now }, endDate: null },
                { startDate: null, endDate: { $gte: now } },
                { startDate: { $lte: now }, endDate: { $gte: now } }
            ]
        }).select(leanSelect).sort({ createdAt: -1 }).lean();

        // Cache for 5 minutes — CDN and browser will skip repeat requests
        res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

        res.json({
            success: true,
            data: { enabled: true, popups, promos, banners }
        });
    } catch (error) {
        console.error('[MKT] getActiveMarketing error:', error);
        // Silent fail for public — never break the page
        res.json({
            success: true,
            data: { enabled: false, popups: [], promos: [], banners: [] }
        });
    }
};

/**
 * GET /api/marketing/qr/:id
 * Returns QR video data for the standalone player page
 */
const getQrVideoPublic = async (req, res) => {
    try {
        const video = await MktQrVideo.findById(req.params.id)
            .select('-__v -createdAt -updatedAt -qrCodePublicId -videoPublicId')
            .lean();
        if (!video || !video.isActive) {
            return res.status(404).json({ success: false, message: 'Video not found or inactive' });
        }
        // Cache for 1 minute
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
        res.json({ success: true, data: video });
    } catch (error) {
        console.error('[MKT] getQrVideoPublic error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch video' });
    }
};

/**
 * POST /api/marketing/qr/:id/scan
 * Increment scan count for analytics
 */
const logQrScan = async (req, res) => {
    try {
        await MktQrVideo.findByIdAndUpdate(req.params.id, { $inc: { scanCount: 1 } });
        res.json({ success: true });
    } catch (error) {
        // Silent fail — analytics should never block the experience
        res.json({ success: true });
    }
};

/**
 * POST /api/marketing/qr/:id/complete
 * Increment watch completion count for analytics
 */
const logQrComplete = async (req, res) => {
    try {
        await MktQrVideo.findByIdAndUpdate(req.params.id, { $inc: { watchCount: 1 } });
        res.json({ success: true });
    } catch (error) {
        res.json({ success: true });
    }
};

module.exports = {
    // Settings
    getSettings,
    updateSettings,
    // Popups
    getPopups,
    createPopup,
    updatePopup,
    deletePopup,
    // Promos
    getPromos,
    createPromo,
    updatePromo,
    deletePromo,
    reorderPromos,
    // Banners
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    // QR Videos
    getQrVideos,
    createQrVideo,
    updateQrVideo,
    deleteQrVideo,
    // Public
    getActiveMarketing,
    getQrVideoPublic,
    logQrScan,
    logQrComplete
};
