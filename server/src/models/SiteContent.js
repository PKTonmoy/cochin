/**
 * SiteContent Model
 * Stores editable content for the website
 */

const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
    sectionKey: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    title: {
        type: String,
        trim: true
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes (sectionKey has unique: true which auto-creates index)
siteContentSchema.index({ isActive: 1 });

const SiteContent = mongoose.model('SiteContent', siteContentSchema);

module.exports = SiteContent;
