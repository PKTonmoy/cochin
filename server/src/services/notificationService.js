/**
 * Notification Service
 * Create and send notifications via database, Socket.io, and email
 */

const Notification = require('../models/Notification');
const Student = require('../models/Student');
const User = require('../models/User');
const socketService = require('./socketService');
const pushService = require('./pushService');
const nodemailer = require('nodemailer');

// Email transporter (lazy initialization)
let transporter = null;

/**
 * Initialize email transporter
 */
function getTransporter() {
    if (!transporter && process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return transporter;
}

/**
 * Create and send a notification
 */
async function createNotification(notificationData, options = {}) {
    const {
        sendEmail = true,
        sendSocket = true,
        sendPush = true,
        saveToDb = true
    } = options;

    try {
        let notification;

        // Save to database
        if (saveToDb) {
            notification = await Notification.create(notificationData);
        } else {
            notification = new Notification(notificationData);
        }

        // Send via Socket.io
        if (sendSocket) {
            socketService.emitNotification(notification);
        }

        // Send via Web Push
        if (sendPush && pushService.isEnabled()) {
            pushService.sendPushForNotification(notification).catch(err => {
                console.error('Failed to send push notification:', err);
            });
        }

        // Send email if enabled and applicable
        if (sendEmail && shouldSendEmail(notification)) {
            queueEmail(notification).catch(err => {
                console.error('Failed to queue notification email:', err);
            });
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

/**
 * Determine if email should be sent for this notification type
 */
function shouldSendEmail(notification) {
    const emailTypes = [
        'class_cancelled',
        'class_rescheduled',
        'test_cancelled',
        'test_rescheduled',
        'result_published',
        'payment_reminder'
    ];

    return emailTypes.includes(notification.type) && process.env.NOTIFICATION_EMAIL_ENABLED === 'true';
}

/**
 * Queue email for sending
 */
async function queueEmail(notification) {
    const transport = getTransporter();
    if (!transport) {
        console.log('Email transporter not configured, skipping email');
        return;
    }

    try {
        let recipientEmail = null;

        // Get recipient email
        if (notification.recipientType === 'student') {
            const student = await Student.findById(notification.recipientId).select('email name');
            if (student && student.email) {
                recipientEmail = student.email;
            }
        } else if (notification.recipientType === 'user') {
            const user = await User.findById(notification.recipientId).select('email name');
            if (user && user.email) {
                recipientEmail = user.email;
            }
        }

        if (!recipientEmail) {
            return; // No email to send to
        }

        // Send email
        await transport.sendMail({
            from: process.env.EMAIL_FROM || 'PARAGON <noreply@paragon.com>',
            to: recipientEmail,
            subject: notification.title,
            html: generateEmailHtml(notification)
        });

        // Update notification record
        await Notification.findByIdAndUpdate(notification._id, {
            emailSent: true,
            emailSentAt: new Date()
        });
    } catch (error) {
        console.error('Failed to send notification email:', error);
        await Notification.findByIdAndUpdate(notification._id, {
            emailError: error.message
        });
    }
}

/**
 * Generate HTML email content
 */
function generateEmailHtml(notification) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .priority-urgent { border-left: 4px solid #e74c3c; }
                .priority-high { border-left: 4px solid #f39c12; }
                .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>PARAGON Coaching Center</h1>
                </div>
                <div class="content ${notification.priority === 'urgent' ? 'priority-urgent' : notification.priority === 'high' ? 'priority-high' : ''}">
                    <h2>${notification.title}</h2>
                    <p>${notification.message}</p>
                    ${notification.actionUrl ? `<p><a href="${notification.actionUrl}">Click here for more details</a></p>` : ''}
                </div>
                <div class="footer">
                    <p>This is an automated message from PARAGON Coaching Center.</p>
                    <p>Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Notify all students in a class about a class session
 */
async function notifyClassSession(classSession, type, additionalData = {}) {
    const notificationTypes = {
        created: {
            title: `New Class Scheduled: ${classSession.subject}`,
            message: `A new ${classSession.subject} class has been scheduled for ${formatDate(classSession.date)} at ${classSession.startTime}.`,
            type: 'class_scheduled'
        },
        cancelled: {
            title: `Class Cancelled: ${classSession.subject}`,
            message: `The ${classSession.subject} class scheduled for ${formatDate(classSession.date)} has been cancelled. ${classSession.cancelReason ? `Reason: ${classSession.cancelReason}` : ''}`,
            type: 'class_cancelled',
            priority: 'high'
        },
        rescheduled: {
            title: `Class Rescheduled: ${classSession.subject}`,
            message: `The ${classSession.subject} class has been rescheduled from ${formatDate(classSession.rescheduledFrom)} to ${formatDate(classSession.date)} at ${classSession.startTime}.`,
            type: 'class_rescheduled',
            priority: 'high'
        },
        reminder: {
            title: `Reminder: ${classSession.subject} Class`,
            message: `Your ${classSession.subject} class is starting ${additionalData.timeUntil || 'soon'}. ${classSession.isOnline ? `Join link: ${classSession.meetingLink}` : `Room: ${classSession.room}`}`,
            type: 'class_reminder'
        },
        materials_added: {
            title: `New Materials: ${classSession.subject}`,
            message: `New study materials have been added for your ${classSession.subject} class.`,
            type: 'class_materials_added'
        }
    };

    const config = notificationTypes[type];
    if (!config) {
        throw new Error(`Unknown notification type: ${type}`);
    }

    const notification = await createNotification({
        recipientType: 'class',
        recipientClass: classSession.class,
        recipientSection: classSession.section,
        type: config.type,
        priority: config.priority || 'normal',
        title: config.title,
        message: config.message,
        relatedEntityType: 'class',
        relatedEntityId: classSession._id,
        actionUrl: `/student/schedule`,
        createdBy: additionalData.userId
    });

    // Also emit schedule update
    socketService.emitScheduleUpdate(
        type,
        'class',
        classSession,
        classSession.class,
        classSession.section
    );

    return notification;
}

/**
 * Notify students about a test
 */
async function notifyTest(test, type, additionalData = {}) {
    const notificationTypes = {
        created: {
            title: `New Test Scheduled: ${test.testName}`,
            message: `A new test "${test.testName}" has been scheduled for ${formatDate(test.date)}${test.startTime ? ` at ${test.startTime}` : ''}.`,
            type: 'test_scheduled'
        },
        cancelled: {
            title: `Test Cancelled: ${test.testName}`,
            message: `The test "${test.testName}" scheduled for ${formatDate(test.date)} has been cancelled. ${test.cancelReason ? `Reason: ${test.cancelReason}` : ''}`,
            type: 'test_cancelled',
            priority: 'high'
        },
        rescheduled: {
            title: `Test Rescheduled: ${test.testName}`,
            message: `The test "${test.testName}" has been rescheduled to ${formatDate(test.date)}${test.startTime ? ` at ${test.startTime}` : ''}.`,
            type: 'test_rescheduled',
            priority: 'high'
        },
        reminder: {
            title: `Reminder: ${test.testName}`,
            message: `Your test "${test.testName}" is coming up ${additionalData.timeUntil || 'soon'}. Make sure to prepare!`,
            type: 'test_reminder'
        },
        result_published: {
            title: `Results Published: ${test.testName}`,
            message: `Results for "${test.testName}" have been published. Check your results now!`,
            type: 'result_published'
        }
    };

    const config = notificationTypes[type];
    if (!config) {
        throw new Error(`Unknown notification type: ${type}`);
    }

    const notification = await createNotification({
        recipientType: 'class',
        recipientClass: test.class,
        recipientSection: test.section,
        type: config.type,
        priority: config.priority || 'normal',
        title: config.title,
        message: config.message,
        relatedEntityType: 'test',
        relatedEntityId: test._id,
        actionUrl: type === 'result_published' ? '/student/results' : '/student/schedule',
        createdBy: additionalData.userId
    });

    // Also emit schedule update
    socketService.emitScheduleUpdate(
        type,
        'test',
        test,
        test.class,
        test.section
    );

    return notification;
}

/**
 * Create notification for a specific student
 */
async function notifyStudent(studentId, type, title, message, options = {}) {
    return createNotification({
        recipientType: 'student',
        recipientId: studentId,
        recipientModel: 'Student',
        type,
        priority: options.priority || 'normal',
        title,
        message,
        relatedEntityType: options.relatedEntityType,
        relatedEntityId: options.relatedEntityId,
        actionUrl: options.actionUrl,
        createdBy: options.userId
    }, options);
}

/**
 * Create notification for a specific user (admin/staff)
 */
async function notifyUser(userId, type, title, message, options = {}) {
    return createNotification({
        recipientType: 'user',
        recipientId: userId,
        recipientModel: 'User',
        type,
        priority: options.priority || 'normal',
        title,
        message,
        relatedEntityType: options.relatedEntityType,
        relatedEntityId: options.relatedEntityId,
        actionUrl: options.actionUrl,
        createdBy: options.userId
    }, options);
}

/**
 * Format date for display
 */
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Get unread notification count for a recipient
 */
async function getUnreadCount(recipientId, recipientType = 'student') {
    return Notification.getUnreadCount(recipientId, recipientType);
}

/**
 * Mark notifications as read
 */
async function markAsRead(notificationIds, recipientId) {
    return Notification.markMultipleAsRead(notificationIds, recipientId);
}

module.exports = {
    createNotification,
    notifyClassSession,
    notifyTest,
    notifyStudent,
    notifyUser,
    getUnreadCount,
    markAsRead,
    queueEmail
};
