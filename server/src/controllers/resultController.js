/**
 * Result Controller
 * Handles result viewing and export
 */

const Result = require('../models/Result');
const Test = require('../models/Test');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');
const { emitToClass, emitToStudent } = require('../services/socketService');
const smsService = require('../services/smsService');
const notificationService = require('../services/notificationService');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

/**
 * Bulk create or update results (for manual entry)
 */
exports.bulkCreateResults = async (req, res, next) => {
    try {
        const { results, skipAttendanceCheck = false } = req.body;

        if (!results || !Array.isArray(results) || results.length === 0) {
            throw new ApiError('No results provided', 400);
        }

        // Get unique test IDs from results
        const testIds = [...new Set(results.map(r => r.testId))];

        // Validate attendance for each test (unless explicitly skipped by admin)
        if (!skipAttendanceCheck) {
            for (const testId of testIds) {
                const attendanceExists = await Attendance.exists({
                    testId,
                    type: 'test'
                });

                if (!attendanceExists) {
                    const test = await Test.findById(testId);
                    throw new ApiError(
                        `Attendance must be marked for test "${test?.testName || testId}" before entering results. Please mark attendance first.`,
                        400
                    );
                }
            }
        }

        const savedCount = { created: 0, updated: 0, skipped: 0 };

        for (const item of results) {
            const { studentId, testId, marks } = item;

            if (!studentId || !testId || !marks) continue;

            // Get the test to find subject info
            const test = await Test.findById(testId);
            if (!test) continue;

            // Get student
            const student = await Student.findById(studentId);
            if (!student) continue;

            // Calculate total marks
            const subjectMarks = new Map();
            let totalMarks = 0;
            let maxMarks = 0;

            test.subjects.forEach(subject => {
                const mark = parseFloat(marks[subject.name]) || 0;
                subjectMarks.set(subject.name, mark);
                totalMarks += mark;
                maxMarks += subject.maxMarks;
            });

            const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100 * 100) / 100 : 0;

            // Calculate grade
            let grade = 'F';
            if (percentage >= 80) grade = 'A+';
            else if (percentage >= 70) grade = 'A';
            else if (percentage >= 60) grade = 'A-';
            else if (percentage >= 50) grade = 'B';
            else if (percentage >= 40) grade = 'C';
            else if (percentage >= 33) grade = 'D';

            // Check if result already exists
            const existingResult = await Result.findOne({ studentId, testId });

            if (existingResult) {
                existingResult.subjectMarks = subjectMarks;
                existingResult.totalMarks = totalMarks;
                existingResult.maxMarks = maxMarks;
                existingResult.percentage = percentage;
                existingResult.grade = grade;
                await existingResult.save();
                savedCount.updated++;
            } else {
                await Result.create({
                    studentId,
                    testId,
                    roll: student.roll,
                    class: student.class,
                    section: student.section,
                    subjectMarks,
                    totalMarks,
                    maxMarks,
                    percentage,
                    grade
                });
                savedCount.created++;
            }

            // Auto-create attendance record if one doesn't exist for this student/test
            // If a student has a result, they clearly attended the test
            const existingAttendance = await Attendance.findOne({
                studentId,
                testId,
                type: 'test'
            });
            if (!existingAttendance) {
                await Attendance.create({
                    studentId,
                    type: 'test',
                    testId,
                    date: test.date || new Date(),
                    class: student.class,
                    section: student.section,
                    status: 'present',
                    markedBy: req.user.id
                });
            }
        }

        await AuditLog.log({
            action: 'results_bulk_created',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'result',
            details: { created: savedCount.created, updated: savedCount.updated },
            ipAddress: req.ip
        });

        // Emit real-time update to students
        if (savedCount.created > 0 || savedCount.updated > 0) {
            // Get test info for notification
            const testId = results[0]?.testId;
            if (testId) {
                const test = await Test.findById(testId);
                if (test) {
                    // Emit to all students in the class
                    emitToClass(test.class, 'results-updated', {
                        type: 'new_results',
                        testId: test._id,
                        testName: test.testName,
                        message: `Results for ${test.testName} have been published!`,
                        timestamp: new Date()
                    }, test.section);

                    // If test is already published, send SMS for new results
                    if (test.isPublished && savedCount.created > 0) {
                        smsService.sendBulkResultSms(testId, req.user.id)
                            .then(smsResult => {
                                console.log(`[SMS] Bulk create trigger for "${test.testName}": ${JSON.stringify(smsResult.results || smsResult.reason)}`);
                            })
                            .catch(err => {
                                console.error('[SMS] Error in bulk create trigger:', err.message);
                            });
                    }
                }
            }
        }

        res.json({
            success: true,
            message: `Results saved successfully`,
            data: { count: savedCount.created + savedCount.updated, ...savedCount }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all results with filters
 */
exports.getAllResults = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 50,
            testId,
            studentId,
            class: classFilter,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};

        if (testId) query.testId = testId;
        if (studentId) query.studentId = studentId;

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let resultsQuery = Result.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('testId', 'testName testCode class date subjects totalMaxMarks') // Added populates
            .populate('studentId', 'roll name class section');

        // Filter by class requires a join
        if (classFilter) {
            const students = await Student.find({ class: classFilter }).select('_id');
            query.studentId = { $in: students.map(s => s._id) };
        }

        const [results, total] = await Promise.all([
            resultsQuery,
            Result.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                results,
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
 * Get results for a specific test
 */
exports.getTestResults = async (req, res, next) => {
    try {
        const { testId } = req.params;
        const { sortBy = 'totalMarks', sortOrder = 'desc' } = req.query;

        const test = await Test.findById(testId);
        if (!test) {
            throw new ApiError('Test not found', 404);
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const results = await Result.find({ testId })
            .sort(sort)
            .populate('testId', 'testName testCode class date subjects totalMaxMarks') // Added testId populate
            .populate('studentId', 'roll name class section');

        // Calculate ranks
        const sortedResults = [...results].sort((a, b) => b.totalMarks - a.totalMarks);
        let currentRank = 1;
        sortedResults.forEach((result, index) => {
            if (index > 0 && result.totalMarks < sortedResults[index - 1].totalMarks) {
                currentRank = index + 1;
            }
            result.rank = currentRank;
        });

        res.json({
            success: true,
            data: {
                test,
                results: sortedResults,
                stats: {
                    total: results.length,
                    highest: results.length > 0 ? Math.max(...results.map(r => r.totalMarks)) : 0,
                    lowest: results.length > 0 ? Math.min(...results.map(r => r.totalMarks)) : 0,
                    average: results.length > 0
                        ? Math.round(results.reduce((sum, r) => sum + r.totalMarks, 0) / results.length * 100) / 100
                        : 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get results for a specific student (includes attendance status)
 */
exports.getStudentResults = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        // Check authorization
        if (req.user.role === 'student') {
            const student = await Student.findById(studentId);
            if (!student || student.roll !== req.user.roll) {
                throw new ApiError('Not authorized to view these results', 403);
            }
        }

        const student = await Student.findById(studentId);
        if (!student) {
            throw new ApiError('Student not found', 404);
        }

        // 1. Get all published tests for student's class
        const tests = await Test.find({
            class: student.class,
            isPublished: true
        }).sort({ date: -1 });

        // 2. Get all results for student
        const results = await Result.find({ studentId })
            .populate('testId');

        // 3. Get all test attendance for student
        const attendance = await Attendance.find({
            studentId,
            type: 'test'
        });

        // 4. Merge data
        const history = tests.map(test => {
            const result = results.find(r => r.testId?._id?.toString() === test._id.toString());
            const attendRecord = attendance.find(a => a.testId?.toString() === test._id.toString());

            if (result) {
                return {
                    type: 'result',
                    data: result,
                    test
                };
            }

            return {
                type: 'no_result',
                status: attendRecord?.status || 'unknown',
                test
            };
        });

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Export results to Excel
 */
exports.exportResults = async (req, res, next) => {
    try {
        const { testId, class: classFilter, format = 'xlsx' } = req.body;

        let query = {};
        let test = null;

        if (testId) {
            test = await Test.findById(testId);
            if (!test) {
                throw new ApiError('Test not found', 404);
            }
            query.testId = testId;
        }

        if (classFilter) {
            const students = await Student.find({ class: classFilter }).select('_id');
            query.studentId = { $in: students.map(s => s._id) };
        }

        const results = await Result.find(query)
            .sort({ totalMarks: -1 })
            .populate('studentId', 'roll name class section')
            .populate('testId', 'testName testCode class date');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Results');

        // Get all subject names from results
        const allSubjects = new Set();
        results.forEach(result => {
            if (result.subjectMarks) {
                for (const key of result.subjectMarks.keys()) {
                    allSubjects.add(key);
                }
            }
        });

        const subjectList = Array.from(allSubjects);

        // Define columns
        const columns = [
            { header: 'Rank', key: 'rank', width: 8 },
            { header: 'Roll', key: 'roll', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Class', key: 'class', width: 10 },
            { header: 'Test', key: 'testName', width: 25 },
            { header: 'Date', key: 'date', width: 12 },
            ...subjectList.map(s => ({ header: s, key: s, width: 10 })),
            { header: 'Total', key: 'total', width: 10 },
            { header: 'Max', key: 'max', width: 10 },
            { header: '%', key: 'percentage', width: 8 },
            { header: 'Grade', key: 'grade', width: 8 }
        ];

        worksheet.columns = columns;

        // Calculate ranks
        let currentRank = 1;
        results.forEach((result, index) => {
            if (index > 0 && result.totalMarks < results[index - 1].totalMarks) {
                currentRank = index + 1;
            }

            const row = {
                rank: currentRank,
                roll: result.studentId?.roll || result.roll,
                name: result.studentId?.name || '-',
                class: result.studentId?.class || '-',
                testName: result.testId?.testName || '-',
                date: result.testId?.date?.toLocaleDateString() || '-',
                total: result.totalMarks,
                max: result.maxMarks,
                percentage: result.percentage,
                grade: result.grade
            };

            // Add subject marks
            subjectList.forEach(subject => {
                row[subject] = result.subjectMarks?.get(subject) ?? '-';
            });

            worksheet.addRow(row);
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A365D' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        const filename = `results-export-${Date.now()}.${format}`;
        const filepath = path.join(__dirname, '../../uploads', filename);
        await workbook.xlsx.writeFile(filepath);

        res.download(filepath, filename, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(filepath, () => { });
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get merit list for a test with topper details and statistics
 */
exports.getMeritList = async (req, res, next) => {
    try {
        const { testId } = req.params;
        const { limit = 100 } = req.query;

        const test = await Test.findById(testId);
        if (!test) {
            throw new ApiError('Test not found', 404);
        }

        // Get all results excluding absent students, sorted by marks
        const results = await Result.find({ testId, isAbsent: { $ne: true } })
            .sort({ totalMarks: -1 })
            .limit(parseInt(limit))
            .populate('studentId', 'roll name class section photo');

        if (results.length === 0) {
            return res.json({
                success: true,
                data: {
                    test,
                    meritList: [],
                    topper: null,
                    statistics: null
                }
            });
        }

        // Calculate ranks with tie handling
        let currentRank = 1;
        const meritList = results.map((result, index) => {
            if (index > 0 && result.totalMarks < results[index - 1].totalMarks) {
                currentRank = index + 1;
            }
            return {
                rank: currentRank,
                studentId: result.studentId?._id,
                roll: result.studentId?.roll || result.roll,
                name: result.studentId?.name || '-',
                photo: result.studentId?.photo,
                totalMarks: result.totalMarks,
                maxMarks: result.maxMarks,
                percentage: result.percentage,
                grade: result.grade,
                subjectMarks: Object.fromEntries(result.subjectMarks || new Map())
            };
        });

        // Calculate percentiles for all
        const totalStudents = await Result.countDocuments({ testId, isAbsent: { $ne: true } });
        meritList.forEach(item => {
            item.percentile = Math.round(((totalStudents - item.rank + 1) / totalStudents) * 100 * 100) / 100;
        });

        // Get topper details
        const topper = meritList[0] || null;

        // Calculate statistics
        const allResults = await Result.find({ testId, isAbsent: { $ne: true } });
        const scores = allResults.map(r => r.totalMarks);
        const sortedScores = [...scores].sort((a, b) => a - b);

        const statistics = {
            totalStudents: allResults.length,
            absentCount: await Result.countDocuments({ testId, isAbsent: true }),
            highestScore: Math.max(...scores),
            lowestScore: Math.min(...scores),
            averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100,
            medianScore: sortedScores[Math.floor(sortedScores.length / 2)],
            passCount: allResults.filter(r => r.percentage >= 33).length,
            passPercentage: Math.round((allResults.filter(r => r.percentage >= 33).length / allResults.length) * 100 * 100) / 100,
            gradeDistribution: {
                'A+': allResults.filter(r => r.percentage >= 80).length,
                'A': allResults.filter(r => r.percentage >= 70 && r.percentage < 80).length,
                'A-': allResults.filter(r => r.percentage >= 60 && r.percentage < 70).length,
                'B': allResults.filter(r => r.percentage >= 50 && r.percentage < 60).length,
                'C': allResults.filter(r => r.percentage >= 40 && r.percentage < 50).length,
                'D': allResults.filter(r => r.percentage >= 33 && r.percentage < 40).length,
                'F': allResults.filter(r => r.percentage < 33).length
            }
        };

        res.json({
            success: true,
            data: {
                test,
                meritList,
                topper,
                statistics
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get detailed result for a specific student in a specific test
 */
exports.getStudentTestResult = async (req, res, next) => {
    try {
        const { studentId, testId } = req.params;

        // Authorization check
        if (req.user.role === 'student') {
            const student = await Student.findById(studentId);
            if (!student || student.roll !== req.user.roll) {
                throw new ApiError('Not authorized to view this result', 403);
            }
        }

        const result = await Result.findOne({ studentId, testId })
            .populate('studentId', 'roll name class section')
            .populate('testId');

        if (!result) {
            throw new ApiError('Result not found', 404);
        }

        // Get student's rank
        const allResults = await Result.find({ testId, isAbsent: { $ne: true } })
            .sort({ totalMarks: -1 });

        let studentRank = 1;
        for (let i = 0; i < allResults.length; i++) {
            if (i > 0 && allResults[i].totalMarks < allResults[i - 1].totalMarks) {
                studentRank = i + 1;
            }
            if (allResults[i].studentId.toString() === studentId) {
                break;
            }
        }

        // Calculate percentile
        const totalStudents = allResults.length;
        const percentile = Math.round(((totalStudents - studentRank + 1) / totalStudents) * 100 * 100) / 100;

        // Get comparison stats
        const scores = allResults.map(r => r.totalMarks);
        const topperScore = Math.max(...scores);
        const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100;

        res.json({
            success: true,
            data: {
                result: {
                    ...result.toObject(),
                    subjectMarks: Object.fromEntries(result.subjectMarks || new Map()),
                    rank: studentRank,
                    percentile
                },
                comparison: {
                    topperScore,
                    topperMaxMarks: result.maxMarks,
                    averageScore,
                    totalStudents,
                    aboveAverage: result.totalMarks > averageScore,
                    differenceFromTopper: topperScore - result.totalMarks,
                    differenceFromAverage: Math.round((result.totalMarks - averageScore) * 100) / 100,
                    marksNeededForNextRank: studentRank > 1
                        ? allResults.find((r, i) => i > 0 && allResults[i].totalMarks < allResults[i - 1].totalMarks && allResults.findIndex(x => x.studentId.toString() === studentId) === i)?.totalMarks - result.totalMarks + 1 || 1
                        : 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Publish/unpublish test results
 */
exports.publishResults = async (req, res, next) => {
    try {
        const { testId } = req.params;
        const { publish = true } = req.body;

        const test = await Test.findById(testId);
        if (!test) {
            throw new ApiError('Test not found', 404);
        }

        // Check if results exist
        const resultCount = await Result.countDocuments({ testId });
        if (resultCount === 0 && publish) {
            throw new ApiError('Cannot publish: No results uploaded for this test', 400);
        }

        // Update test publish status
        test.isPublished = publish;
        if (publish) {
            test.publishedAt = new Date();
        }
        await test.save();

        // Calculate ranks for all results when publishing
        if (publish) {
            const results = await Result.find({ testId, isAbsent: { $ne: true } })
                .sort({ totalMarks: -1 });

            let currentRank = 1;
            for (let i = 0; i < results.length; i++) {
                if (i > 0 && results[i].totalMarks < results[i - 1].totalMarks) {
                    currentRank = i + 1;
                }
                results[i].rank = currentRank;
                await results[i].save();
            }
        }

        await AuditLog.log({
            action: publish ? 'results_published' : 'results_unpublished',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'test',
            entityId: testId,
            details: { testName: test.testName, resultCount },
            ipAddress: req.ip
        });

        // Trigger push + portal notifications when publishing results
        if (publish) {
            notificationService.notifyTest(test, 'result_published', { userId: req.user.id })
                .then(() => {
                    console.log(`[Notification] Result published notification sent for "${test.testName}"`);
                })
                .catch(err => {
                    console.error('[Notification] Error sending result published notification:', err.message);
                });

            // Also trigger SMS
            smsService.sendBulkResultSms(testId, req.user.id)
                .then(smsResult => {
                    console.log(`[SMS] Result publish trigger for "${test.testName}": ${JSON.stringify(smsResult.results || smsResult.reason)}`);
                })
                .catch(err => {
                    console.error('[SMS] Error in publish trigger:', err.message);
                });
        }

        res.json({
            success: true,
            message: publish ? 'Results published successfully' : 'Results unpublished',
            data: { test, resultCount }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Download Excel template for result upload
 */
exports.downloadTemplate = async (req, res, next) => {
    try {
        const { testId } = req.params;

        const test = await Test.findById(testId);
        if (!test) {
            throw new ApiError('Test not found', 404);
        }

        // Get students in this class
        const students = await Student.find({
            class: test.class,
            ...(test.section && { section: test.section })
        }).select('roll name class section').sort({ roll: 1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Results Template');

        // Define columns based on test subjects
        const columns = [
            { header: 'Roll Number *', key: 'roll', width: 15 },
            { header: 'Student Name', key: 'name', width: 25 },
            ...test.subjects.map(s => ({
                header: `${s.name} (Max: ${s.maxMarks}) *`,
                key: s.name,
                width: 15
            })),
            { header: 'Remarks', key: 'remarks', width: 20 },
            { header: 'Absent (Y/N)', key: 'absent', width: 12 }
        ];

        worksheet.columns = columns;

        // Add sample data rows with student info
        students.forEach(student => {
            const row = {
                roll: student.roll,
                name: student.name,
                remarks: '',
                absent: ''
            };
            // Leave subject marks empty for filling
            test.subjects.forEach(s => {
                row[s.name] = '';
            });
            worksheet.addRow(row);
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2E86AB' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Add instructions sheet
        const instructionsSheet = workbook.addWorksheet('Instructions');
        instructionsSheet.getColumn(1).width = 80;
        instructionsSheet.addRow(['RESULT UPLOAD INSTRUCTIONS']);
        instructionsSheet.addRow(['']);
        instructionsSheet.addRow(['1. Fill in marks for each subject in the respective columns']);
        instructionsSheet.addRow(['2. Marks should be between 0 and the maximum marks shown in column header']);
        instructionsSheet.addRow(['3. For absent students, enter "Y" in the Absent column']);
        instructionsSheet.addRow(['4. Do not modify the Roll Number column']);
        instructionsSheet.addRow(['5. Save as .xlsx format before uploading']);
        instructionsSheet.addRow(['']);
        instructionsSheet.addRow([`Test: ${test.testName}`]);
        instructionsSheet.addRow([`Test Code: ${test.testCode}`]);
        instructionsSheet.addRow([`Class: ${test.class}${test.section ? ' - ' + test.section : ''}`]);
        instructionsSheet.addRow([`Total Max Marks: ${test.totalMaxMarks}`]);
        instructionsSheet.getRow(1).font = { bold: true, size: 14 };

        const filename = `result-template-${test.testCode}.xlsx`;
        const filepath = path.join(__dirname, '../../uploads', filename);
        await workbook.xlsx.writeFile(filepath);

        res.download(filepath, filename, (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(filepath, () => { });
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Validate results before saving (preview validation)
 */
exports.validateResults = async (req, res, next) => {
    try {
        const { testId, results } = req.body;

        if (!testId || !results || !Array.isArray(results)) {
            throw new ApiError('Test ID and results array required', 400);
        }

        const test = await Test.findById(testId);
        if (!test) {
            throw new ApiError('Test not found', 404);
        }

        const validationResults = {
            valid: [],
            errors: [],
            warnings: [],
            statistics: {
                total: results.length,
                valid: 0,
                invalid: 0,
                warnings: 0
            }
        };

        for (let i = 0; i < results.length; i++) {
            const item = results[i];
            const rowNum = i + 2; // Excel row number (1-indexed + header)
            const errors = [];
            const warnings = [];

            // Validate roll number
            if (!item.roll) {
                errors.push(`Row ${rowNum}: Roll number is required`);
            } else {
                const student = await Student.findOne({ roll: item.roll });
                if (!student) {
                    errors.push(`Row ${rowNum}: Student with roll ${item.roll} not found`);
                } else if (student.class !== test.class) {
                    warnings.push(`Row ${rowNum}: Student ${item.roll} is in class ${student.class}, not ${test.class}`);
                }

                // Check for duplicate in this upload
                const duplicate = results.findIndex((r, idx) => idx !== i && r.roll === item.roll);
                if (duplicate !== -1) {
                    errors.push(`Row ${rowNum}: Duplicate roll number ${item.roll} (also in row ${duplicate + 2})`);
                }
            }

            // Validate subject marks
            let totalMarks = 0;
            if (!item.isAbsent && !item.absent) {
                for (const subject of test.subjects) {
                    const mark = parseFloat(item[subject.name] || item.marks?.[subject.name]);

                    if (mark === undefined || mark === null || isNaN(mark)) {
                        errors.push(`Row ${rowNum}: ${subject.name} marks is required`);
                    } else if (mark < 0) {
                        errors.push(`Row ${rowNum}: ${subject.name} marks cannot be negative`);
                    } else if (mark > subject.maxMarks) {
                        errors.push(`Row ${rowNum}: ${subject.name} marks (${mark}) exceeds maximum (${subject.maxMarks})`);
                    } else {
                        totalMarks += mark;
                    }
                }

                // Flag unusual scores
                if (totalMarks === 0) {
                    warnings.push(`Row ${rowNum}: Total marks is 0 - did you mean to mark absent?`);
                } else if (totalMarks === test.totalMaxMarks) {
                    warnings.push(`Row ${rowNum}: Perfect score - please verify`);
                }
            }

            if (errors.length > 0) {
                validationResults.errors.push(...errors);
                validationResults.statistics.invalid++;
            } else {
                validationResults.valid.push({
                    row: rowNum,
                    roll: item.roll,
                    totalMarks,
                    percentage: test.totalMaxMarks > 0 ? Math.round((totalMarks / test.totalMaxMarks) * 100 * 100) / 100 : 0
                });
                validationResults.statistics.valid++;
            }

            if (warnings.length > 0) {
                validationResults.warnings.push(...warnings);
                validationResults.statistics.warnings++;
            }
        }

        res.json({
            success: true,
            data: validationResults
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a single result
 */
exports.deleteResult = async (req, res, next) => {
    try {
        const { resultId } = req.params;

        const result = await Result.findById(resultId);
        if (!result) {
            throw new ApiError('Result not found', 404);
        }

        await Result.findByIdAndDelete(resultId);

        await AuditLog.log({
            action: 'result_deleted',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'result',
            entityId: resultId,
            details: { studentRoll: result.roll, testId: result.testId },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Result deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a single result
 */
exports.updateResult = async (req, res, next) => {
    try {
        const { resultId } = req.params;
        const { subjectMarks, remarks, isAbsent, reason } = req.body;

        const result = await Result.findById(resultId);
        if (!result) {
            throw new ApiError('Result not found', 404);
        }

        // Store old values for audit
        const oldValues = {
            subjectMarks: Object.fromEntries(result.subjectMarks || new Map()),
            totalMarks: result.totalMarks,
            percentage: result.percentage,
            grade: result.grade
        };

        // Update subject marks if provided
        if (subjectMarks) {
            const test = await Test.findById(result.testId);
            let totalMarks = 0;
            let maxMarks = 0;

            const newSubjectMarks = new Map();
            for (const subject of test.subjects) {
                const mark = parseFloat(subjectMarks[subject.name]) || 0;
                newSubjectMarks.set(subject.name, mark);
                totalMarks += mark;
                maxMarks += subject.maxMarks;
            }

            result.subjectMarks = newSubjectMarks;
            result.totalMarks = totalMarks;
            result.maxMarks = maxMarks;
            result.percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100 * 100) / 100 : 0;
            result.grade = result.calculateGrade();
        }

        if (remarks !== undefined) result.remarks = remarks;
        if (isAbsent !== undefined) result.isAbsent = isAbsent;

        await result.save();

        // Log the change
        await AuditLog.log({
            action: 'result_updated',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'result',
            entityId: resultId,
            details: {
                studentRoll: result.roll,
                oldValues,
                newValues: {
                    subjectMarks: Object.fromEntries(result.subjectMarks || new Map()),
                    totalMarks: result.totalMarks,
                    percentage: result.percentage,
                    grade: result.grade
                },
                reason: reason || 'Not specified'
            },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Result updated successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Sync results with attendance changes
 * When attendance is edited (e.g., student marked absent→present or present→absent),
 * this updates the corresponding results and sends SMS to newly-present students.
 */
exports.syncResultsWithAttendance = async (req, res, next) => {
    try {
        const { testId } = req.params;
        const { changedStudents } = req.body;

        if (!changedStudents || !Array.isArray(changedStudents) || changedStudents.length === 0) {
            throw new ApiError('No changed students provided', 400);
        }

        const test = await Test.findById(testId);
        if (!test) {
            throw new ApiError('Test not found', 404);
        }

        const syncResults = {
            markedAbsent: 0,
            restored: 0,
            noResultFound: 0,
            smsSent: false
        };

        const affectedStudentIds = [];

        for (const change of changedStudents) {
            const { studentId, newStatus } = change;

            // Find existing result for this student + test
            const result = await Result.findOne({ studentId, testId });

            if (!result) {
                syncResults.noResultFound++;
                continue;
            }

            if (newStatus === 'absent') {
                // Student was changed to absent — mark result as absent
                if (!result.isAbsent) {
                    result.isAbsent = true;
                    await result.save();
                    syncResults.markedAbsent++;
                    affectedStudentIds.push(studentId);
                }
            } else if (newStatus === 'present' || newStatus === 'late') {
                // Student was changed to present/late — restore result
                if (result.isAbsent) {
                    result.isAbsent = false;
                    await result.save();
                    syncResults.restored++;
                    affectedStudentIds.push(studentId);
                }
            }
        }

        // Recalculate ranks for all non-absent results
        const allResults = await Result.find({ testId, isAbsent: { $ne: true } })
            .sort({ totalMarks: -1 });

        let currentRank = 1;
        for (let i = 0; i < allResults.length; i++) {
            if (i > 0 && allResults[i].totalMarks < allResults[i - 1].totalMarks) {
                currentRank = i + 1;
            }
            allResults[i].rank = currentRank;
            await allResults[i].save();
        }

        // Emit real-time updates to affected students
        for (const studentId of affectedStudentIds) {
            emitToStudent(studentId, 'results-updated', {
                type: 'result_sync',
                testId: test._id,
                testName: test.testName,
                message: `Your result for ${test.testName} has been updated`,
                timestamp: new Date()
            });
        }

        // Also emit to the class so student portal refreshes
        emitToClass(test.class, 'results-updated', {
            type: 'result_sync',
            testId: test._id,
            testName: test.testName,
            message: `Results for ${test.testName} have been updated`,
            timestamp: new Date()
        }, test.section);

        // Trigger SMS for newly-present students who have results (sendBulkResultSms
        // already skips students who already received SMS via SmsLog dedup)
        if (test.isPublished && syncResults.restored > 0) {
            smsService.sendBulkResultSms(testId, req.user.id)
                .then(smsResult => {
                    console.log(`[SMS] Attendance sync trigger for "${test.testName}": ${JSON.stringify(smsResult.results || smsResult.reason)}`);
                })
                .catch(err => {
                    console.error('[SMS] Error in attendance sync trigger:', err.message);
                });
            syncResults.smsSent = true;
        }

        await AuditLog.log({
            action: 'results_synced_with_attendance',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'result',
            details: {
                testId,
                testName: test.testName,
                ...syncResults,
                changedCount: changedStudents.length
            },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: `Results synced: ${syncResults.markedAbsent} marked absent, ${syncResults.restored} restored${syncResults.smsSent ? ', SMS queued for new students' : ''}`,
            data: syncResults
        });
    } catch (error) {
        next(error);
    }
};
