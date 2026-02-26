/**
 * Cron Jobs Service
 * Scheduled tasks for notifications and maintenance
 */

const cron = require('node-cron');
const axios = require('axios');
const Class = require('../models/Class');
const Test = require('../models/Test');
const Notification = require('../models/Notification');
const notificationService = require('./notificationService');

let jobs = [];
let keepAliveFailures = 0;
const KEEP_ALIVE_MAX_RETRIES = 3;
const KEEP_ALIVE_JITTER_MS = 60000; // Random delay up to 60 seconds

/**
 * Initialize all cron jobs
 */
function initializeCronJobs() {
    console.log('⏰ Initializing cron jobs...');

    // Run every 15 minutes - check for 24-hour reminders
    if (process.env.REMINDER_24H_ENABLED !== 'false') {
        jobs.push(cron.schedule('*/15 * * * *', async () => {
            await send24HourReminders();
        }));
        console.log('  ✓ 24-hour reminder job scheduled');
    }

    // Run every 5 minutes - check for 1-hour reminders
    if (process.env.REMINDER_1H_ENABLED !== 'false') {
        jobs.push(cron.schedule('*/5 * * * *', async () => {
            await send1HourReminders();
        }));
        console.log('  ✓ 1-hour reminder job scheduled');
    }

    // Run daily at midnight - cleanup old notifications
    jobs.push(cron.schedule('0 0 * * *', async () => {
        await cleanupOldNotifications();
    }));
    console.log('  ✓ Notification cleanup job scheduled');

    // Run every hour - update class statuses
    jobs.push(cron.schedule('0 * * * *', async () => {
        await updateClassStatuses();
    }));
    console.log('  ✓ Class status update job scheduled');

    // Run every hour - process scheduled notifications
    jobs.push(cron.schedule('*/10 * * * *', async () => {
        await processScheduledNotifications();
    }));
    console.log('  ✓ Scheduled notification processor started');

    // Keep-alive self-ping — prevents Render free tier from spinning down
    const renderUrl = process.env.RENDER_EXTERNAL_URL;
    if (renderUrl) {
        jobs.push(cron.schedule('*/13 * * * *', async () => {
            await keepAlivePin(renderUrl);
        }));
        console.log(`  ✓ Keep-alive ping scheduled (target: ${renderUrl})`);
    } else {
        console.log('  ⏭ Keep-alive ping skipped (RENDER_EXTERNAL_URL not set)');
    }

    console.log('⏰ All cron jobs initialized');
}

/**
 * Send 24-hour reminder notifications for upcoming classes and tests
 */
async function send24HourReminders() {
    try {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);

        // Find classes that start in ~24 hours and haven't sent reminder
        const upcomingClasses = await Class.find({
            status: 'scheduled',
            date: {
                $gte: in23Hours,
                $lte: in24Hours
            },
            'notificationsSent.reminder24h': false
        });

        for (const cls of upcomingClasses) {
            try {
                await notificationService.notifyClassSession(cls, 'reminder', {
                    timeUntil: 'in 24 hours'
                });

                await Class.findByIdAndUpdate(cls._id, {
                    'notificationsSent.reminder24h': true
                });

                console.log(`📧 Sent 24h reminder for class: ${cls.title}`);
            } catch (err) {
                console.error(`Failed to send 24h reminder for class ${cls._id}:`, err);
            }
        }

        // Find tests that start in ~24 hours and haven't sent reminder
        const upcomingTests = await Test.find({
            status: 'scheduled',
            date: {
                $gte: in23Hours,
                $lte: in24Hours
            },
            'notificationsSent.reminder24h': false
        });

        for (const test of upcomingTests) {
            try {
                await notificationService.notifyTest(test, 'reminder', {
                    timeUntil: 'in 24 hours'
                });

                await Test.findByIdAndUpdate(test._id, {
                    'notificationsSent.reminder24h': true
                });

                console.log(`📧 Sent 24h reminder for test: ${test.testName}`);
            } catch (err) {
                console.error(`Failed to send 24h reminder for test ${test._id}:`, err);
            }
        }
    } catch (error) {
        console.error('Error in 24-hour reminder job:', error);
    }
}

/**
 * Send 1-hour reminder notifications
 */
