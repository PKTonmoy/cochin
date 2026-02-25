/**
 * Push Notification Service
 * Web Push API integration using VAPID keys
 * Sends push notifications to student devices via service worker
 */

const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const Student = require('../models/Student');
const GlobalSettings = require('../models/GlobalSettings');

// ─── VAPID Configuration ────────────────────────────────────────
let isConfigured = false;

function configure() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@example.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn('[Push] ⚠️  VAPID keys not configured. Push notifications disabled.');
        console.warn('[Push] Run: node src/scripts/generateVapidKeys.js');
        return;
    }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    isConfigured = true;
    console.log('[Push] ✅ Web Push configured with VAPID keys');
}

// Auto-configure on first require
configure();

/**
 * Check if push service is ready
 */
function isEnabled() {
    return isConfigured;
}

/**
 * Get the VAPID public key (needed by clients to subscribe)
 */
function getVapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY || null;
}

/**
 * Build the push notification payload
 */
function buildPayload(notification, settings) {
    const siteName = settings?.siteInfo?.name || 'PARAGON';
    const siteLogo = settings?.siteInfo?.logo?.url || '/icons/icon-192x192.png';
    const siteFavicon = settings?.siteInfo?.favicon?.url || siteLogo || '/icons/icon-96x96.png';

    return JSON.stringify({
        title: `${siteName}: ${notification.title || 'New Notification'}`,
        body: notification.message || 'You have a new notification',
        icon: siteLogo,
        badge: siteFavicon,
        tag: notification.tag || `notification-${notification._id || Date.now()}`,
        renotify: notification.priority === 'urgent' || notification.priority === 'high',
        requireInteraction: notification.priority === 'urgent',
        vibrate: notification.priority === 'urgent'
            ? [200, 100, 200, 100, 200]
            : [100, 50, 100],
        data: {
            url: notification.actionUrl || '/student/notices',
            notificationId: notification._id,
            type: notification.type,
            priority: notification.priority
        },
        actions: [
            { action: 'view', title: 'View Details' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    });
}

/**
 * Send push notification to a single subscription
 * Returns true if successful, false if subscription is invalid
 */
async function sendToSubscription(subscription, payload) {
    try {
        await webpush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                }
            },
            payload,
            { TTL: 86400 } // 24 hours
        );
        return { success: true, endpoint: subscription.endpoint };
    } catch (error) {
        // 410 Gone or 404 = subscription expired/invalid → remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[Push] 🗑️  Removing expired subscription: ${subscription.endpoint.substring(0, 50)}...`);
            await PushSubscription.removeByEndpoint(subscription.endpoint);
            return { success: false, endpoint: subscription.endpoint, reason: 'expired' };
        }
        console.error(`[Push] ❌ Failed to send push:`, error.message);
        return { success: false, endpoint: subscription.endpoint, reason: error.message };
    }
}

/**
 * Send push notification to a specific student (all their devices)
 */
async function sendPushToStudent(studentId, notification) {
    if (!isConfigured) return { sent: 0, failed: 0 };

    const subscriptions = await PushSubscription.getForStudent(studentId);
    if (subscriptions.length === 0) return { sent: 0, failed: 0 };

    const settings = await GlobalSettings.getSettings();
    const payload = buildPayload(notification, settings);
    const results = await Promise.all(
        subscriptions.map(sub => sendToSubscription(sub, payload))
    );

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (sent > 0) {
        console.log(`[Push] 📱 Sent ${sent} push(es) to student ${studentId}`);
    }

    return { sent, failed };
}

/**
 * Send push notification to all students in a class
 */
async function sendPushToClass(className, section, notification) {
    if (!isConfigured) return { sent: 0, failed: 0, students: 0 };

    // Find all active students in the class
    const query = { class: className, status: 'active' };
    if (section) query.section = section;

    const students = await Student.find(query).select('_id');
    if (students.length === 0) return { sent: 0, failed: 0, students: 0 };

    const studentIds = students.map(s => s._id);
    const subscriptions = await PushSubscription.getForStudents(studentIds);
    if (subscriptions.length === 0) return { sent: 0, failed: 0, students: students.length };

    const settings = await GlobalSettings.getSettings();
    const payload = buildPayload(notification, settings);
    const results = await Promise.all(
        subscriptions.map(sub => sendToSubscription(sub, payload))
    );

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[Push] 📱 Sent ${sent} push(es) to class ${className}${section ? ` section ${section}` : ''}`);

    return { sent, failed, students: students.length };
}

/**
 * Send push notification to all students
 */
async function sendPushToAll(notification) {
    if (!isConfigured) return { sent: 0, failed: 0 };

    const subscriptions = await PushSubscription.find({ isActive: true });
    if (subscriptions.length === 0) return { sent: 0, failed: 0 };

    const settings = await GlobalSettings.getSettings();
    const payload = buildPayload(notification, settings);

    // Process in batches of 50 to avoid overwhelming the push service
    const BATCH_SIZE = 50;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
        const batch = subscriptions.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
            batch.map(sub => sendToSubscription(sub, payload))
        );

        totalSent += results.filter(r => r.success).length;
        totalFailed += results.filter(r => !r.success).length;
    }

    console.log(`[Push] 📱 Broadcast: ${totalSent} sent, ${totalFailed} failed out of ${subscriptions.length}`);

    return { sent: totalSent, failed: totalFailed };
}

/**
 * Send push based on notification recipient type
 * Convenience method called from notificationService
 */
async function sendPushForNotification(notification) {
    if (!isConfigured) return { sent: 0, failed: 0 };

    try {
        switch (notification.recipientType) {
            case 'student':
                return await sendPushToStudent(notification.recipientId, notification);
            case 'class':
                return await sendPushToClass(
                    notification.recipientClass,
                    notification.recipientSection,
                    notification
                );
            case 'all':
                return await sendPushToAll(notification);
            default:
                return { sent: 0, failed: 0 };
        }
    } catch (error) {
        console.error('[Push] Error sending push for notification:', error);
        return { sent: 0, failed: 0, error: error.message };
    }
}

/**
 * Save or update a push subscription for a student
 */
async function saveSubscription(studentId, subscription, userAgent) {
    return PushSubscription.upsertSubscription(studentId, subscription, userAgent);
}

/**
 * Remove a push subscription
 */
async function removeSubscription(endpoint) {
    return PushSubscription.removeByEndpoint(endpoint);
}

/**
 * Get subscription stats
 */
async function getStats() {
    const [total, active] = await Promise.all([
        PushSubscription.countDocuments(),
        PushSubscription.countDocuments({ isActive: true })
    ]);
    return { total, active, configured: isConfigured };
}

module.exports = {
    isEnabled,
    getVapidPublicKey,
    sendPushToStudent,
    sendPushToClass,
    sendPushToAll,
    sendPushForNotification,
    saveSubscription,
    removeSubscription,
    getStats
};
