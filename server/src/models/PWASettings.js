/**
 * PWASettings Model
 * Singleton model for PWA install guide, QR code, and redirect configuration.
 * Managed from Admin Panel → PWA & QR Codes.
 */

const mongoose = require('mongoose');

// ─── Install Guide Benefit Item ──────────────────────────────────
const benefitItemSchema = new mongoose.Schema({
    emoji: { type: String, default: '⚡' },
    text: { type: String, default: '' }
}, { _id: false });

// ─── Install Guide Step (for Android/iOS instructions) ───────────
const installStepSchema = new mongoose.Schema({
    stepNumber: { type: Number },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' } // optional illustration
}, { _id: false });

// ─── QR Code Style Settings ─────────────────────────────────────
const qrStyleSchema = new mongoose.Schema({
    foregroundColor: { type: String, default: '#1e293b' },
    backgroundColor: { type: String, default: '#ffffff' },
    logoUrl: { type: String, default: '' },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    borderStyle: { type: String, enum: ['none', 'square', 'rounded'], default: 'rounded' },
    errorCorrectionLevel: { type: String, enum: ['L', 'M', 'Q', 'H'], default: 'M' }
}, { _id: false });

// ─── Main PWASettings Schema ────────────────────────────────────
const pwaSettingsSchema = new mongoose.Schema({
    // ── Install Guide Visibility ──
    guideVisibility: {
        showToNewVisitors: { type: Boolean, default: true },
        showOnQRScan: { type: Boolean, default: true },
        showOnDirectVisit: { type: Boolean, default: true },
        reShowAfterDismissal: { type: Boolean, default: true },
        reShowDays: { type: Number, default: 3 }
    },

    // ── Install Guide Content ──
    guideContent: {
        welcomeHeading: { type: String, default: 'Get the App' },
        welcomeSubtext: { type: String, default: 'Install our app for faster access, offline support & better experience' },
        benefits: {
            type: [benefitItemSchema],
            default: [
                { emoji: '⚡', text: 'Faster Login' },
                { emoji: '📶', text: 'Works Offline' },
                { emoji: '🔔', text: 'Get Notifications' }
            ]
        },
        installButtonText: { type: String, default: 'Install Now' },
        maybeLaterText: { type: String, default: 'Maybe Later' },
        successHeading: { type: String, default: 'App Installed Successfully! 🎉' },
        successSubtext: { type: String, default: 'Find the app on your home screen' }
    },

    // ── Install Guide Appearance ──
    guideAppearance: {
        primaryColor: { type: String, default: '#3b82f6' },
        overlayOpacity: { type: Number, default: 60, min: 0, max: 100 },
        cardBackgroundColor: { type: String, default: '#ffffff' },
        textColor: { type: String, default: '#1e293b' },
        buttonColor: { type: String, default: '#3b82f6' },
        fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
        animationSpeed: { type: String, enum: ['slow', 'normal', 'fast', 'none'], default: 'normal' },
        showBenefits: { type: Boolean, default: true },
        showPhoneMockup: { type: Boolean, default: true }
    },

    // ── Android Installation Steps ──
    androidSteps: {
        type: [installStepSchema],
        default: [
            { stepNumber: 1, title: 'Tap the menu', description: 'Tap the ⋮ three-dot menu at the top right corner' },
            { stepNumber: 2, title: 'Add to Home Screen', description: 'Tap "Add to Home Screen" or "Install App"' },
            { stepNumber: 3, title: 'Install', description: 'Tap "Install" in the confirmation dialog' },
            { stepNumber: 4, title: 'Done!', description: 'Open the app from your home screen' }
        ]
    },

    // ── iOS Installation Steps ──
    iosSteps: {
        type: [installStepSchema],
        default: [
            { stepNumber: 1, title: 'Open in Safari', description: 'Make sure you are using Safari browser' },
            { stepNumber: 2, title: 'Tap Share', description: 'Tap the Share button at the bottom of the screen' },
            { stepNumber: 3, title: 'Add to Home Screen', description: 'Scroll down and tap "Add to Home Screen"' },
            { stepNumber: 4, title: 'Tap Add', description: 'Tap "Add" in the top right corner' },
            { stepNumber: 5, title: 'Done!', description: 'Find the app on your home screen' }
        ]
    },

    // ── QR Code Settings ──
    qrSettings: {
        style: { type: qrStyleSchema, default: () => ({}) },
        baseUrl: { type: String, default: '' }, // auto-filled with current domain
        landingPagePath: { type: String, default: '/portal-entry' },
        rollParamName: { type: String, default: 'roll' }
    },

    // ── Smart Redirect Settings ──
    redirectSettings: {
        enabled: { type: Boolean, default: true },
        pwaRedirectUrl: { type: String, default: '/student-login' },
        nonPwaRedirectUrl: { type: String, default: '/student-login' },
        desktopRedirectUrl: { type: String, default: '/student-login' },
        showOpenInAppButton: { type: Boolean, default: true },
        openInAppButtonText: { type: String, default: 'Open in App' },
        openInAppButtonColor: { type: String, default: '#3b82f6' }
    },

    // ── Tracking ──
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
    collection: 'pwa_settings'
});

// Pre-save: update timestamp
pwaSettingsSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Singleton: get settings
pwaSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

// Singleton: update settings
pwaSettingsSchema.statics.updateSettings = async function (data, userId) {
    let settings = await this.findOne();
    if (!settings) {
        settings = new this(data);
    } else {
        // Deep merge for nested objects
        const deepMerge = (target, source) => {
            for (const key of Object.keys(source)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && !(source[key] instanceof mongoose.Types.ObjectId)) {
                    if (!target[key]) target[key] = {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        };
        deepMerge(settings, data);
        settings.markModified('guideVisibility');
        settings.markModified('guideContent');
        settings.markModified('guideAppearance');
        settings.markModified('androidSteps');
        settings.markModified('iosSteps');
        settings.markModified('qrSettings');
        settings.markModified('redirectSettings');
    }
    settings.updatedBy = userId;
    await settings.save();
    return settings;
};

const PWASettings = mongoose.model('PWASettings', pwaSettingsSchema);

module.exports = PWASettings;
