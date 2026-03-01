/**
 * MktOfferBanner Model
 * Offer/discount scrolling ticker or sticky bar for marketing module
 * Collection: mkt_offer_banners
 */

const mongoose = require('mongoose');

const mktOfferBannerSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Banner text is required'],
        maxlength: 500,
        trim: true
    },
    bannerType: {
        type: String,
        enum: ['ticker', 'sticky_top', 'sticky_bottom'],
        default: 'ticker'
    },
    bgColor: {
        type: String,
        maxlength: 10,
        default: '#ff6b35'
    },
    textColor: {
        type: String,
        maxlength: 10,
        default: '#ffffff'
    },
    linkUrl: {
        type: String,
        maxlength: 500,
        default: ''
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
    collection: 'mkt_offer_banners'
});

const MktOfferBanner = mongoose.model('MktOfferBanner', mktOfferBannerSchema);

module.exports = MktOfferBanner;
