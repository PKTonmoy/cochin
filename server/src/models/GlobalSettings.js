/**
 * GlobalSettings Model
 * Singleton model for site-wide configuration
 */

const mongoose = require('mongoose');

// Address schema
const addressSchema = new mongoose.Schema({
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'Bangladesh' },
    postalCode: { type: String },
    googleMapsLink: { type: String }
}, { _id: false });

// Office hours schema
const officeHoursSchema = new mongoose.Schema({
    weekdays: { type: String, default: '9:00 AM - 7:00 PM' },
    saturday: { type: String, default: '9:00 AM - 5:00 PM' },
    sunday: { type: String, default: 'Closed' }
}, { _id: false });

// Theme schema
const themeSchema = new mongoose.Schema({
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#8B5CF6' },
    accentColor: { type: String, default: '#10B981' },
    darkMode: { type: Boolean, default: false },
    defaultTheme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    fonts: {
        heading: { type: String, default: 'Poppins' },
        body: { type: String, default: 'Inter' },
        bangla: { type: String, default: 'Hind Siliguri' }
    }
}, { _id: false });

// SEO schema
const seoSettingsSchema = new mongoose.Schema({
    defaultMetaTitle: { type: String },
    defaultMetaDescription: { type: String, maxlength: 160 },
    defaultKeywords: [{ type: String }],
    googleAnalyticsId: { type: String },
    googleSearchConsoleId: { type: String },
    facebookPixelId: { type: String }
}, { _id: false });

// Social media schema
const socialMediaSchema = new mongoose.Schema({
    facebook: { type: String },
    instagram: { type: String },
    youtube: { type: String },
    linkedin: { type: String },
    twitter: { type: String },
    tiktok: { type: String }
}, { _id: false });

// Notification settings schema
const notificationSettingsSchema = new mongoose.Schema({
    adminEmail: { type: String },
    newEnrollmentAlert: { type: Boolean, default: true },
    newContactFormAlert: { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: false }
}, { _id: false });

// SMS settings schema
const smsSettingsSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: false },
    apiKey: { type: String, trim: true },
    senderId: { type: String, trim: true },
    resultSmsTemplate: {
        type: String,
        default: 'Dear {studentName}, Your {testName} result: {score}/{total}. Highest Score: {highest}. Visit {website} for details. - PARAGON'
    },
    noticeSmsTemplate: {
        type: String,
        default: 'Notice: {title} - {message}. Login to portal for details.'
    },
    websiteUrl: { type: String, trim: true, default: '' }
}, { _id: false });

// Receipt template schema
const receiptTemplateSchema = new mongoose.Schema({
    primaryColor: { type: String, default: '#1a365d' },
    showLogo: { type: Boolean, default: true },
    showQRCode: { type: Boolean, default: true },
    showCredentialsOnFirst: { type: Boolean, default: true },
    footerNote: { type: String, default: 'This is a computer-generated receipt. Please keep this for your records.' },
    signatureLeftLabel: { type: String, default: 'Student/Guardian' },
    signatureRightLabel: { type: String, default: 'Authorized Signature' }
}, { _id: false });

// Main GlobalSettings schema
const globalSettingsSchema = new mongoose.Schema({
    // Site info
    siteInfo: {
        name: { type: String, default: 'PARAGON Coaching Center' },
        tagline: { type: String, default: 'Transform Your Future' },
        mobileCoachingName: { type: String, default: '' },
        heroAnimatedTexts: [{ type: String }],
        heroTitleLine1: { type: String, default: '' },
        heroTitleLine2: { type: String, default: '' },
        heroBadge: { type: String, default: '#1 Coaching Center in Bangladesh' },
        landingPage: {
            programs: {
                badge: { type: String, default: 'Our Programs' },
                titleLine1: { type: String, default: 'আমাদের' },
                titleLine2: { type: String, default: 'প্রোগ্রামসমূহ' },
                description: { type: String, default: 'আপনার লক্ষ্য অনুযায়ী সেরা প্রোগ্রাম নির্বাচন করুন' }
            },
            whyChooseUs: {
                badge: { type: String, default: 'Why Choose Us' },
                titleLine1: { type: String, default: 'কেন' },
                titleLine2: { type: String, default: 'প্যারাগন?' }
            },
            hallOfFame: {
                badge: { type: String, default: 'Hall of Fame' },
                titleLine1: { type: String, default: 'আমাদের' },
                titleLine2: { type: String, default: 'সফল শিক্ষার্থী' }
            },
            successStories: {
                badge: { type: String, default: 'Success Stories' },
                titleLine1: { type: String, default: 'সফল শিক্ষার্থীদের' },
                titleLine2: { type: String, default: 'মতামত' }
            },
            faculty: {
                badge: { type: String, default: 'Our Team' },
                titleLine1: { type: String, default: 'আমাদের' },
                titleLine2: { type: String, default: 'শিক্ষকমণ্ডলী' }
            }
        },
        logo: {
            url: { type: String },
            publicId: { type: String }
        },
        favicon: {
            url: { type: String },
            publicId: { type: String }
        }
    },

    // Contact information
    contact: {
        phones: [{ type: String }],
        email: { type: String },
        whatsapp: { type: String },
        address: { type: addressSchema, default: () => ({}) },
        officeHours: { type: officeHoursSchema, default: () => ({}) }
    },

    // Theme settings
    theme: { type: themeSchema, default: () => ({}) },

    // SEO settings
    seo: { type: seoSettingsSchema, default: () => ({}) },

    // Social media
    socialMedia: { type: socialMediaSchema, default: () => ({}) },

    // Notification settings
    notifications: { type: notificationSettingsSchema, default: () => ({}) },

    // SMS settings
    smsSettings: { type: smsSettingsSchema, default: () => ({}) },

    // Receipt template
    receiptTemplate: { type: receiptTemplateSchema, default: () => ({}) },

    // Tracking
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
    collection: 'global_settings'
});

// Pre-save middleware
globalSettingsSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Static method to get settings (singleton pattern)
globalSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

// Static method to update settings
globalSettingsSchema.statics.updateSettings = async function (data, userId) {
    let settings = await this.findOne();
    if (!settings) {
        settings = new this(data);
    } else {
        Object.assign(settings, data);
    }
    settings.updatedBy = userId;
    await settings.save();
    return settings;
};

const GlobalSettings = mongoose.model('GlobalSettings', globalSettingsSchema);

module.exports = GlobalSettings;
