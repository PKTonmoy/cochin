/**
 * Faculty Controller
 * Handles faculty CRUD operations
 */

const Faculty = require('../models/Faculty');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all faculty (admin)
 */
exports.getAllFaculty = async (req, res, next) => {
    try {
        const {
            subject,
            featured,
            isActive,
            search,
            page = 1,
            limit = 20,
            sort = 'displayOrder'
        } = req.query;

        const query = {};

        if (subject) query.subjects = subject;
        if (featured !== undefined) query.featured = featured === 'true';
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [faculty, total] = await Promise.all([
            Faculty.find(query)
                .populate('createdBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Faculty.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: faculty,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single faculty
 */
exports.getFaculty = async (req, res, next) => {
    try {
        const { id } = req.params;

        const faculty = await Faculty.findById(id);

        if (!faculty) {
            throw new ApiError('Faculty not found', 404);
        }

        res.json({
            success: true,
            data: faculty
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get active faculty (public)
 */
exports.getActiveFaculty = async (req, res, next) => {
    try {
        const { subject, featured, limit = 20 } = req.query;

        const query = { isActive: true };
        if (subject) query.subjects = subject;
        if (featured === 'true') query.featured = true;

        const faculty = await Faculty.find(query)
            .sort({ displayOrder: 1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: faculty
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create faculty
 */
exports.createFaculty = async (req, res, next) => {
    try {
        const facultyData = {
            ...req.body,
            createdBy: req.user._id
        };

        const faculty = await Faculty.create(facultyData);

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'create',
            entity: 'faculty',
            entityId: faculty._id,
            details: `Created faculty: ${faculty.name}`,
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            data: faculty,
            message: 'Faculty created successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update faculty
 */
exports.updateFaculty = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const faculty = await Faculty.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!faculty) {
            throw new ApiError('Faculty not found', 404);
        }

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'update',
            entity: 'faculty',
            entityId: faculty._id,
            details: `Updated faculty: ${faculty.name}`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            data: faculty,
            message: 'Faculty updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete faculty
 */
exports.deleteFaculty = async (req, res, next) => {
    try {
        const { id } = req.params;

        const faculty = await Faculty.findByIdAndDelete(id);

        if (!faculty) {
            throw new ApiError('Faculty not found', 404);
        }

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'delete',
            entity: 'faculty',
            entityId: id,
            details: `Deleted faculty: ${faculty.name}`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Faculty deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle faculty active status
 */
exports.toggleActive = async (req, res, next) => {
    try {
        const { id } = req.params;

        const faculty = await Faculty.findById(id);
        if (!faculty) {
            throw new ApiError('Faculty not found', 404);
        }

        faculty.isActive = !faculty.isActive;
        await faculty.save();

        res.json({
            success: true,
            data: faculty,
            message: `Faculty ${faculty.isActive ? 'activated' : 'deactivated'}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reorder faculty
 */
exports.reorderFaculty = async (req, res, next) => {
    try {
        const { items } = req.body; // [{ id, displayOrder }]

        if (!Array.isArray(items)) {
            throw new ApiError('Items must be an array', 400);
        }

        const updates = items.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { displayOrder: item.displayOrder }
            }
        }));

        await Faculty.bulkWrite(updates);

        res.json({
            success: true,
            message: 'Faculty order updated'
        });
    } catch (error) {
        next(error);
    }
};