async function send1HourReminders() {
    try {
        const now = new Date();
        const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
        const in50Min = new Date(now.getTime() + 50 * 60 * 1000);

        // Find classes that start in ~1 hour and haven't sent reminder
        const upcomingClasses = await Class.find({
            status: 'scheduled',
            date: {
                $gte: new Date(now.setHours(0, 0, 0, 0)),
                $lte: new Date(now.setHours(23, 59, 59, 999))
            },
            'notificationsSent.reminder1h': false
        });

        // Filter by actual start time
        for (const cls of upcomingClasses) {
            const classDateTime = combineDateTime(cls.date, cls.startTime);
            if (classDateTime >= in50Min && classDateTime <= in1Hour) {
                try {
                    await notificationService.notifyClassSession(cls, 'reminder', {
                        timeUntil: 'in 1 hour'
                    });

                    await Class.findByIdAndUpdate(cls._id, {
                        'notificationsSent.reminder1h': true
                    });

                    console.log(`📧 Sent 1h reminder for class: ${cls.title}`);
                } catch (err) {
                    console.error(`Failed to send 1h reminder for class ${cls._id}:`, err);
                }
            }
        }

        // Find tests that start in ~1 hour
        const upcomingTests = await Test.find({
            status: 'scheduled',
            date: {
                $gte: new Date(now.setHours(0, 0, 0, 0)),
                $lte: new Date(now.setHours(23, 59, 59, 999))
            },
            startTime: { $exists: true },
            'notificationsSent.reminder1h': false
        });

        for (const test of upcomingTests) {
            const testDateTime = combineDateTime(test.date, test.startTime);
            if (testDateTime >= in50Min && testDateTime <= in1Hour) {
                try {
                    await notificationService.notifyTest(test, 'reminder', {
                        timeUntil: 'in 1 hour'
                    });

                    await Test.findByIdAndUpdate(test._id, {
                        'notificationsSent.reminder1h': true
                    });

                    console.log(`📧 Sent 1h reminder for test: ${test.testName}`);
                } catch (err) {
                    console.error(`Failed to send 1h reminder for test ${test._id}:`, err);
                }
            }
        }
    } catch (error) {
        console.error('Error in 1-hour reminder job:', error);
    }
}

/**
 * Clean up old notifications (older than 30 days)
 */
async function cleanupOldNotifications() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await Notification.deleteMany({
            createdAt: { $lt: thirtyDaysAgo }
        });

        console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
    } catch (error) {
        console.error('Error cleaning up notifications:', error);
    }
}

/**
 * Update class statuses based on time
 */
async function updateClassStatuses() {
    try {
        const now = new Date();
        const currentDate = new Date(now.toDateString());
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Mark past classes as completed
        const completedResult = await Class.updateMany({
            status: 'scheduled',
            $or: [
                { date: { $lt: currentDate } },
                {
                    date: currentDate,
                    endTime: { $lt: currentTime }
                }
            ]
        }, {
            $set: { status: 'completed' }
        });

        if (completedResult.modifiedCount > 0) {
            console.log(`✅ Marked ${completedResult.modifiedCount} classes as completed`);
        }

        // Mark ongoing classes
        const ongoingResult = await Class.updateMany({
            status: 'scheduled',
            date: currentDate,
            startTime: { $lte: currentTime },
            endTime: { $gt: currentTime }
        }, {
            $set: { status: 'ongoing' }
        });

        if (ongoingResult.modifiedCount > 0) {
            console.log(`🔄 Marked ${ongoingResult.modifiedCount} classes as ongoing`);
        }

        // Same for tests
        await Test.updateMany({
            status: 'scheduled',
            $or: [
                { date: { $lt: currentDate } },
                {
                    date: currentDate,
                    endTime: { $lt: currentTime, $exists: true }
                }
            ]
        }, {
            $set: { status: 'completed' }
        });

    } catch (error) {
        console.error('Error updating class statuses:', error);
    }
}

/**
 * Process scheduled notifications that are due
 */
