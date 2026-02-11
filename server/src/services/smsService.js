/**
 * SMS Service
 * BulkSMSBD.net API integration with queue and retry logic
 */

const axios = require('axios');
const SmsLog = require('../models/SmsLog');
const GlobalSettings = require('../models/GlobalSettings');
const Student = require('../models/Student');
const Result = require('../models/Result');
const Test = require('../models/Test');

const BULKSMSBD_API_URL = 'https://bulksmsbd.net/api/smsapi';
const BULKSMSBD_BALANCE_URL = 'https://bulksmsbd.net/api/getBalanceApi';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 10000]; // Exponential backoff
const SEND_DELAY_MS = 200; // Delay between individual sends for rate limiting
const MAX_CONCURRENT = 5; // Max concurrent API calls

/**
 * Get SMS settings from GlobalSettings
 */
async function getSmsSettings() {
    const settingsRaw = await GlobalSettings.getSettings();
    const settings = settingsRaw.toObject();
    const dbSmsSettings = settings.smsSettings || {};

    return {
        ...dbSmsSettings,
        // Environment variables take precedence for credentials
        apiKey: process.env.BULKSMSBD_API_KEY || dbSmsSettings.apiKey,
        senderId: process.env.BULKSMSBD_SENDER_ID || dbSmsSettings.senderId
    };
}

/**
 * Check if SMS service is enabled
 */
async function isEnabled() {
    const settings = await getSmsSettings();
    return settings.enabled && settings.apiKey && settings.senderId;
}

/**
 * Send a single SMS via BulkSMSBD API
 */
async function sendSms(phone, message, logData = {}) {
    const settings = await getSmsSettings();

    if (!settings.enabled) {
        console.log('[SMS] Service disabled, skipping SMS to', phone);
        return { success: false, reason: 'SMS service disabled' };
    }

    if (!settings.apiKey || !settings.senderId) {
        console.log('[SMS] Missing API credentials');
        return { success: false, reason: 'Missing API credentials' };
    }

    // Normalize phone number (ensure it starts with 880 or 01)
    let normalizedPhone = phone.replace(/[^0-9]/g, '');
    if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '88' + normalizedPhone;
    } else if (!normalizedPhone.startsWith('880')) {
        normalizedPhone = '880' + normalizedPhone;
    }

    // Create log entry
    const smsLog = await SmsLog.create({
        recipientName: logData.recipientName || '',
        phone: normalizedPhone,
        message,
        type: logData.type || 'custom_sms',
        status: 'queued',
        testId: logData.testId,
        studentId: logData.studentId,
        sentBy: logData.sentBy
    });

    try {
        const response = await axios.get(BULKSMSBD_API_URL, {
            params: {
                api_key: settings.apiKey,
                type: 'text',
                number: normalizedPhone,
                senderid: settings.senderId,
                message: message
            },
            timeout: 15000
        });

        const responseData = response.data;

        // BulkSMSBD returns 202 for success
        if (responseData?.response_code === 202 || responseData?.success === true || response.status === 200) {
            smsLog.status = 'sent';
            smsLog.apiResponse = responseData;
            smsLog.sentAt = new Date();
            await smsLog.save();

            console.log(`[SMS] ✅ Sent to ${normalizedPhone}`);
            return { success: true, logId: smsLog._id, response: responseData };
        } else {
            smsLog.status = 'failed';
            smsLog.apiResponse = responseData;
            smsLog.errorMessage = responseData?.error_message || responseData?.message || 'Unknown API error';
            await smsLog.save();

            console.log(`[SMS] ❌ Failed to ${normalizedPhone}: ${smsLog.errorMessage}`);
            return { success: false, logId: smsLog._id, error: smsLog.errorMessage };
        }
    } catch (error) {
        smsLog.status = 'failed';
        smsLog.errorMessage = error.message;
        smsLog.apiResponse = error.response?.data || null;
        await smsLog.save();

        console.error(`[SMS] ❌ Error sending to ${normalizedPhone}:`, error.message);
        return { success: false, logId: smsLog._id, error: error.message };
    }
}

/**
 * Retry failed SMS
 */
