/**
 * QR Code Controller
 * Generate QR codes, track scans, and look up students.
 */

const QRCode = require('qrcode');
const QRScanEvent = require('../models/QRScanEvent');
const PWASettings = require('../models/PWASettings');
const Student = require('../models/Student');

/**
 * Generate a single QR code (admin)
 * POST /api/qr/generate
 * Body: { roll, baseUrl? }
 */
exports.generateQR = async (req, res, next) => {
    try {
        const { roll, baseUrl, isGlobal } = req.body;
        if (!isGlobal && !roll) {
            return res.status(400).json({ success: false, message: 'Roll number is required for student QR' });
        }

        const settings = await PWASettings.getSettings();
        const base = baseUrl || settings.qrSettings?.baseUrl || `${req.protocol}://${req.get('host')}`;
        const path = settings.qrSettings?.landingPagePath || '/portal-entry';
        const param = settings.qrSettings?.rollParamName || 'roll';
        const url = isGlobal
            ? `${base}${path}`
            : `${base}${path}?${param}=${encodeURIComponent(roll)}`;

        // QR style from settings
        const style = settings.qrSettings?.style || {};
        const sizeMap = { small: 200, medium: 300, large: 400 };
        const width = sizeMap[style.size] || 300;

        const qrDataUrl = await QRCode.toDataURL(url, {
            width,
            margin: 2,
            color: {
                dark: style.foregroundColor || '#1e293b',
                light: style.backgroundColor || '#ffffff'
            },
            errorCorrectionLevel: style.errorCorrectionLevel || 'M'
        });

        // Also get student name for preview
        let studentName = '';
        try {
            const student = await Student.findOne({ roll }).select('name');
            if (student) studentName = student.name;
        } catch (e) { /* ignore */ }

        res.json({
            success: true,
            data: {
                qrImage: qrDataUrl,
                url,
                roll,
                studentName,
                width
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Bulk generate QR codes (admin)
 * POST /api/qr/bulk
 * Body: { rolls: ['12345', '12346', ...] }
 */
exports.bulkGenerateQR = async (req, res, next) => {
    try {
        const { rolls } = req.body;
        if (!rolls || !Array.isArray(rolls) || rolls.length === 0) {
            return res.status(400).json({ success: false, message: 'Array of roll numbers is required' });
        }

        if (rolls.length > 200) {
            return res.status(400).json({ success: false, message: 'Maximum 200 QR codes per batch' });
        }

        const settings = await PWASettings.getSettings();
        const base = settings.qrSettings?.baseUrl || `${req.protocol}://${req.get('host')}`;
        const path = settings.qrSettings?.landingPagePath || '/portal-entry';
        const param = settings.qrSettings?.rollParamName || 'roll';
        const style = settings.qrSettings?.style || {};
        const sizeMap = { small: 200, medium: 300, large: 400 };
        const width = sizeMap[style.size] || 300;

        // Look up student names
        const students = await Student.find({ roll: { $in: rolls } }).select('roll name');
        const nameMap = {};
        students.forEach(s => { nameMap[s.roll] = s.name; });

        const results = await Promise.all(
            rolls.map(async (roll) => {
                const url = `${base}${path}?${param}=${encodeURIComponent(roll)}`;
                const qrImage = await QRCode.toDataURL(url, {
                    width,
                    margin: 2,
                    color: {
                        dark: style.foregroundColor || '#1e293b',
                        light: style.backgroundColor || '#ffffff'
                    },
                    errorCorrectionLevel: style.errorCorrectionLevel || 'M'
                });
                return {
                    roll,
                    studentName: nameMap[roll] || '',
                    qrImage,
                    url
                };
            })
        );

        res.json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

/**
 * Track a QR scan event (public — no auth)
 * POST /api/qr/track-scan
 * Body: { roll, device, browser, pwaInstalled, guideShown, guideCompleted, installTriggered, source }
 */
exports.trackScan = async (req, res, next) => {
    try {
        const event = new QRScanEvent({
            ...req.body,
            userAgent: req.headers['user-agent'] || '',
            ip: req.ip
        });
        await event.save();
        res.json({ success: true });
    } catch (error) {
        // Don't fail the user experience for analytics errors
        console.error('Error tracking QR scan:', error);
        res.json({ success: true });
    }
};

/**
 * Get student info for QR preview (admin)
 * GET /api/qr/student/:roll
 */
exports.getStudentForQR = async (req, res, next) => {
    try {
        const student = await Student.findOne({ roll: req.params.roll }).select('name roll class section group phone');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, data: student });
    } catch (error) {
        next(error);
    }
};
