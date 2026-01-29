/**
 * Schedule Template Controller
 * Handles recurring schedule template CRUD operations
 */

const ScheduleTemplate = require('../models/ScheduleTemplate');
const Class = require('../models/Class');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');
const conflictService = require('../services/conflictService');

/**
 * Get all templates
 */
exports.getAllTemplates = async (req, res, next) => {
    try {
        const { class: classFilter, subject, isActive } = req.query;

        const query = {};
        if (classFilter) query.class = classFilter;
        if (subject) query.subject = subject;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const templates = await ScheduleTemplate.find(query)
            .sort({ createdAt: -1 })
            .populate('instructorId', 'name email')
            .populate('createdBy', 'name');

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single template
 */
exports.getTemplate = async (req, res, next) => {
    try {
        const template = await ScheduleTemplate.findById(req.params.id)
            .populate('instructorId', 'name email')
            .populate('createdBy', 'name')
            .populate('generatedClasses', 'title date startTime status');

        if (!template) {
            throw new ApiError('Template not found', 404);
        }

        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new template
 */
exports.createTemplate = async (req, res, next) => {
    try {
        const {
            name,
            description,
            subject,
            class: targetClass,
            section,
            instructorId,
            instructorName,
            room,
            meetingLink,
            isOnline,
            capacity,
            recurrencePattern,
            recurrenceDays,
            startTime,
            endTime,
            startDate,
            endDate,
            numberOfWeeks
        } = req.body;

        // Validate recurrence days for weekly pattern
        if (recurrencePattern === 'weekly' && (!recurrenceDays || recurrenceDays.length === 0)) {
            throw new ApiError('Recurrence days are required for weekly pattern', 400);
        }

        const template = await ScheduleTemplate.create({
            name,
            description,
            subject,
            class: targetClass,
            section,
            instructorId,
            instructorName,
            room,
            meetingLink,
            isOnline,
            capacity,
            recurrencePattern,
            recurrenceDays,
            startTime,
            endTime,
            startDate,
            endDate,
            numberOfWeeks,
            createdBy: req.user.id
        });

        await AuditLog.log({
            action: 'template_created',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'schedule_template',
            entityId: template._id,
            details: { name, subject, class: targetClass },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Template created successfully',
            data: template
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a template
 */
exports.updateTemplate = async (req, res, next) => {
    try {
        const template = await ScheduleTemplate.findById(req.params.id);

        if (!template) {
            throw new ApiError('Template not found', 404);
        }

        const updateFields = { ...req.body };
        delete updateFields.createdBy;
        delete updateFields.generatedClasses;

        const updatedTemplate = await ScheduleTemplate.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        );

        await AuditLog.log({
            action: 'template_updated',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'schedule_template',
            entityId: template._id,
            details: { changes: Object.keys(updateFields) },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Template updated successfully',
            data: updatedTemplate
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a template
 */
exports.deleteTemplate = async (req, res, next) => {
    try {
        const template = await ScheduleTemplate.findById(req.params.id);

        if (!template) {
            throw new ApiError('Template not found', 404);
        }

        await template.deleteOne();

        await AuditLog.log({
            action: 'template_deleted',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'schedule_template',
            entityId: template._id,
            details: { name: template.name },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Template deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Preview classes that would be generated from a template
 */
exports.previewTemplate = async (req, res, next) => {
    try {
        const { startDate, endDate, numberOfWeeks } = req.body;

        const template = await ScheduleTemplate.findById(req.params.id);

        if (!template) {
            throw new ApiError('Template not found', 404);
        }

        // Generate preview without saving
        const classData = template.generateClasses(req.user.id, startDate, endDate);

        // Check for conflicts
        const validation = await conflictService.validateBatchClasses(classData);

        res.json({
            success: true,
            data: {
                template: template.name,
                classCount: classData.length,
                classes: classData.map((cls, index) => ({
                    ...cls,
                    conflicts: validation.results[index]?.conflicts || {},
                    batchConflicts: validation.results[index]?.batchConflicts || [],
                    hasConflicts: validation.results[index]?.hasConflicts || false
                })),
                summary: {
                    totalClasses: classData.length,
                    conflictingClasses: validation.totalConflicts,
                    hasAnyConflicts: validation.hasAnyConflicts
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Apply a template (generate classes)
 */
exports.applyTemplate = async (req, res, next) => {
    try {
        const { startDate, endDate, numberOfWeeks, skipConflicts = false } = req.body;

        const template = await ScheduleTemplate.findById(req.params.id);

        if (!template) {
            throw new ApiError('Template not found', 404);
        }

        // Generate class data
        const classData = template.generateClasses(req.user.id, startDate, endDate);

        if (classData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No classes would be generated with the given parameters'
            });
        }

        // Check for conflicts
        const validation = await conflictService.validateBatchClasses(classData);

        if (validation.hasAnyConflicts && !skipConflicts) {
            return res.status(409).json({
                success: false,
                message: `${validation.totalConflicts} classes have scheduling conflicts`,
                data: {
                    validation,
                    conflictingClasses: validation.results
                        .filter(r => r.hasConflicts)
                        .map(r => ({
                            index: r.index,
                            date: r.date,
                            conflicts: r.conflicts,
                            batchConflicts: r.batchConflicts
                        }))
                }
            });
        }

        // Filter out conflicting classes if skipping
        let classesToCreate = classData;
        if (skipConflicts && validation.hasAnyConflicts) {
            const conflictingIndices = new Set(
                validation.results.filter(r => r.hasConflicts).map(r => r.index)
            );
            classesToCreate = classData.filter((_, index) => !conflictingIndices.has(index));
        }

        // Create classes
        const createdClasses = await Class.insertMany(classesToCreate);

        // Update template
        template.generatedClasses.push(...createdClasses.map(c => c._id));
        template.lastApplied = new Date();
        await template.save();

        await AuditLog.log({
            action: 'template_applied',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'schedule_template',
            entityId: template._id,
            details: {
                name: template.name,
                classesCreated: createdClasses.length,
                skippedConflicts: classData.length - classesToCreate.length
            },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: `${createdClasses.length} classes created from template`,
            data: {
                template: template.name,
                classesCreated: createdClasses.length,
                classesSkipped: classData.length - classesToCreate.length,
                classes: createdClasses
            }
        });
    } catch (error) {
        next(error);
    }
};
