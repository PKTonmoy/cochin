/**
 * Test Controller
 * Handles test/exam CRUD operations
 */

const Test = require('../models/Test');
const Result = require('../models/Result');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');
const notificationService = require('../services/notificationService');
const { emitToClass } = require('../services/socketService');

/**
 * Get all tests with filters
 */
exports.getAllTests = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            class: classFilter,
            isPublished,
            fromDate,
            toDate,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        const query = {};

        // Role-based filtering
        if (req.user.role === 'student') {
            // Students can only see published tests
            query.isPublished = true;

            // Restrict to student's class
            const student = await Student.findById(req.user.id);
            if (student) {
                query.class = student.class;
            } else {
                // If student not found (shouldn't happen), return empty or error?
                // Returning empty is safer fallback
                return res.json({
                    success: true,
                    data: {
                        tests: [],
                        pagination: { page: 1, limit: parseInt(limit), total: 0, pages: 0 }
                    }
                });
            }
        } else {
            // Admin/Staff can filter by published status
            if (isPublished !== undefined) query.isPublished = isPublished === 'true';
            if (classFilter) query.class = classFilter;
        }

        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [tests, total] = await Promise.all([
            Test.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', 'name email'),
            Test.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                tests,
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
 * Get upcoming tests (public)
 */
exports.getUpcomingTests = async (req, res, next) => {
    try {
        const { class: classFilter } = req.query;

        const query = {
            isPublished: true,
            date: { $gte: new Date() }
        };

        if (classFilter) query.class = classFilter;

        const tests = await Test.find(query)
            .sort({ date: 1 })
            .limit(10)
            .select('testName testCode class date startTime endTime subjects totalMaxMarks');

        res.json({
            success: true,
            data: tests
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single test
 */
exports.getTest = async (req, res, next) => {
    try {
        const test = await Test.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!test) {
            throw new ApiError('Test not found', 404);
        }

        // Get result count
        const resultCount = await Result.countDocuments({ testId: test._id });

        res.json({
            success: true,
            data: {
                test,
                resultCount
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new test
 */
exports.createTest = async (req, res, next) => {
    try {
        const { testName, class: classValue, section, date, subjects, description } = req.body;

        if (!subjects || subjects.length === 0) {
            throw new ApiError('At least one subject is required', 400);
        }

        const test = await Test.create({
            testName,
            class: classValue,
            section,
            date,
            subjects,
            description,
            createdBy: req.user.id
        });

        await AuditLog.log({
            action: 'test_created',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'test',
            entityId: test._id,
            details: { testName, class: classValue },
            ipAddress: req.ip
        });

        // Send notification to students about the new test
        try {
            await notificationService.notifyTest(test, 'created', { userId: req.user.id });
        } catch (err) {
            console.error('[Test] Failed to send test notification:', err.message);
        }

        // Emit real-time update
        emitToClass(classValue, 'schedule-updated', {
            type: 'test_created',
            testId: test._id,
            message: `A new test "${testName}" has been scheduled.`,
            timestamp: new Date()
        }, section);

        res.status(201).json({
            success: true,
            message: 'Test created successfully',
            data: test
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update test
 */
exports.updateTest = async (req, res, next) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            throw new ApiError('Test not found', 404);
        }

        // Check if results exist
        const hasResults = await Result.exists({ testId: test._id });
        if (hasResults && req.body.subjects) {
            // Don't allow changing subjects if results exist
            throw new ApiError('Cannot modify subjects after results have been entered', 400);
        }

        const updateFields = { ...req.body };
        delete updateFields.testCode; // Cannot change test code
        delete updateFields.createdBy;

        const updatedTest = await Test.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        );

        await AuditLog.log({
            action: 'test_updated',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'test',
            entityId: test._id,
            details: { changes: Object.keys(updateFields) },
            ipAddress: req.ip
        });

        // Emit real-time update
        emitToClass(updatedTest.class, 'schedule-updated', {
            type: 'test_updated',
            testId: updatedTest._id,
            message: `Test "${updatedTest.testName}" has been updated.`,
            timestamp: new Date()
        }, updatedTest.section);

        res.json({
            success: true,
            message: 'Test updated successfully',
            data: updatedTest
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete test
 */
exports.deleteTest = async (req, res, next) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            throw new ApiError('Test not found', 404);
        }

        // Delete associated results
        await Result.deleteMany({ testId: test._id });

        await test.deleteOne();

        await AuditLog.log({
            action: 'test_deleted',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'test',
            entityId: test._id,
            details: { testName: test.testName },
            ipAddress: req.ip
        });

        // Emit real-time update
        emitToClass(test.class, 'schedule-updated', {
            type: 'test_deleted',
            testId: test._id,
            message: `Test "${test.testName}" has been removed.`,
            timestamp: new Date()
        }, test.section);

        res.json({
            success: true,
            message: 'Test deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Publish test results
 */
exports.publishTest = async (req, res, next) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            throw new ApiError('Test not found', 404);
        }

        test.isPublished = true;
        test.publishedAt = new Date();
        await test.save();

        // Send notification to students about published results
        try {
            await notificationService.notifyTest(test, 'result_published', { userId: req.user.id });
        } catch (err) {
            console.error('[Test] Failed to send result published notification:', err.message);
        }

        await AuditLog.log({
            action: 'test_published',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'test',
            entityId: test._id,
            details: { testName: test.testName },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Test results published successfully',
            data: test
        });
    } catch (error) {
        next(error);
    }
};
