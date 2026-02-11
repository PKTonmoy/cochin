/**
 * SMS Controller
 * Admin endpoints for SMS management
 */

const SmsLog = require('../models/SmsLog');
const Student = require('../models/Student');
const smsService = require('../services/smsService');
const { ApiError } = require('../middleware/errorHandler');
const AuditLog = require('../models/AuditLog');

/**
 * Send custom SMS to filtered students
 */
exports.sendCustomSms = async (req, res, next) => {
    try {
        const { filters, message, phoneField = 'guardianPhone' } = req.body;

        if (!message || !message.trim()) {
            throw new ApiError('Message is required', 400);
        }

        if (!['phone', 'guardianPhone'].includes(phoneField)) {
            throw new ApiError('Invalid phone field', 400);
        }

        // Verify SMS is enabled
        const enabled = await smsService.isEnabled();
        if (!enabled) {
            throw new ApiError('SMS service is not enabled or not configured. Please configure API key and Sender ID in Settings.', 400);
        }

        const result = await smsService.sendCustomSms(
            filters || {},
            message.trim(),
            phoneField,
            req.user.id
        );

        await AuditLog.log({
            action: 'sms_custom_sent',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'sms',
            details: {
                filters,
                phoneField,
                messageLength: message.length,
                result
            },
            ipAddress: req.ip
        });

        res.json({
            success: result.success,
            message: result.success
                ? `SMS sent: ${result.results.sent} delivered, ${result.results.failed} failed`
                : result.reason,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Manually trigger result SMS for a test
 */
exports.sendResultSms = async (req, res, next) => {
    try {
        const { testId } = req.params;

        const enabled = await smsService.isEnabled();
        if (!enabled) {
            throw new ApiError('SMS service is not enabled or not configured', 400);
        }

        const result = await smsService.sendBulkResultSms(testId, req.user.id);

        await AuditLog.log({
            action: 'sms_result_sent',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'sms',
            entityId: testId,
            details: result,
            ipAddress: req.ip
        });

        res.json({
            success: result.success,
            message: result.success
                ? `Result SMS: ${result.results.sent} sent, ${result.results.failed} failed`
                : result.reason,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get SMS logs with pagination and filters
 */
exports.getLogs = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 25,
            type,
            status,
            testId,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        if (type) query.type = type;
        if (status) query.status = status;
        if (testId) query.testId = testId;
        if (search) {
            query.$or = [
                { recipientName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [logs, total] = await Promise.all([
            SmsLog.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('testId', 'testName testCode')
                .populate('studentId', 'name roll class')
                .populate('sentBy', 'name')
                .lean(),
            SmsLog.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get SMS statistics
 */
exports.getStats = async (req, res, next) => {
    try {
        const stats = await smsService.getStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Check BulkSMSBD balance
 */
exports.getBalance = async (req, res, next) => {
    try {
        const result = await smsService.checkBalance();

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get filtered student count (preview before sending)
 */
exports.getRecipientCount = async (req, res, next) => {
    try {
        const { filters, phoneField = 'guardianPhone' } = req.body;

        const query = { status: 'active' };
        if (filters?.class) query.class = filters.class;
        if (filters?.section) query.section = filters.section;
        if (filters?.group) query.group = filters.group;
        if (filters?.roll) query.roll = filters.roll;
        if (filters?.name) query.name = { $regex: filters.name, $options: 'i' };

        const students = await Student.find(query).select(`name roll class section ${phoneField}`);
        const withPhone = students.filter(s => s[phoneField]);

        res.json({
            success: true,
            data: {
                totalMatched: students.length,
                withPhone: withPhone.length,
                withoutPhone: students.length - withPhone.length
            }
        });
    } catch (error) {
        next(error);
    }
};
