/**
 * Testimonial Controller
 * Handles testimonial CRUD operations
 */

const Testimonial = require('../models/Testimonial');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all testimonials (admin)
 */
exports.getAllTestimonials = async (req, res, next) => {
    try {
        const {
            course,
            featured,
            isActive,
            rating,
            search,
            page = 1,
            limit = 20,
            sort = '-createdAt'
        } = req.query;

        const query = {};

        if (course) query.course = course;
        if (featured !== undefined) query.featured = featured === 'true';
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (rating) query.rating = parseInt(rating);
        if (search) {
            query.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { quote: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [testimonials, total] = await Promise.all([
            Testimonial.find(query)
                .populate('course', 'name slug')
                .populate('createdBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Testimonial.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: testimonials,
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
 * Get single testimonial
 */
exports.getTestimonial = async (req, res, next) => {
    try {
        const { id } = req.params;

        const testimonial = await Testimonial.findById(id)
            .populate('course', 'name slug');

        if (!testimonial) {
            throw new ApiError('Testimonial not found', 404);
        }

        res.json({
            success: true,
            data: testimonial
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get active testimonials (public)
 */
exports.getActiveTestimonials = async (req, res, next) => {
    try {
        const { course, featured, limit = 20 } = req.query;

        const query = { isActive: true };
        if (course) query.course = course;
        if (featured === 'true') query.featured = true;

        const testimonials = await Testimonial.find(query)
            .populate('course', 'name slug')
            .sort({ displayOrder: 1, rating: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: testimonials
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get homepage testimonials
 */
exports.getHomepageTestimonials = async (req, res, next) => {
    try {
        const { limit = 4 } = req.query;
        const testimonials = await Testimonial.findForHomepage(parseInt(limit));

        res.json({
            success: true,
            data: testimonials
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create testimonial
 */
exports.createTestimonial = async (req, res, next) => {
    try {
        const testimonialData = {
            ...req.body,
            createdBy: req.user._id
        };

        const testimonial = await Testimonial.create(testimonialData);

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'create',
            entity: 'testimonial',
            entityId: testimonial._id,
            details: `Created testimonial by: ${testimonial.studentName}`,
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            data: testimonial,
            message: 'Testimonial created successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update testimonial
 */
exports.updateTestimonial = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const testimonial = await Testimonial.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        }).populate('course', 'name slug');

        if (!testimonial) {
            throw new ApiError('Testimonial not found', 404);
        }

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'update',
            entity: 'testimonial',
            entityId: testimonial._id,
            details: `Updated testimonial by: ${testimonial.studentName}`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            data: testimonial,
            message: 'Testimonial updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete testimonial
 */
exports.deleteTestimonial = async (req, res, next) => {
    try {
        const { id } = req.params;

        const testimonial = await Testimonial.findByIdAndDelete(id);

        if (!testimonial) {
            throw new ApiError('Testimonial not found', 404);
        }

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'delete',
            entity: 'testimonial',
            entityId: id,
            details: `Deleted testimonial by: ${testimonial.studentName}`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Testimonial deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle testimonial active status
 */
exports.toggleActive = async (req, res, next) => {
    try {
        const { id } = req.params;

        const testimonial = await Testimonial.findById(id);
        if (!testimonial) {
            throw new ApiError('Testimonial not found', 404);
        }

        testimonial.isActive = !testimonial.isActive;
        await testimonial.save();

        res.json({
            success: true,
            data: testimonial,
            message: `Testimonial ${testimonial.isActive ? 'activated' : 'deactivated'}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reorder testimonials
 */
exports.reorderTestimonials = async (req, res, next) => {
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

        await Testimonial.bulkWrite(updates);

        res.json({
            success: true,
            message: 'Testimonials order updated'
        });
    } catch (error) {
        next(error);
    }
};
