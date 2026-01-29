/**
 * AuditLog Model
 * Tracks all important actions for accountability
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'user_login',
            'user_logout',
            'user_created',
            'user_updated',
            'user_deleted',
            'student_created',
            'student_updated',
            'student_deleted',
            'student_activated',
            'student_suspended',
            'payment_created',
            'payment_verified',
            'payment_updated',
            'receipt_generated',
            'receipt_emailed',
            'test_created',
            'test_updated',
            'test_deleted',
            'test_published',
            'results_imported',
            'results_rollback',
            'results_exported',
            'site_content_updated',
            'password_reset',
            'password_reset',
            'password_changed',
            'attendance_marked',
            'attendance_deleted'
        ]
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    userRole: {
        type: String,
        enum: ['admin', 'staff', 'student']
    },
    entityType: {
        type: String,
        enum: ['user', 'student', 'payment', 'test', 'result', 'upload_batch', 'site_content', 'attendance']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for faster queries
// Action filtering
auditLogSchema.index({ action: 1 }); // Filter by action type
auditLogSchema.index({ action: 1, createdAt: -1 }); // Actions sorted by date

// User activity tracking
auditLogSchema.index({ userId: 1 }); // All logs for a user
auditLogSchema.index({ userId: 1, createdAt: -1 }); // User's recent activity
auditLogSchema.index({ userId: 1, action: 1 }); // User's specific actions
auditLogSchema.index({ userRole: 1, createdAt: -1 }); // Logs by role

// Entity tracking
auditLogSchema.index({ entityType: 1, entityId: 1 }); // Logs for specific entity
auditLogSchema.index({ entityType: 1, createdAt: -1 }); // Entity type logs by date
auditLogSchema.index({ entityId: 1 }); // All logs for an entity

// Date-based queries (most important for audit logs)
auditLogSchema.index({ createdAt: -1 }); // Recent logs

// Compound index for dashboard/reports
auditLogSchema.index({ action: 1, entityType: 1, createdAt: -1 }); // Filtered reports

// Optional: TTL index to auto-expire old logs (uncomment if needed)
// auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year

/**
 * Create audit log entry
 * @param {Object} data - Log data
 */
auditLogSchema.statics.log = async function (data) {
    try {
        return await this.create(data);
    } catch (error) {
        console.error('Audit log error:', error);
        // Don't throw - audit logging should not break the main flow
    }
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
