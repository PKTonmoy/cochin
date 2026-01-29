/**
 * ContentBlock Model
 * Stores reusable content block templates for the CMS
 */

const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['header', 'content', 'media', 'cta', 'social', 'form', 'special'],
        default: 'content'
    },
    type: {
        type: String,
        required: true,
        enum: ['hero', 'text', 'image', 'cardGrid', 'gallery', 'testimonial', 'cta', 'form', 'statistics', 'custom']
    },
    description: {
        type: String,
        trim: true
    },
    thumbnail: {
        type: String // Cloudinary URL for preview image
    },
    template: {
        content: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        styles: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        animation: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    usageCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
contentBlockSchema.index({ category: 1, isActive: 1 });
contentBlockSchema.index({ type: 1 });
contentBlockSchema.index({ isDefault: 1 });

// Static method to get default blocks
contentBlockSchema.statics.getDefaults = function () {
    return this.find({ isDefault: true, isActive: true }).sort({ category: 1, name: 1 });
};

// Static method to increment usage count
contentBlockSchema.statics.incrementUsage = function (blockId) {
    return this.findByIdAndUpdate(blockId, { $inc: { usageCount: 1 } });
};

const ContentBlock = mongoose.model('ContentBlock', contentBlockSchema);

module.exports = ContentBlock;
