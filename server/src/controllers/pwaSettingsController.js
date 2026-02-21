/**
 * PWA Settings Controller
 * CRUD operations for PWA install guide, QR, and redirect configuration.
 */

const PWASettings = require('../models/PWASettings');
const QRScanEvent = require('../models/QRScanEvent');

/**
 * Get public PWA settings (no auth required)
 * Used by portal-entry page and install guide
 */
exports.getPublicSettings = async (req, res, next) => {
    try {
        const settings = await PWASettings.getSettings();
        const publicData = {
            guideVisibility: settings.guideVisibility,
            guideContent: settings.guideContent,
            guideAppearance: settings.guideAppearance,
            androidSteps: settings.androidSteps,
            iosSteps: settings.iosSteps,
            redirectSettings: settings.redirectSettings,
            qrSettings: {
                landingPagePath: settings.qrSettings?.landingPagePath,
                rollParamName: settings.qrSettings?.rollParamName
            }
        };
        res.json({ success: true, data: publicData });
    } catch (error) {
        next(error);
    }
};

/**
 * Get full PWA settings (admin only)
 */
exports.getSettings = async (req, res, next) => {
    try {
        const settings = await PWASettings.getSettings();
        res.json({ success: true, data: settings.toObject() });
    } catch (error) {
        next(error);
    }
};

/**
 * Update PWA settings (admin only)
 */
exports.updateSettings = async (req, res, next) => {
    try {
        const settings = await PWASettings.updateSettings(req.body, req.user._id);
        res.json({ success: true, data: settings.toObject(), message: 'PWA settings updated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get analytics (admin only)
 */
exports.getAnalytics = async (req, res, next) => {
    try {
        const period = req.query.period || 'month';
        const analytics = await QRScanEvent.getAnalytics(period);
        res.json({ success: true, data: analytics });
    } catch (error) {
        next(error);
    }
};
