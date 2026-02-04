/**
 * Settings Controller
 * Handles global settings CRUD operations
 */

const GlobalSettings = require('../models/GlobalSettings');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get global settings
 */
exports.getSettings = async (req, res, next) => {
    try {
        const settings = await GlobalSettings.getSettings();
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update global settings
 */
exports.updateSettings = async (req, res, next) => {
    try {
        const updates = req.body;
        const userId = req.user._id;

        const settings = await GlobalSettings.updateSettings(updates, userId);

        // Log the action
        await AuditLog.log({
            userId,
            action: 'update',
            entity: 'global_settings',
            entityId: settings._id,
            details: 'Updated global settings',
            ipAddress: req.ip
        });

        res.json({
            success: true,
            data: settings,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get public settings (subset for frontend)
 */
exports.getPublicSettings = async (req, res, next) => {
    try {
        const settings = await GlobalSettings.getSettings();

        // Return only public-safe settings
        const publicSettings = {
            siteInfo: settings.siteInfo,
            contact: settings.contact,
            theme: settings.theme,
            socialMedia: settings.socialMedia
        };

        res.json({
            success: true,
            data: publicSettings
        });
    } catch (error) {
        next(error);
    }
};
