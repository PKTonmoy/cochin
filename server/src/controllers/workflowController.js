/**
 * Workflow Controller
 * Handles workflow validation and status checks
 * Enforces business rules: attendance must be marked before results can be entered
 */

const Attendance = require('../models/Attendance');
const Test = require('../models/Test');
const Class = require('../models/Class');
const Result = require('../models/Result');
const Student = require('../models/Student');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Check if attendance has been marked for a test
 * GET /workflow/attendance-status/:testId
 */
const checkTestAttendance = async (req, res, next) => {
    try {
        const { testId } = req.params;

        // Verify test exists
        const test = await Test.findById(testId);
        if (!test) {
            throw new ApiError(404, 'Test not found');
        }

        // Check for attendance records
        const attendanceCount = await Attendance.countDocuments({
            testId,
            type: 'test'
        });

        const presentCount = await Attendance.countDocuments({
            testId,
            type: 'test',
            status: 'present'
        });

        const absentCount = await Attendance.countDocuments({
            testId,
            type: 'test',
            status: 'absent'
        });

        const lateCount = await Attendance.countDocuments({
            testId,
            type: 'test',
            status: 'late'
        });

        // Get total expected students for this class
        const expectedStudents = await Student.countDocuments({
            class: test.class,
            ...(test.section && { section: test.section }),
            status: 'active'
        });

        res.json({
            success: true,
            data: {
                testId,
                testName: test.testName,
                class: test.class,
                section: test.section,
                isMarked: attendanceCount > 0,
                attendanceComplete: attendanceCount >= expectedStudents,
                stats: {
                    total: attendanceCount,
                    present: presentCount,
                    absent: absentCount,
                    late: lateCount,
                    expected: expectedStudents
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get students eligible for result entry (attended the test)
 * GET /workflow/eligible-students/:testId
 */
const getEligibleStudents = async (req, res, next) => {
    try {
        const { testId } = req.params;

        // Verify test exists
        const test = await Test.findById(testId);
        if (!test) {
            throw new ApiError(404, 'Test not found');
        }

        // Check if attendance is marked
        const attendanceMarked = await Attendance.exists({
            testId,
            type: 'test'
        });

        if (!attendanceMarked) {
            return res.json({
                success: true,
                data: {
                    testId,
                    attendanceMarked: false,
                    message: 'Attendance must be marked before entering results',
                    students: []
                }
            });
        }

        // Get students who attended (present or late)
        const attendedRecords = await Attendance.find({
            testId,
            type: 'test',
            status: { $in: ['present', 'late'] }
        }).populate('studentId', 'name roll class section');

        // Check which students already have results
        const existingResults = await Result.find({ testId }).select('studentId');
        const studentsWithResults = new Set(existingResults.map(r => r.studentId.toString()));

        const students = attendedRecords.map(a => ({
            _id: a.studentId._id,
            name: a.studentId.name,
            roll: a.studentId.roll,
            class: a.studentId.class,
            section: a.studentId.section,
            attendanceStatus: a.status,
            hasResult: studentsWithResults.has(a.studentId._id.toString())
        }));

        res.json({
            success: true,
            data: {
                testId,
                testName: test.testName,
                attendanceMarked: true,
                students,
                summary: {
                    total: students.length,
                    withResults: students.filter(s => s.hasResult).length,
                    pendingResults: students.filter(s => !s.hasResult).length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get class session status (workflow status)
 * GET /workflow/class-status/:classId
 */
const getClassStatus = async (req, res, next) => {
    try {
        const { classId } = req.params;

        const classSession = await Class.findById(classId);
        if (!classSession) {
            throw new ApiError(404, 'Class session not found');
        }

        // Check attendance status
        const attendanceCount = await Attendance.countDocuments({
            classId,
            type: 'class'
        });

        // Determine workflow status
        let workflowStatus = 'scheduled';
        if (classSession.status === 'completed') {
            workflowStatus = attendanceCount > 0 ? 'attendance_marked' : 'completed_no_attendance';
        } else if (classSession.status === 'cancelled') {
            workflowStatus = 'cancelled';
        } else if (classSession.status === 'ongoing') {
            workflowStatus = 'ongoing';
        }

        res.json({
            success: true,
            data: {
                classId,
                title: classSession.title,
                subject: classSession.subject,
                date: classSession.date,
                status: classSession.status,
                workflowStatus,
                attendanceCount,
                enrolledCount: classSession.enrolledCount
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Validate if results can be entered for a test
 * POST /workflow/validate-result-entry
 */
const validateResultEntry = async (req, res, next) => {
    try {
        const { testId, studentId } = req.body;

        if (!testId) {
            throw new ApiError(400, 'Test ID is required');
        }

        // Check test exists
        const test = await Test.findById(testId);
        if (!test) {
            throw new ApiError(404, 'Test not found');
        }

        // Check if attendance is marked for this test
        const testAttendance = await Attendance.findOne({
            testId,
            type: 'test'
        });

        if (!testAttendance) {
            return res.json({
                success: true,
                data: {
                    canEnterResults: false,
                    reason: 'ATTENDANCE_NOT_MARKED',
                    message: 'You must mark attendance for this test before entering results.'
                }
            });
        }

        // If studentId provided, check if student attended
        if (studentId) {
            const studentAttendance = await Attendance.findOne({
                testId,
                studentId,
                type: 'test'
            });

            if (!studentAttendance) {
                return res.json({
                    success: true,
                    data: {
                        canEnterResults: false,
                        reason: 'STUDENT_NOT_IN_ATTENDANCE',
                        message: 'This student is not in the attendance records for this test.'
                    }
                });
            }

            if (studentAttendance.status === 'absent') {
                return res.json({
                    success: true,
                    data: {
                        canEnterResults: false,
                        reason: 'STUDENT_ABSENT',
                        message: 'This student was marked absent for this test.'
                    }
                });
            }
        }

        res.json({
            success: true,
            data: {
                canEnterResults: true,
                message: 'Result entry is allowed.'
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get workflow overview for admin dashboard
 * GET /workflow/overview
 */
const getWorkflowOverview = async (req, res, next) => {
    try {
        const { classFilter, dateFrom, dateTo } = req.query;

        // Build date filter
        const dateFilter = {};
        if (dateFrom) dateFilter.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.$lte = new Date(dateTo);

        // Get recent classes
        const classQuery = { status: { $in: ['completed', 'scheduled'] } };
        if (classFilter) classQuery.class = classFilter;
        if (Object.keys(dateFilter).length > 0) classQuery.date = dateFilter;

        const recentClasses = await Class.find(classQuery)
            .sort({ date: -1 })
            .limit(20)
            .select('title subject class section date status enrolledCount');

        // Get recent tests
        const testQuery = {};
        if (classFilter) testQuery.class = classFilter;
        if (Object.keys(dateFilter).length > 0) testQuery.date = dateFilter;

        const recentTests = await Test.find(testQuery)
            .sort({ date: -1 })
            .limit(20)
            .select('testName testCode class section date status totalMaxMarks');

        // Enrich with workflow status
        const classesWithStatus = await Promise.all(recentClasses.map(async (c) => {
            const attendanceCount = await Attendance.countDocuments({
                classId: c._id,
                type: 'class'
            });
            return {
                ...c.toObject(),
                attendanceMarked: attendanceCount > 0,
                attendanceCount
            };
        }));

        const testsWithStatus = await Promise.all(recentTests.map(async (t) => {
            const attendanceCount = await Attendance.countDocuments({
                testId: t._id,
                type: 'test'
            });
            const resultCount = await Result.countDocuments({ testId: t._id });
            return {
                ...t.toObject(),
                attendanceMarked: attendanceCount > 0,
                attendanceCount,
                resultCount,
                resultsComplete: resultCount > 0
            };
        }));

        // Summary stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const summary = {
            classesToday: await Class.countDocuments({ date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } }),
            testsToday: await Test.countDocuments({ date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } }),
            pendingAttendance: testsWithStatus.filter(t => !t.attendanceMarked && t.status === 'completed').length,
            pendingResults: testsWithStatus.filter(t => t.attendanceMarked && !t.resultsComplete).length
        };

        res.json({
            success: true,
            data: {
                classes: classesWithStatus,
                tests: testsWithStatus,
                summary
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkTestAttendance,
    getEligibleStudents,
    getClassStatus,
    validateResultEntry,
    getWorkflowOverview
};
