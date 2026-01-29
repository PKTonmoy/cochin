/**
 * Page Model
 * Stores CMS pages with sections, versioning, and publishing
 */

const mongoose = require('mongoose');

// Section styles schema
const stylesSchema = new mongoose.Schema({
    backgroundColor: { type: String, default: 'transparent' },
    backgroundImage: { type: String },
    backgroundGradient: { type: String },
    padding: {
        top: { type: String, default: '40px' },
        bottom: { type: String, default: '40px' },
        left: { type: String, default: '20px' },
        right: { type: String, default: '20px' }
    },
    margin: {
        top: { type: String, default: '0' },
        bottom: { type: String, default: '0' }
    },
    borderRadius: { type: String, default: '0' },
    boxShadow: { type: String },
    maxWidth: { type: String, default: '1200px' },
    textAlign: { type: String, default: 'left' },
    minHeight: { type: String }
}, { _id: false });

// Section schema
const sectionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['hero', 'text', 'image', 'cardGrid', 'gallery', 'testimonial', 'cta', 'form', 'statistics', 'custom']
    },
    order: {
        type: Number,
        default: 0
    },
    visible: {
        type: Boolean,
        default: true
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    styles: {
        type: stylesSchema,
        default: () => ({})
    },
    animation: {
        entrance: { type: String, default: 'none' },
        duration: { type: String, default: '0.5s' },
        delay: { type: String, default: '0s' }
    },
    responsive: {
        hideOnMobile: { type: Boolean, default: false },
        hideOnTablet: { type: Boolean, default: false },
        hideOnDesktop: { type: Boolean, default: false }
    }
}, { _id: false });

// Version schema for history
const versionSchema = new mongoose.Schema({
    versionNumber: {
        type: Number,
        required: true
    },
    savedAt: {
        type: Date,
        default: Date.now
    },
    savedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sections: [sectionSchema],
    note: { type: String }
}, { _id: true });

// SEO schema
const seoSchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String, maxlength: 160 },
    keywords: [{ type: String }],
    ogImage: { type: String },
    canonicalUrl: { type: String },
    noIndex: { type: Boolean, default: false }
}, { _id: false });

// Main Page schema
const pageSchema = new mongoose.Schema({
    pageName: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'scheduled'],
        default: 'draft'
    },
    template: {
        type: String,
        enum: ['landing', 'content', 'custom'],
        default: 'content'
    },
    sections: [sectionSchema],

    // Global page settings
    settings: {
        header: {
            visible: { type: Boolean, default: true },
            style: { type: String, default: 'sticky' }
        },
        footer: {
            visible: { type: Boolean, default: true }
        },
        theme: {
            primaryColor: { type: String, default: '#dc2626' },
            secondaryColor: { type: String, default: '#1f2937' },
            fontFamily: { type: String, default: 'Inter, sans-serif' }
        },
        customCSS: { type: String }
    },

    // Version control
    versions: [versionSchema],
    currentVersion: {
        type: Number,
        default: 1
    },

    // Publishing
    publishedAt: { type: Date },
    scheduledPublishAt: { type: Date },
    publishedSections: [sectionSchema], // Snapshot of published content

    // Preview
    previewToken: { type: String },
    previewTokenExpiry: { type: Date },

    // SEO
    seo: {
        type: seoSchema,
        default: () => ({})
    },

    // Tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastEditedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
pageSchema.index({ slug: 1 });
pageSchema.index({ status: 1 });
pageSchema.index({ createdBy: 1 });
pageSchema.index({ 'sections.type': 1 });

// Pre-save middleware to update lastEditedAt
pageSchema.pre('save', function (next) {
    this.lastEditedAt = new Date();
    next();
});

// Method to create a version snapshot
pageSchema.methods.createVersion = function (userId, note = '') {
    const versionNumber = this.currentVersion;
    this.versions.push({
        versionNumber,
        savedBy: userId,
        sections: JSON.parse(JSON.stringify(this.sections)),
        note
    });
    this.currentVersion += 1;

    // Keep only last 50 versions
    if (this.versions.length > 50) {
        this.versions = this.versions.slice(-50);
    }
};

// Method to publish the page
pageSchema.methods.publish = function () {
    this.status = 'published';
    this.publishedAt = new Date();
    this.publishedSections = JSON.parse(JSON.stringify(this.sections));
    this.scheduledPublishAt = null;
};

// Method to generate preview token
pageSchema.methods.generatePreviewToken = function () {
    const crypto = require('crypto');
    this.previewToken = crypto.randomBytes(32).toString('hex');
    this.previewTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return this.previewToken;
};

// Static method to find published page by slug
pageSchema.statics.findPublished = function (slug) {
    return this.findOne({
        slug: slug.toLowerCase(),
        status: 'published'
    }).select('pageName slug publishedSections seo settings publishedAt');
};

const Page = mongoose.model('Page', pageSchema);

module.exports = Page;
