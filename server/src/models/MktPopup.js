/**
 * MktPopup Model
 * Pop-up banner configuration for marketing module
 * Collection: mkt_popups
 */

const mongoose = require('mongoose');

const mktPopupSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Popup title is required'],
        maxlength: 255,
        trim: true
    },
    content: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        default: ''
    },
    imagePublicId: {
        type: String,
        default: ''
    },
    ctaLabel: {
        type: String,
        maxlength: 100,
        default: ''
    },
    ctaUrl: {
        type: String,
        maxlength: 500,
        default: ''
    },
    displayFrequency: {
        type: String,
        enum: ['always', 'session', 'daily'],
        default: 'always'
    },
    delaySeconds: {
        type: Number,
        default: 3,
        min: 0
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'mkt_popups'
});

const MktPopup = mongoose.model('MktPopup', mktPopupSchema);

module.exports = MktPopup;
