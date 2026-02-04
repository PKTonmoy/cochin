/**
 * Media Model
 * Manages media library files (images, videos, documents)
 */

const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    // File info
    filename: {
        type: String,
        required: [true, 'Filename is required'],
        trim: true
    },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number }, // in bytes
    type: {
        type: String,
        enum: ['image', 'video', 'document', 'other'],
        default: 'image'
    },

    // Cloudinary data
    url: {
        type: String,
        required: [true, 'URL is required']
    },
    publicId: {
        type: String,
        required: [true, 'Public ID is required']
    },
    secureUrl: { type: String },
    thumbnailUrl: { type: String },

    // Image-specific
    width: { type: Number },
    height: { type: Number },
    format: { type: String }, // jpg, png, webp, etc.

    // Metadata
    alt: { type: String },
    title: { type: String },
    description: { type: String },

    // Organization
    folder: { type: String, default: 'general' },
    tags: [{ type: String }],

    // Usage tracking (which entities use this media)
    usedIn: [{
        entityType: { type: String }, // 'course', 'faculty', 'page', etc.
        entityId: { type: mongoose.Schema.Types.ObjectId },
        field: { type: String } // 'image', 'gallery', 'photo', etc.
    }],

    // Tracking
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
mediaSchema.index({ publicId: 1 }, { unique: true });
mediaSchema.index({ type: 1 });
mediaSchema.index({ folder: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ filename: 'text', alt: 'text', title: 'text', tags: 'text' });

// Virtual for formatted size
mediaSchema.virtual('formattedSize').get(function () {
    if (!this.size) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.size) / Math.log(1024));
    return `${(this.size / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
});

// Static method to find by type
mediaSchema.statics.findByType = function (type, options = {}) {
    const { limit = 50, skip = 0, folder } = options;
    const query = { type };
    if (folder) query.folder = folder;

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Static method to search
mediaSchema.statics.search = function (searchTerm, options = {}) {
    const { limit = 50, skip = 0, type } = options;
    const query = { $text: { $search: searchTerm } };
    if (type) query.type = type;

    return this.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit);
};

// Static method to find by folder
mediaSchema.statics.findByFolder = function (folder, options = {}) {
    const { limit = 50, skip = 0 } = options;
    return this.find({ folder })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Static method to get folder list
mediaSchema.statics.getFolders = async function () {
    return this.distinct('folder');
};

// Method to add usage reference
mediaSchema.methods.addUsage = function (entityType, entityId, field) {
    const exists = this.usedIn.some(
        u => u.entityType === entityType &&
            u.entityId.equals(entityId) &&
            u.field === field
    );
    if (!exists) {
        this.usedIn.push({ entityType, entityId, field });
    }
    return this.save();
};

// Method to remove usage reference
mediaSchema.methods.removeUsage = function (entityType, entityId, field) {
    this.usedIn = this.usedIn.filter(
        u => !(u.entityType === entityType &&
            u.entityId.equals(entityId) &&
            u.field === field)
    );
    return this.save();
};

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
