/**
 * MktQrVideo Model
 * QR code promotional video campaigns for marketing module
 * Collection: mkt_qr_videos
 */

const mongoose = require('mongoose');

const mktQrVideoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Video title is required'],
        maxlength: 255,
        trim: true
    },
    videoType: {
        type: String,
        enum: ['upload', 'youtube', 'vimeo'],
        default: 'upload'
    },
    videoSource: {
        type: String,
        required: [true, 'Video source is required'],
        maxlength: 500
    },
    videoPublicId: {
        type: String,
        default: ''
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    redirectUrl: {
        type: String,
        maxlength: 500,
        default: '/'
    },
    animationStyle: {
        type: String,
        enum: ['logo', 'confetti', 'ripple', 'zoom'],
        default: 'confetti'
    },
    qrCodeUrl: {
        type: String,
        default: ''
    },
    qrCodePublicId: {
        type: String,
        default: ''
    },
    scanCount: {
        type: Number,
        default: 0
    },
    watchCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'mkt_qr_videos'
});

const MktQrVideo = mongoose.model('MktQrVideo', mktQrVideoSchema);

module.exports = MktQrVideo;
