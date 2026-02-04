/**
 * Course Controller
 * Handles course CRUD operations
 */

const Course = require('../models/Course');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all courses (admin)
 */
exports.getAllCourses = async (req, res, next) => {
    try {
        const {
            category,
            status,
            featured,
            search,
            page = 1,
            limit = 20,
            sort = '-createdAt'
        } = req.query;

        const query = {};

        if (category) query.category = category;
        if (status) query.status = status;
        if (featured !== undefined) query.featured = featured === 'true';
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [courses, total] = await Promise.all([
            Course.find(query)
                .populate('faculty', 'name designation photo')
                .populate('createdBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Course.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: courses,
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
 * Get single course by slug or ID
 */
exports.getCourse = async (req, res, next) => {
    try {
        const { identifier } = req.params;

        let course;
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            course = await Course.findById(identifier)
                .populate('faculty', 'name designation photo subjects');
        } else {
            course = await Course.findOne({ slug: identifier })
                .populate('faculty', 'name designation photo subjects');
        }

        if (!course) {
            throw new ApiError('Course not found', 404);
        }

        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get published courses (public)
 */
exports.getPublishedCourses = async (req, res, next) => {
    try {
        const { category, featured, limit = 20 } = req.query;

        const query = { status: 'published' };
        if (category) query.category = category;
        if (featured === 'true') query.featured = true;

        const courses = await Course.find(query)
            .populate('faculty', 'name designation photo')
            .sort({ displayOrder: 1, createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: courses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new course
 */
exports.createCourse = async (req, res, next) => {
    try {
        const courseData = {
            ...req.body,
            createdBy: req.user._id,
            lastEditedBy: req.user._id
        };

        // Generate slug if not provided
        if (!courseData.slug && courseData.name) {
            courseData.slug = courseData.name
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
        }

        // Check for duplicate slug
        const existing = await Course.findOne({ slug: courseData.slug });
        if (existing) {
            courseData.slug = `${courseData.slug}-${Date.now()}`;
        }

        const course = await Course.create(courseData);

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'create',
            entity: 'course',
            entityId: course._id,
            details: `Created course: ${course.name}`,
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            data: course,
            message: 'Course created successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update course
 */
exports.updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = {
            ...req.body,
            lastEditedBy: req.user._id
        };

        const course = await Course.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        }).populate('faculty', 'name designation photo');

        if (!course) {
            throw new ApiError('Course not found', 404);
        }

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'update',
            entity: 'course',
            entityId: course._id,
            details: `Updated course: ${course.name}`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            data: course,
            message: 'Course updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete course
 */
exports.deleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findByIdAndDelete(id);

        if (!course) {
            throw new ApiError('Course not found', 404);
        }

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'delete',
            entity: 'course',
            entityId: id,
            details: `Deleted course: ${course.name}`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get featured courses
 */
exports.getFeaturedCourses = async (req, res, next) => {
    try {
        const { limit = 6 } = req.query;
        const courses = await Course.findFeatured(parseInt(limit));

        res.json({
            success: true,
            data: courses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle course status
 */
exports.toggleStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['draft', 'published', 'archived'].includes(status)) {
            throw new ApiError('Invalid status', 400);
        }

        const course = await Course.findByIdAndUpdate(
            id,
            { status, lastEditedBy: req.user._id },
            { new: true }
        );

        if (!course) {
            throw new ApiError('Course not found', 404);
        }

        res.json({
            success: true,
            data: course,
            message: `Course ${status}`
        });
    } catch (error) {
        next(error);
    }
};
