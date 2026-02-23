/**
 * Attendance Controller
 * Handles attendance marking and retrieval
 */

const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Test = require('../models/Test');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');
const { emitToClass, emitToStudent } = require('../services/socketService');

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
        const changedStudents = []; // Track students whose status actually changed

        // Normalize date to UTC midnight to prevent timezone shifts
        const dateStr = new Date(date).toISOString().split('T')[0];
        const normalizedDate = new Date(dateStr + 'T00:00:00.000Z');

        for (const student of students) {
            const { studentId, status } = student;

            // Build query to find existing attendance
            const query = {
                studentId,
                type,
                date: normalizedDate
            };
            if (type === 'test') {
                query.testId = testId;
            }

            // Check if attendance already exists
            const existing = await Attendance.findOne(query);

            if (existing) {
                const oldStatus = existing.status;
                existing.status = status;
                existing.markedBy = req.user.id;
                await existing.save();
                results.updated++;

                // Track actual status changes for result syncing
                if (oldStatus !== status) {
                    changedStudents.push({ studentId, oldStatus, newStatus: status });
                }
            } else {
                await Attendance.create({
                    studentId,
                    type,
                    testId: type === 'test' ? testId : undefined,
                    date: normalizedDate,
                    class: classValue,
                    section,
                    status,
                    markedBy: req.user.id
                });
                results.created++;
                // Newly created attendance is also a "change"
                changedStudents.push({ studentId, oldStatus: null, newStatus: status });
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

        // Emit real-time update to students in the class
        emitToClass(classValue, 'attendance-updated', {
            type: 'attendance_marked',
            attendanceType: type,
            date,
            testId: type === 'test' ? testId : undefined,
            message: type === 'test' ? 'Test attendance has been marked' : 'Class attendance has been updated',
            timestamp: new Date()
        }, section);

        // Also emit to individual students
        for (const student of students) {
            emitToStudent(student.studentId, 'attendance-updated', {
                type: 'personal_attendance',
                status: student.status,
                date,
                attendanceType: type,
                testId: type === 'test' ? testId : undefined,
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            message: `Attendance marked: ${results.created} new, ${results.updated} updated`,
            data: { ...results, changedStudents }
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

        // Also backfill attendance from test results that don't have attendance records
        // This handles existing results that were entered before auto-attendance was added
        // Also corrects dates that may have been timezone-shifted
        const Result = require('../models/Result');
        const resultsWithoutAttendance = await Result.find({ studentId })
            .populate('testId', 'testName testCode date class');

        for (const result of resultsWithoutAttendance) {
            if (!result.testId || !result.testId.date) continue;
            const existingAttendance = await Attendance.findOne({
                studentId,
                testId: result.testId._id,
                type: 'test'
            });
            if (!existingAttendance) {
                await Attendance.create({
                    studentId,
                    type: 'test',
                    testId: result.testId._id,
                    date: result.testId.date,
                    class: result.testId.class || result.class,
                    status: 'present',
                    markedBy: req.user.id
                });
            } else if (existingAttendance.date.getTime() !== new Date(result.testId.date).getTime()) {
                // Fix timezone-shifted dates: use the test's actual date
                existingAttendance.date = result.testId.date;
                await existingAttendance.save();
            }
        }

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
 * Update a single attendance record
 */
exports.updateSingleAttendance = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!status || !['present', 'absent', 'late'].includes(status)) {
            throw new ApiError('Valid status (present/absent/late) is required', 400);
        }

        const attendance = await Attendance.findById(id);
        if (!attendance) {
            throw new ApiError('Attendance record not found', 404);
        }

        const oldStatus = attendance.status;
        attendance.status = status;
        if (notes !== undefined) attendance.notes = notes;
        attendance.markedBy = req.user.id;
        await attendance.save();

        await AuditLog.log({
            action: 'attendance_updated',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'attendance',
            entityId: id,
            details: { oldStatus, newStatus: status, studentId: attendance.studentId },
            ipAddress: req.ip
        });

        // Notify student of the change
        emitToStudent(attendance.studentId.toString(), 'attendance-updated', {
            type: 'personal_attendance',
            status,
            date: attendance.date,
            attendanceType: attendance.type,
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: `Attendance updated from ${oldStatus} to ${status}`,
            data: attendance
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
        const { startDate, endDate, class: classFilter, type, page = 1, limit = 20 } = req.query;

        // Build match stage
        const matchStage = {};
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchStage.date.$lte = end;
            }
        }
        if (classFilter) matchStage.class = classFilter;
        if (type && type !== 'all') matchStage.type = type;

        const pipeline = [];
        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        pipeline.push(
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
                    },
                    late: {
                        $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id.date": -1 } }
        );

        // Get total count for pagination
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await Attendance.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        // Apply pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        pipeline.push(
            { $skip: skip },
            { $limit: parseInt(limit) }
        );

        // Lookup test details
        pipeline.push(
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
                    absent: 1,
                    late: 1
                }
            }
        );

        const history = await Attendance.aggregate(pipeline);

        res.json({
            success: true,
            data: {
                history,
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
 * Get attendance stats for admin dashboard
 */
exports.getAttendanceStats = async (req, res, next) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Overall stats
        const overallStats = await Attendance.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
                }
            }
        ]);

        // Total sessions (unique date+class+type combos)
        const totalSessions = await Attendance.aggregate([
            {
                $group: {
                    _id: { date: '$date', class: '$class', type: '$type', testId: '$testId' }
                }
            },
            { $count: 'total' }
        ]);

        // This month stats
        const thisMonthStats = await Attendance.aggregate([
            { $match: { date: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    sessions: { $addToSet: { date: '$date', class: '$class', type: '$type' } }
                }
            }
        ]);

        // Last month stats for trend comparison
        const lastMonthStats = await Attendance.aggregate([
            { $match: { date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
                }
            }
        ]);

        // Class-wise breakdown
        const classWise = await Attendance.aggregate([
            {
                $group: {
                    _id: '$class',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const overall = overallStats[0] || { total: 0, present: 0, absent: 0, late: 0 };
        const thisMonth = thisMonthStats[0] || { total: 0, present: 0, sessions: [] };
        const lastMonth = lastMonthStats[0] || { total: 0, present: 0 };

        const overallRate = overall.total > 0 ? Math.round((overall.present / overall.total) * 100) : 0;
        const thisMonthRate = thisMonth.total > 0 ? Math.round((thisMonth.present / thisMonth.total) * 100) : 0;
        const lastMonthRate = lastMonth.total > 0 ? Math.round((lastMonth.present / lastMonth.total) * 100) : 0;

        res.json({
            success: true,
            data: {
                totalSessions: totalSessions[0]?.total || 0,
                overallRate,
                thisMonth: {
                    sessions: thisMonth.sessions?.length || 0,
                    rate: thisMonthRate,
                    total: thisMonth.total
                },
                trend: thisMonthRate - lastMonthRate,
                classWise: classWise.map(c => ({
                    class: c._id,
                    total: c.total,
                    present: c.present,
                    absent: c.absent,
                    late: c.late,
                    rate: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};
