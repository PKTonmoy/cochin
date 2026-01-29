/**
 * Model Index
 * Export all models from a single entry point
 */

const User = require('./User');
const Student = require('./Student');
const Payment = require('./Payment');
const Test = require('./Test');
const Result = require('./Result');
const UploadBatch = require('./UploadBatch');
const SiteContent = require('./SiteContent');
const AuditLog = require('./AuditLog');
const Schedule = require('./Schedule');
const Attendance = require('./Attendance');
const Class = require('./Class');
const Notification = require('./Notification');
const ScheduleTemplate = require('./ScheduleTemplate');
const Page = require('./Page');
const ContentBlock = require('./ContentBlock');

module.exports = {
    User,
    Student,
    Payment,
    Test,
    Result,
    UploadBatch,
    SiteContent,
    AuditLog,
    Schedule,
    Attendance,
    Class,
    Notification,
    ScheduleTemplate,
    Page,
    ContentBlock
};