async function processScheduledNotifications() {
    try {
        const pendingNotifications = await Notification.getPendingScheduled();

        for (const notification of pendingNotifications) {
            try {
                // Mark as sent
                notification.sentAt = new Date();
                notification.isScheduled = false;
                await notification.save();

                // Emit via socket
                const socketService = require('./socketService');
                socketService.emitNotification(notification);

                // Send via push notification
                const pushService = require('./pushService');
                if (pushService.isEnabled()) {
                    pushService.sendPushForNotification(notification).catch(err => {
                        console.error(`[Cron] Failed to send push for scheduled notification ${notification._id}:`, err);
                    });
                }

                // Send SMS if channels metadata indicates it
                if (notification.metadata?.channels?.sms) {
                    const smsService = require('./smsService');
                    const filters = {};
                    if (notification.recipientType === 'class' && notification.recipientClass) {
                        filters.class = notification.recipientClass;
                        if (notification.recipientSection) filters.section = notification.recipientSection;
                    }
                    if (notification.metadata?.studentIds?.length > 0) {
                        filters.studentIds = notification.metadata.studentIds;
                    }
                    const GlobalSettings = require('../models/GlobalSettings');
                    const settings = await GlobalSettings.getSettings();
                    const smsTemplate = settings?.smsSettings?.noticeSmsTemplate || 'Notice: {title} - {message}. Login to portal for details.';
                    const truncatedMsg = notification.message.length > 100 ? notification.message.substring(0, 100) : notification.message;
                    const smsText = smsTemplate
                        .replace(/\{title\}/g, notification.title)
                        .replace(/\{message\}/g, truncatedMsg);
                    smsService.sendCustomSms(
                        filters,
                        smsText,
                        'guardianPhone'
                    ).catch(err => {
                        console.error(`[Cron] Failed to send SMS for scheduled notification ${notification._id}:`, err);
                    });
                }

                console.log(`📤 Processed scheduled notification: ${notification.title}`);
            } catch (err) {
                console.error(`Failed to process scheduled notification ${notification._id}:`, err);
            }
        }
    } catch (error) {
        console.error('Error processing scheduled notifications:', error);
    }
}

/**
 * Keep-alive self-ping to prevent Render free tier spin-down
 * Features: jitter, exponential backoff retry, failure tracking
 */
async function keepAlivePin(baseUrl) {
    // Add random jitter (0 to 60s) to avoid predictable request patterns
    const jitter = Math.floor(Math.random() * KEEP_ALIVE_JITTER_MS);
    await new Promise(resolve => setTimeout(resolve, jitter));

    const healthUrl = `${baseUrl}/api/health`;
    let lastError = null;

    for (let attempt = 1; attempt <= KEEP_ALIVE_MAX_RETRIES; attempt++) {
        try {
            const start = Date.now();
            const response = await axios.get(healthUrl, {
                timeout: 10000, // 10s timeout
                headers: { 'User-Agent': 'PARAGON-KeepAlive/1.0' }
            });
            const duration = Date.now() - start;

            if (response.status === 200) {
                // Reset failure counter on success
                if (keepAliveFailures > 0) {
                    console.log(`🏓 Keep-alive recovered after ${keepAliveFailures} consecutive failure(s)`);
                }
                keepAliveFailures = 0;
                console.log(`🏓 Keep-alive ping successful (${duration}ms, attempt ${attempt}, jitter ${jitter}ms)`);
                return;
            }

            lastError = new Error(`Unexpected status: ${response.status}`);
        } catch (err) {
            lastError = err;
            if (attempt < KEEP_ALIVE_MAX_RETRIES) {
                // Exponential backoff: 2s, 4s before retry
                const backoff = Math.pow(2, attempt) * 1000;
                console.warn(`🏓 Keep-alive attempt ${attempt} failed, retrying in ${backoff}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
            }
        }
    }

    // All retries exhausted
    keepAliveFailures++;
    const errMsg = lastError?.message || 'Unknown error';
    console.error(`🏓 Keep-alive FAILED after ${KEEP_ALIVE_MAX_RETRIES} attempts: ${errMsg}`);

    if (keepAliveFailures >= 3) {
        console.error(`⚠️  WARNING: ${keepAliveFailures} consecutive keep-alive failures — service may spin down!`);
    }
}

/**
 * Combine date and time string into a Date object
 */
function combineDateTime(date, timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
}

/**
 * Stop all cron jobs
 */
function stopAllJobs() {
    jobs.forEach(job => job.stop());
    jobs = [];
    console.log('⏰ All cron jobs stopped');
}

module.exports = {
    initializeCronJobs,
    stopAllJobs,
    // Expose individual functions for testing
    send24HourReminders,
    send1HourReminders,
    cleanupOldNotifications,
    updateClassStatuses,
    processScheduledNotifications,
    keepAlivePin
};
