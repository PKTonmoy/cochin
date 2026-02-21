/**
 * QRScanEvent Model
 * Tracks each QR code scan for analytics.
 */

const mongoose = require('mongoose');

const qrScanEventSchema = new mongoose.Schema({
    roll: { type: String, trim: true },
    device: { type: String, enum: ['android', 'ios', 'desktop', 'unknown'], default: 'unknown' },
    browser: { type: String, default: '' },
    pwaInstalled: { type: Boolean, default: false },
    guideShown: { type: Boolean, default: false },
    guideCompleted: { type: Boolean, default: false },
    installTriggered: { type: Boolean, default: false },
    source: { type: String, enum: ['qr', 'direct', 'link'], default: 'qr' },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' }
}, {
    timestamps: true
});

// Indexes for analytics queries
qrScanEventSchema.index({ createdAt: -1 });
qrScanEventSchema.index({ device: 1, createdAt: -1 });
qrScanEventSchema.index({ roll: 1 });
qrScanEventSchema.index({ pwaInstalled: 1 });

// Static: get analytics summary
qrScanEventSchema.statics.getAnalytics = async function (period = 'month') {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
    }

    const [totals, deviceBreakdown, dailyScans, hourlyScans] = await Promise.all([
        // Total counts
        this.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    totalScans: { $sum: 1 },
                    pwaInstalled: { $sum: { $cond: ['$pwaInstalled', 1, 0] } },
                    guideShown: { $sum: { $cond: ['$guideShown', 1, 0] } },
                    guideCompleted: { $sum: { $cond: ['$guideCompleted', 1, 0] } },
                    installTriggered: { $sum: { $cond: ['$installTriggered', 1, 0] } }
                }
            }
        ]),

        // Device breakdown
        this.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$device', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),

        // Daily scan counts (last 30 days)
        this.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),

        // Hourly distribution
        this.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ])
    ]);

    const summary = totals[0] || { totalScans: 0, pwaInstalled: 0, guideShown: 0, guideCompleted: 0, installTriggered: 0 };
    const installRate = summary.guideShown > 0 ? Math.round((summary.guideCompleted / summary.guideShown) * 100) : 0;

    return {
        summary: { ...summary, installRate },
        deviceBreakdown,
        dailyScans,
        hourlyScans,
        totalQRGenerated: await this.distinct('roll').then(r => r.length)
    };
};

const QRScanEvent = mongoose.model('QRScanEvent', qrScanEventSchema);

module.exports = QRScanEvent;
