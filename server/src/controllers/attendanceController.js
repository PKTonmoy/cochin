/**
 * Attendance Controller
 * Handles attendance marking and retrieval
 */

const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Test = require('../models/Test');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Mark attendance for multiple students (bulk)
 */
exports.markAttendance = async (req, res, next) => {
    try {
        const { type, testId, date, class: classValue, section, students } = req.body;

        if (!type || !date || !classValue || !students || !Array.isArray(students)) {
            throw new ApiError('Missing required fields', 400);
        }

        if (type === 'test' && !testId) {
            throw new ApiError('Test ID is required for test attendance', 400);
        }

        const results = { created: 0, updated: 0 };

        for (const student of students) {
            const { studentId, status } = student;

            // Build query to find existing attendance
            const query = {
                studentId,
                type,
                date: new Date(date)
            };
            if (type === 'test') {
                query.testId = testId;
            }

            // Check if attendance already exists
            const existing = await Attendance.findOne(query);

            if (existing) {
                existing.status = status;
                existing.markedBy = req.user.id;
                await existing.save();
                results.updated++;
            } else {
                await Attendance.create({
                    studentId,
                    type,
                    testId: type === 'test' ? testId : undefined,
                    date: new Date(date),
                    class: classValue,
                    section,
                    status,
                    markedBy: req.user.id
                });
                results.created++;
            }
        }

        await AuditLog.log({
            action: 'attendance_marked',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'attendance',
            details: { type, date, class: classValue, ...results },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: `Attendance marked: ${results.created} new, ${results.updated} updated`,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get attendance with filters
 */
exports.getAttendance = async (req, res, next) => {
    try {
        const {
            type,
            date,
            class: classFilter,
            section,
            testId,
            page = 1,
            limit = 100
        } = req.query;

        const query = {};

        if (type) query.type = type;
        if (date) query.date = new Date(date);
        if (classFilter) query.class = classFilter;
        if (section) query.section = section;
        if (testId) query.testId = testId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [attendance, total] = await Promise.all([
            Attendance.find(query)
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('studentId', 'roll name class section photo')
                .populate('testId', 'testName testCode date')
                .populate('markedBy', 'name'),
            Attendance.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                attendance,
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
 * Get attendance for a specific test (returns attended student IDs)
 */
exports.getTestAttendees = async (req, res, next) => {
    try {
        const { testId } = req.params;

        const test = await Test.findById(testId);
        if (!test) {
            throw new ApiError('Test not found', 404);
        }

        const attendance = await Attendance.find({
            testId,
            type: 'test',
            status: { $in: ['present', 'late'] }
        }).populate('studentId', 'roll name class section photo');

        res.json({
            success: true,
            data: {
                test: {
                    _id: test._id,
                    testName: test.testName,
                    testCode: test.testCode,
                    date: test.date
                },
                attendees: attendance
                    .filter(a => a.studentId) // Filter out records where student might be deleted
                    .map(a => ({
                        ...a.studentId.toJSON(),
                        attendanceStatus: a.status
                    })),
                totalAttended: attendance.length
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get student's attendance history
 */
exports.getStudentAttendance = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { type, limit = 50 } = req.query;

        // Authorization check for students
        if (req.user.role === 'student') {
            const student = await Student.findById(studentId);
            if (!student || student.roll !== req.user.roll) {
                throw new ApiError('Not authorized', 403);
            }
        }

        const query = { studentId };
        if (type) query.type = type;

        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit))
            .populate('testId', 'testName testCode date class');

        // Calculate summary
        const summary = {
            totalClasses: attendance.filter(a => a.type === 'class').length,
            presentClasses: attendance.filter(a => a.type === 'class' && a.status === 'present').length,
            totalTests: attendance.filter(a => a.type === 'test').length,
            presentTests: attendance.filter(a => a.type === 'test' && a.status === 'present').length
        };

        res.json({
            success: true,
            data: {
                attendance,
                summary
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Check if student attended a specific test
 */
exports.checkTestAttendance = async (req, res, next) => {
    try {
        const { testId, studentId } = req.params;

        const attendance = await Attendance.findOne({
            testId,
            studentId,
            type: 'test'
        });

        res.json({
            success: true,
            data: {
                attended: attendance?.status === 'present' || attendance?.status === 'late',
                status: attendance?.status || 'not_marked'
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete attendance record
 */
exports.deleteAttendance = async (req, res, next) => {
    try {
        const { id } = req.params;

        const attendance = await Attendance.findByIdAndDelete(id);

        if (!attendance) {
            throw new ApiError('Attendance record not found', 404);
        }

        res.json({
            success: true,
            message: 'Attendance record deleted'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get attendance history summary (aggregated by date/class/test)
 */
exports.getAttendanceHistory = async (req, res, next) => {
    try {
        const history = await Attendance.aggregate([
            {
                $group: {
                    _id: {
                        date: "$date",
                        class: "$class",
                        type: "$type",
                        testId: "$testId"
                    },
                    totalStudents: { $sum: 1 },
                    present: {
                        $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
                    },
                    absent: {
                        $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id.date": -1 } },
            {
                $lookup: {
                    from: "tests",
                    localField: "_id.testId",
                    foreignField: "_id",
                    as: "testDetails"
                }
            },
            {
                $unwind: {
                    path: "$testDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    date: "$_id.date",
                    class: "$_id.class",
                    type: "$_id.type",
                    testId: "$_id.testId",
                    testName: "$testDetails.testName",
                    totalStudents: 1,
                    present: 1,
                    absent: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        next(error);
    }
};
