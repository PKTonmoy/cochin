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
        const settingsObj = settings.toObject();

        // Inject SMS environment configuration status
        if (!settingsObj.smsSettings) settingsObj.smsSettings = {};

        if (process.env.BULKSMSBD_API_KEY) {
            settingsObj.smsSettings.apiKey = '********';
            settingsObj.smsSettings.isEnvApiKey = true;
        }

        if (process.env.BULKSMSBD_SENDER_ID) {
            settingsObj.smsSettings.senderId = process.env.BULKSMSBD_SENDER_ID;
            settingsObj.smsSettings.isEnvSenderId = true;
        }

        res.json({
            success: true,
            data: settingsObj
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

        // Prevent overwriting API key with masked value
        if (updates.smsSettings?.apiKey === '********') {
            delete updates.smsSettings.apiKey;
        }

        const settings = await GlobalSettings.updateSettings(updates, userId);

        // Retain the env masking in response
        const settingsObj = settings.toObject();
        if (process.env.BULKSMSBD_API_KEY) {
            if (!settingsObj.smsSettings) settingsObj.smsSettings = {};
            settingsObj.smsSettings.apiKey = '********';
            settingsObj.smsSettings.isEnvApiKey = true;
        }

        if (process.env.BULKSMSBD_SENDER_ID) {
            if (!settingsObj.smsSettings) settingsObj.smsSettings = {};
            settingsObj.smsSettings.senderId = process.env.BULKSMSBD_SENDER_ID;
            settingsObj.smsSettings.isEnvSenderId = true;
        }

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
            data: settingsObj,
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
            socialMedia: settings.socialMedia,
            receiptTemplate: settings.receiptTemplate // Add receiptTemplate to public settings
        };

        res.json({
            success: true,
            data: publicSettings
        });
    } catch (error) {
        next(error);
    }
};
