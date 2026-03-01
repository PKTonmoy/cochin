/**
 * MktSettings Model
 * Singleton model for marketing module master toggle
 * Collection: mkt_settings
 */

const mongoose = require('mongoose');

const mktSettingsSchema = new mongoose.Schema({
    marketingEnabled: {
        type: Boolean,
        default: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    collection: 'mkt_settings'
});

// Pre-save middleware
mktSettingsSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Singleton pattern — get or create
mktSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

// Update settings
mktSettingsSchema.statics.updateSettings = async function (data, userId) {
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

const MktSettings = mongoose.model('MktSettings', mktSettingsSchema);

module.exports = MktSettings;
