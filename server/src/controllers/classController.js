/**
 * Class Controller
 * Handles class session CRUD operations
 */

const Class = require('../models/Class');
const ScheduleTemplate = require('../models/ScheduleTemplate');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');
const conflictService = require('../services/conflictService');
const notificationService = require('../services/notificationService');

/**
 * Get all classes with filters
 */
exports.getAllClasses = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            class: classFilter,
            section,
            subject,
            instructorId,
            status,
            fromDate,
            toDate,
            search,
            sortBy = 'date',
            sortOrder = 'asc'
        } = req.query;

        const query = {};

        if (classFilter) query.class = classFilter;
        if (section) query.section = section;
        if (subject) query.subject = subject;
        if (instructorId) query.instructorId = instructorId;
        if (status) query.status = status;

        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }

        if (search) {
            query.$text = { $search: search };
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [classes, total] = await Promise.all([
            Class.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('instructorId', 'name email')
                .populate('createdBy', 'name'),
            Class.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                classes,
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
 * Get upcoming classes for students
 */
exports.getUpcomingClasses = async (req, res, next) => {
    try {
        const { class: classFilter, section, limit = 10 } = req.query;

        const query = {
            status: { $in: ['scheduled', 'ongoing'] },
            date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        };

        if (classFilter) query.class = classFilter;
        if (section) query.section = section;

        const classes = await Class.find(query)
            .sort({ date: 1, startTime: 1 })
            .limit(parseInt(limit))
            .select('title subject class section date startTime endTime room meetingLink isOnline instructorName status');

        res.json({
            success: true,
            data: classes
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single class details
 */
exports.getClass = async (req, res, next) => {
    try {
        const classSession = await Class.findById(req.params.id)
            .populate('instructorId', 'name email phone')
            .populate('createdBy', 'name')
            .populate('enrolledStudents', 'name roll');

        if (!classSession) {
            throw new ApiError('Class not found', 404);
        }

        res.json({
            success: true,
            data: classSession
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new class
 */
exports.createClass = async (req, res, next) => {
    try {
        const {
            title,
            subject,
            class: targetClass,
            section,
            instructorId,
            instructorName,
            date,
            startTime,
            endTime,
            room,
            meetingLink,
            isOnline,
            capacity,
            materials,
            prerequisites,
            description,
            checkConflicts = true,
            sendNotification = true
        } = req.body;

        // Check for conflicts if requested
        if (checkConflicts) {
            const conflicts = await conflictService.checkAllConflicts({
                instructorId,
                room,
                class: targetClass,
                section,
                date,
                startTime,
                endTime
            });

            if (conflicts.hasConflicts) {
                return res.status(409).json({
                    success: false,
                    message: 'Schedule conflicts detected',
                    conflicts
                });
            }
        }

        const classSession = await Class.create({
            title,
            subject,
            class: targetClass,
            section,
            instructorId,
            instructorName,
            date,
            startTime,
            endTime,
            room,
            meetingLink,
            isOnline,
            capacity,
            materials,
            prerequisites,
            description,
            createdBy: req.user.id
        });

        // Log audit
        await AuditLog.log({
            action: 'class_created',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'class',
            entityId: classSession._id,
            details: { title, subject, class: targetClass, date },
            ipAddress: req.ip
        });

        // Send notification if enabled
        if (sendNotification) {
            try {
                await notificationService.notifyClassSession(classSession, 'created', {
                    userId: req.user.id
                });
                classSession.notificationsSent.created = true;
                await classSession.save();
            } catch (notifyError) {
                console.error('Failed to send class creation notification:', notifyError);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            data: classSession
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create classes from a template
 */
exports.createFromTemplate = async (req, res, next) => {
    try {
        const { templateId, startDate, endDate, numberOfWeeks, checkConflicts = true } = req.body;

        const template = await ScheduleTemplate.findById(templateId);
        if (!template) {
            throw new ApiError('Template not found', 404);
        }

        // Generate class instances from template
        const classData = template.generateClasses(req.user.id, startDate, endDate);

        // Validate for conflicts if requested
        if (checkConflicts) {
            const validation = await conflictService.validateBatchClasses(classData);
            if (validation.hasAnyConflicts) {
                return res.status(409).json({
                    success: false,
                    message: `${validation.totalConflicts} classes have conflicts`,
                    validation
                });
            }
        }

        // Create all classes
        const createdClasses = await Class.insertMany(classData);

        // Update template with generated class IDs
        template.generatedClasses.push(...createdClasses.map(c => c._id));
        template.lastApplied = new Date();
        await template.save();

        // Log audit
        await AuditLog.log({
            action: 'classes_created_from_template',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'class',
            details: {
                templateId,
                templateName: template.name,
                classCount: createdClasses.length
            },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: `${createdClasses.length} classes created from template`,
            data: {
                template: template.name,
                classesCreated: createdClasses.length,
                classes: createdClasses
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a class
 */
exports.updateClass = async (req, res, next) => {
    try {
        const classSession = await Class.findById(req.params.id);

        if (!classSession) {
            throw new ApiError('Class not found', 404);
        }

        const updateFields = { ...req.body };
        delete updateFields.createdBy;
        delete updateFields.enrolledStudents;
        delete updateFields.enrolledCount;

        // Check for conflicts if schedule is changing
        if (updateFields.date || updateFields.startTime || updateFields.endTime) {
            const conflicts = await conflictService.checkAllConflicts({
                instructorId: updateFields.instructorId || classSession.instructorId,
                room: updateFields.room || classSession.room,
                class: updateFields.class || classSession.class,
                section: updateFields.section || classSession.section,
                date: updateFields.date || classSession.date,
                startTime: updateFields.startTime || classSession.startTime,
                endTime: updateFields.endTime || classSession.endTime
            }, classSession._id, 'class');

            if (conflicts.hasConflicts) {
                return res.status(409).json({
                    success: false,
                    message: 'Schedule conflicts detected',
                    conflicts
                });
            }
        }

        const updatedClass = await Class.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        );

        await AuditLog.log({
            action: 'class_updated',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'class',
            entityId: classSession._id,
            details: { changes: Object.keys(updateFields) },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Class updated successfully',
            data: updatedClass
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reschedule a class
 */
exports.rescheduleClass = async (req, res, next) => {
    try {
        const { date, startTime, endTime, room, notifyStudents = true } = req.body;

        const classSession = await Class.findById(req.params.id);

        if (!classSession) {
            throw new ApiError('Class not found', 404);
        }

        if (classSession.status === 'completed' || classSession.status === 'cancelled') {
            throw new ApiError('Cannot reschedule a completed or cancelled class', 400);
        }

        // Check for conflicts
        const conflicts = await conflictService.checkAllConflicts({
            instructorId: classSession.instructorId,
            room: room || classSession.room,
            class: classSession.class,
            section: classSession.section,
            date,
            startTime,
            endTime
        }, classSession._id, 'class');

        if (conflicts.hasConflicts) {
            return res.status(409).json({
                success: false,
                message: 'Schedule conflicts detected',
                conflicts
            });
        }

        // Store old date for notification
        const oldDate = classSession.date;

        // Update class
        classSession.rescheduledFrom = oldDate;
        classSession.rescheduledTo = new Date(date);
        classSession.date = new Date(date);
        classSession.startTime = startTime;
        classSession.endTime = endTime;
        if (room) classSession.room = room;
        classSession.status = 'rescheduled';
        classSession.notificationsSent.reminder24h = false;
        classSession.notificationsSent.reminder1h = false;

        await classSession.save();

        await AuditLog.log({
            action: 'class_rescheduled',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'class',
            entityId: classSession._id,
            details: {
                from: oldDate,
                to: date,
                startTime,
                endTime
            },
            ipAddress: req.ip
        });

        // Send notification
        if (notifyStudents) {
            try {
                await notificationService.notifyClassSession(classSession, 'rescheduled', {
                    userId: req.user.id
                });
            } catch (notifyError) {
                console.error('Failed to send reschedule notification:', notifyError);
            }
        }

        res.json({
            success: true,
            message: 'Class rescheduled successfully',
            data: classSession
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel a class
 */
exports.cancelClass = async (req, res, next) => {
    try {
        const { reason, notifyStudents = true } = req.body;

        const classSession = await Class.findById(req.params.id);

        if (!classSession) {
            throw new ApiError('Class not found', 404);
        }

        if (classSession.status === 'completed' || classSession.status === 'cancelled') {
            throw new ApiError('Class is already completed or cancelled', 400);
        }

        classSession.status = 'cancelled';
        classSession.cancelReason = reason;
        await classSession.save();

        await AuditLog.log({
            action: 'class_cancelled',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'class',
            entityId: classSession._id,
            details: { reason },
            ipAddress: req.ip
        });

        // Send notification
        if (notifyStudents) {
            try {
                await notificationService.notifyClassSession(classSession, 'cancelled', {
                    userId: req.user.id
                });
            } catch (notifyError) {
                console.error('Failed to send cancellation notification:', notifyError);
            }
        }

        res.json({
            success: true,
            message: 'Class cancelled successfully',
            data: classSession
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a class
 */
exports.deleteClass = async (req, res, next) => {
    try {
        const classSession = await Class.findById(req.params.id);

        if (!classSession) {
            throw new ApiError('Class not found', 404);
        }

        await classSession.deleteOne();

        await AuditLog.log({
            action: 'class_deleted',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'class',
            entityId: classSession._id,
            details: { title: classSession.title },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Class deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add materials to a class
 */
exports.addMaterials = async (req, res, next) => {
    try {
        const { materials } = req.body;

        const classSession = await Class.findById(req.params.id);

        if (!classSession) {
            throw new ApiError('Class not found', 404);
        }

        classSession.materials.push(...materials);
        await classSession.save();

        // Notify students
        try {
            await notificationService.notifyClassSession(classSession, 'materials_added', {
                userId: req.user.id
            });
        } catch (notifyError) {
            console.error('Failed to send materials notification:', notifyError);
        }

        res.json({
            success: true,
            message: 'Materials added successfully',
            data: classSession
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Check conflicts for a proposed schedule
 */
exports.checkConflicts = async (req, res, next) => {
    try {
        const { instructorId, room, class: targetClass, section, date, startTime, endTime, excludeId } = req.body;

        const conflicts = await conflictService.checkAllConflicts({
            instructorId,
            room,
            class: targetClass,
            section,
            date,
            startTime,
            endTime
        }, excludeId, 'class');

        res.json({
            success: true,
            data: conflicts
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get class calendar events (for calendar view)
 */
exports.getCalendarEvents = async (req, res, next) => {
    try {
        const { start, end, class: classFilter, section } = req.query;

        const query = {
            date: {
                $gte: new Date(start),
                $lte: new Date(end)
            }
        };

        if (classFilter) query.class = classFilter;
        if (section) query.section = section;

        const classes = await Class.find(query)
            .select('title subject class section date startTime endTime status room isOnline')
            .lean();

        // Format for calendar
        const events = classes.map(cls => ({
            id: cls._id,
            title: cls.title || cls.subject,
            start: combineDateTime(cls.date, cls.startTime),
            end: combineDateTime(cls.date, cls.endTime),
            backgroundColor: getStatusColor(cls.status),
            extendedProps: {
                type: 'class',
                subject: cls.subject,
                class: cls.class,
                section: cls.section,
                room: cls.room,
                isOnline: cls.isOnline,
                status: cls.status
            }
        }));

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        next(error);
    }
};

// Helper functions
function combineDateTime(date, timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined.toISOString();
}

function getStatusColor(status) {
    const colors = {
        scheduled: '#3788d8',
        ongoing: '#28a745',
        completed: '#6c757d',
        cancelled: '#dc3545',
        rescheduled: '#ffc107'
    };
    return colors[status] || '#3788d8';
}