async function retrySms(smsLogId) {
    const smsLog = await SmsLog.findById(smsLogId);
    if (!smsLog || smsLog.status !== 'failed' || smsLog.retryCount >= MAX_RETRIES) {
        return { success: false, reason: 'Cannot retry' };
    }

    const settings = await getSmsSettings();
    if (!settings.enabled || !settings.apiKey || !settings.senderId) {
        return { success: false, reason: 'SMS service not configured' };
    }

    const retryDelay = RETRY_DELAYS[smsLog.retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    smsLog.retryCount += 1;

    try {
        const response = await axios.get(BULKSMSBD_API_URL, {
            params: {
                api_key: settings.apiKey,
                type: 'text',
                number: smsLog.phone,
                senderid: settings.senderId,
                message: smsLog.message
            },
            timeout: 15000
        });

        const responseData = response.data;

        if (responseData?.response_code === 202 || responseData?.success === true || response.status === 200) {
            smsLog.status = 'sent';
            smsLog.apiResponse = responseData;
            smsLog.sentAt = new Date();
            await smsLog.save();
            return { success: true };
        } else {
            smsLog.apiResponse = responseData;
            smsLog.errorMessage = responseData?.error_message || 'Retry failed';
            await smsLog.save();
            return { success: false, error: smsLog.errorMessage };
        }
    } catch (error) {
        smsLog.errorMessage = error.message;
        smsLog.apiResponse = error.response?.data || null;
        await smsLog.save();
        return { success: false, error: error.message };
    }
}

/**
 * Build result SMS message from template
 */
function buildResultMessage(template, data) {
    return template
        .replace(/{studentName}/g, data.studentName || '')
        .replace(/{testName}/g, data.testName || '')
        .replace(/{score}/g, data.score || '0')
        .replace(/{total}/g, data.total || '0')
        .replace(/{highest}/g, data.highest || '0')
        .replace(/{website}/g, data.website || '')
        .replace(/{percentage}/g, data.percentage || '0')
        .replace(/{grade}/g, data.grade || '')
        .replace(/{rank}/g, data.rank || '');
}

/**
 * Process a batch of SMS with concurrency control and rate limiting
 */
async function processSmsQueue(smsItems) {
    const results = { sent: 0, failed: 0, total: smsItems.length };

    // Process in chunks of MAX_CONCURRENT
    for (let i = 0; i < smsItems.length; i += MAX_CONCURRENT) {
        const chunk = smsItems.slice(i, i + MAX_CONCURRENT);

        const promises = chunk.map(item =>
            sendSms(item.phone, item.message, item.logData)
                .then(result => {
                    if (result.success) results.sent++;
                    else results.failed++;
                    return result;
                })
                .catch(err => {
                    results.failed++;
                    console.error('[SMS Queue] Error:', err.message);
                    return { success: false, error: err.message };
                })
        );

        await Promise.all(promises);

        // Rate limiting delay between chunks
        if (i + MAX_CONCURRENT < smsItems.length) {
            await new Promise(resolve => setTimeout(resolve, SEND_DELAY_MS * MAX_CONCURRENT));
        }
    }

    return results;
}

/**
 * Send bulk result SMS for a test
 * Sends to guardian phone numbers of all students who have results
 */
async function sendBulkResultSms(testId, sentBy = null) {
    const enabled = await isEnabled();
    if (!enabled) {
        console.log('[SMS] Service not enabled/configured, skipping bulk result SMS');
        return { success: false, reason: 'SMS service not enabled' };
    }

    const settings = await getSmsSettings();
    const test = await Test.findById(testId);
    if (!test) {
        return { success: false, reason: 'Test not found' };
    }

    // Get all results for this test (non-absent students only)
    const results = await Result.find({ testId, isAbsent: { $ne: true } })
        .setOptions({ skipPopulate: true })
        .populate('studentId', 'name guardianPhone phone roll');

    if (results.length === 0) {
        return { success: false, reason: 'No results found' };
    }

    // Check for existing sent logs to avoid duplicates
    const sentLogs = await SmsLog.find({
        testId,
        type: 'result_sms',
        status: 'sent'
    }).select('studentId');

    const sentStudentIds = new Set(sentLogs.map(log => log.studentId.toString()));

    // Filter results to only include students who haven't received SMS yet
    const newResults = results.filter(r => r.studentId && !sentStudentIds.has(r.studentId._id.toString()));

    if (newResults.length === 0) {
        console.log(`[SMS] All ${results.length} students have already received SMS for test "${test.testName}"`);
        return { success: true, message: 'All students already notified' };
    }

    console.log(`[SMS] Found ${newResults.length} new results to notify (out of ${results.length} total)`);

    // Use newResults for calculation (or should we use all for highest score? Highest score should be based on ALL results)
    // Calculate highest score from ALL results
    const highestScore = Math.max(...results.map(r => r.totalMarks));

    // Build SMS queue using newResults
    const smsItems = [];
    for (const result of newResults) {
        const student = result.studentId;
        if (!student || !student.guardianPhone) {
            console.log(`[SMS] Skipping student ${result.roll} - no guardian phone`);
            continue;
        }

        const template = settings.resultSmsTemplate ||
            'Dear {studentName}, Your {testName} result: {score}/{total}. Highest Score: {highest}. Visit {website} for details. - PARAGON';

        const message = buildResultMessage(template, {
            studentName: student.name,
            testName: test.testName,
            score: result.totalMarks,
            total: result.maxMarks,
            highest: highestScore,
            website: settings.websiteUrl || '',
            percentage: result.percentage,
            grade: result.grade,
            rank: result.rank
        });

        smsItems.push({
            phone: student.guardianPhone,
            message,
            logData: {
                recipientName: student.name,
                type: 'result_sms',
                testId: test._id,
                studentId: student._id,
                sentBy
            }
        });
    }

    if (smsItems.length === 0) {
        return { success: false, reason: 'No valid phone numbers found' };
    }

    console.log(`[SMS] Queuing ${smsItems.length} result SMS for test "${test.testName}"`);

    // Process queue asynchronously
    const queueResults = await processSmsQueue(smsItems);

    console.log(`[SMS] Bulk result SMS complete: ${queueResults.sent} sent, ${queueResults.failed} failed out of ${queueResults.total}`);

    // Retry failed ones
    if (queueResults.failed > 0) {
        const failedLogs = await SmsLog.find({
            testId,
            type: 'result_sms',
            status: 'failed',
            retryCount: { $lt: MAX_RETRIES },
            createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
        });

        for (const log of failedLogs) {
            await retrySms(log._id);
        }
    }

    return {
        success: true,
        results: queueResults
    };
}

/**
 * Send custom SMS to filtered students
 */
async function sendCustomSms(filters, message, phoneField = 'guardianPhone', sentBy = null) {
    const enabled = await isEnabled();
    if (!enabled) {
        return { success: false, reason: 'SMS service not enabled' };
    }

    // Build student query from filters
    const query = { status: 'active' };

    if (filters.class) query.class = filters.class;
    if (filters.section) query.section = filters.section;
    if (filters.group) query.group = filters.group;
    if (filters.roll) query.roll = filters.roll;
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
    if (filters.studentIds && filters.studentIds.length > 0) {
        const mongoose = require('mongoose');
        query._id = { $in: filters.studentIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const students = await Student.find(query).select('name phone guardianPhone roll class section');

    if (students.length === 0) {
        return { success: false, reason: 'No students matching filters' };
    }

    const smsItems = students
        .filter(s => s[phoneField])
        .map(s => ({
            phone: s[phoneField],
            message,
            logData: {
                recipientName: s.name,
                type: 'custom_sms',
                studentId: s._id,
                sentBy
            }
        }));

    if (smsItems.length === 0) {
        return { success: false, reason: 'No valid phone numbers found' };
    }

    console.log(`[SMS] Sending custom SMS to ${smsItems.length} students`);

    const queueResults = await processSmsQueue(smsItems);

    return {
        success: true,
        results: queueResults
    };
}

/**
 * Check BulkSMSBD API credit balance
 */
async function checkBalance() {
    const settings = await getSmsSettings();
    if (!settings.apiKey) {
        return { success: false, reason: 'No API key configured' };
    }

    try {
        const response = await axios.get(BULKSMSBD_BALANCE_URL, {
            params: { api_key: settings.apiKey },
            timeout: 10000
        });

        return {
            success: true,
            balance: response.data?.balance || response.data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get SMS statistics
 */
async function getStats() {
    const [total, sent, failed, queued, todaySent, todayFailed] = await Promise.all([
        SmsLog.countDocuments(),
        SmsLog.countDocuments({ status: 'sent' }),
        SmsLog.countDocuments({ status: 'failed' }),
        SmsLog.countDocuments({ status: 'queued' }),
        SmsLog.countDocuments({
            status: 'sent',
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        SmsLog.countDocuments({
            status: 'failed',
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        })
    ]);

    return { total, sent, failed, queued, todaySent, todayFailed };
}

module.exports = {
    sendSms,
    sendBulkResultSms,
    sendCustomSms,
    checkBalance,
    getStats,
    isEnabled,
    getSmsSettings,
    retrySms
};
