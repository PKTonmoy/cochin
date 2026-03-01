/**
 * MktPromoSection Model
 * Homepage promotional content blocks for marketing module
 * Collection: mkt_promo_sections
 */

const mongoose = require('mongoose');

const mktPromoSectionSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: [true, 'Heading is required'],
        maxlength: 255,
        trim: true
    },
    subheading: {
        type: String,
        maxlength: 255,
        default: ''
    },
    body: {
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
    bgColor: {
        type: String,
        maxlength: 10,
        default: '#ffffff'
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
    sortOrder: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'mkt_promo_sections'
});

const MktPromoSection = mongoose.model('MktPromoSection', mktPromoSectionSchema);

module.exports = MktPromoSection;
