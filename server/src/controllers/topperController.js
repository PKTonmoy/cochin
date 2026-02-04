/**
 * Topper Controller
 * Handles results/toppers CRUD operations
 */

const Topper = require('../models/Topper');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all toppers (admin)
 */
exports.getAllToppers = async (req, res, next) => {
    try {
        const {
            exam,
            year,
            featured,
            isActive,
            search,
            page = 1,
            limit = 20,
            sort = '-year'
        } = req.query;

        const query = {};

        if (exam) query.exam = exam;
        if (year) query.year = parseInt(year);
        if (featured !== undefined) query.featured = featured === 'true';
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [toppers, total] = await Promise.all([
            Topper.find(query)
                .populate('course', 'name slug')
                .populate('createdBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Topper.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: toppers,
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
 * Get single topper
 */
exports.getTopper = async (req, res, next) => {
    try {
        const { id } = req.params;

        const topper = await Topper.findById(id)
            .populate('course', 'name slug');

        if (!topper) {
            throw new ApiError('Topper not found', 404);
        }

        res.json({
            success: true,
            data: topper
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get toppers (public)
 */
exports.getPublicToppers = async (req, res, next) => {
    try {
        const { exam, year, featured, limit = 20 } = req.query;

        const query = { isActive: true };
        if (exam) query.exam = exam;
        if (year) query.year = parseInt(year);
        if (featured === 'true') query.featured = true;

        const toppers = await Topper.find(query)
            .populate('course', 'name slug')
            .sort({ displayOrder: 1, year: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: toppers
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get toppers for homepage
 */
exports.getHomepageToppers = async (req, res, next) => {
    try {
        const { limit = 3 } = req.query;
        const toppers = await Topper.findForHomepage(parseInt(limit));

        res.json({
            success: true,
            data: toppers
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create topper
 */
exports.createTopper = async (req, res, next) => {
    try {
        const topperData = {
            ...req.body,
            createdBy: req.user._id
        };

        const topper = await Topper.create(topperData);

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'create',
            entity: 'topper',
            entityId: topper._id,
            details: `Created topper: ${topper.studentName}`,
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            data: topper,
            message: 'Topper created successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update topper
 */
exports.updateTopper = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const topper = await Topper.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        }).populate('course', 'name slug');

        if (!topper) {
            throw new ApiError('Topper not found', 404);
        }

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'update',
            entity: 'topper',
            entityId: topper._id,
            details: `Updated topper: ${topper.studentName}`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            data: topper,
            message: 'Topper updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete topper
 */
exports.deleteTopper = async (req, res, next) => {
    try {
        const { id } = req.params;

        const topper = await Topper.findByIdAndDelete(id);

        if (!topper) {
            throw new ApiError('Topper not found', 404);
        }

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'delete',
            entity: 'topper',
            entityId: id,
            details: `Deleted topper: ${topper.studentName}`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Topper deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Bulk create toppers
 */
exports.bulkCreate = async (req, res, next) => {
    try {
        const { toppers } = req.body;

        if (!Array.isArray(toppers) || toppers.length === 0) {
            throw new ApiError('Toppers array is required', 400);
        }

        const toppersData = toppers.map(t => ({
            ...t,
            createdBy: req.user._id
        }));

        const created = await Topper.insertMany(toppersData, { ordered: false });

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'bulk_create',
            entity: 'topper',
            details: `Bulk created ${created.length} toppers`,
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            data: created,
            message: `${created.length} toppers created successfully`
        });
    } catch (error) {
        if (error.name === 'BulkWriteError') {
            // Handle partial success
            res.status(207).json({
                success: false,
                message: 'Some toppers could not be created',
                errors: error.writeErrors?.map(e => e.errmsg)
            });
        } else {
            next(error);
        }
    }
};

/**
 * Get available years
 */
exports.getYears = async (req, res, next) => {
    try {
        const years = await Topper.distinct('year', { isActive: true });
        years.sort((a, b) => b - a); // Descending

        res.json({
            success: true,
            data: years
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get stats
 */
exports.getStats = async (req, res, next) => {
    try {
        const [total, byExam, byYear] = await Promise.all([
            Topper.countDocuments({ isActive: true }),
            Topper.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$exam', count: { $sum: 1 } } }
            ]),
            Topper.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$year', count: { $sum: 1 } } },
                { $sort: { _id: -1 } },
                { $limit: 5 }
            ])
        ]);

        res.json({
            success: true,
            data: {
                total,
                byExam: byExam.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                byYear
            }
        });
    } catch (error) {
        next(error);
    }
};
