/**
 * Conflict Detection Service
 * Detect scheduling conflicts for students, instructors, and rooms
 */

const Class = require('../models/Class');
const Test = require('../models/Test');

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(start1, end1, start2, end2) {
    const [s1H, s1M] = start1.split(':').map(Number);
    const [e1H, e1M] = end1.split(':').map(Number);
    const [s2H, s2M] = start2.split(':').map(Number);
    const [e2H, e2M] = end2.split(':').map(Number);

    const s1 = s1H * 60 + s1M;
    const e1 = e1H * 60 + e1M;
    const s2 = s2H * 60 + s2M;
    const e2 = e2H * 60 + e2M;

    return s1 < e2 && s2 < e1;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
}

/**
 * Detect instructor schedule conflicts
 * Returns conflicting classes/tests for an instructor on a given date/time
 */
async function detectInstructorConflicts(instructorId, date, startTime, endTime, excludeClassId = null) {
    const conflicts = [];

    // Check classes
    const classes = await Class.find({
        instructorId,
        date: {
            $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
        },
        status: { $in: ['scheduled', 'ongoing'] },
        ...(excludeClassId ? { _id: { $ne: excludeClassId } } : {})
    }).lean();

    for (const cls of classes) {
        if (timeRangesOverlap(startTime, endTime, cls.startTime, cls.endTime)) {
            conflicts.push({
                type: 'class',
                id: cls._id,
                title: cls.title,
                date: cls.date,
                startTime: cls.startTime,
                endTime: cls.endTime
            });
        }
    }

    return conflicts;
}

/**
 * Detect room/venue conflicts
 * Returns conflicting classes for a room on a given date/time
 */
async function detectRoomConflicts(room, date, startTime, endTime, excludeClassId = null) {
    if (!room) return [];

    const conflicts = [];

    const classes = await Class.find({
        room,
        date: {
            $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
        },
        status: { $in: ['scheduled', 'ongoing'] },
        ...(excludeClassId ? { _id: { $ne: excludeClassId } } : {})
    }).lean();

    for (const cls of classes) {
        if (timeRangesOverlap(startTime, endTime, cls.startTime, cls.endTime)) {
            conflicts.push({
                type: 'class',
                id: cls._id,
                title: cls.title,
                room: cls.room,
                date: cls.date,
                startTime: cls.startTime,
                endTime: cls.endTime
            });
        }
    }

    // Also check tests in the same room
    const tests = await Test.find({
        room,
        date: {
            $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
        },
        status: { $in: ['scheduled', 'ongoing'] },
        startTime: { $exists: true },
        endTime: { $exists: true }
    }).lean();

    for (const test of tests) {
        if (timeRangesOverlap(startTime, endTime, test.startTime, test.endTime)) {
            conflicts.push({
                type: 'test',
                id: test._id,
                title: test.testName,
                room: test.room,
                date: test.date,
                startTime: test.startTime,
                endTime: test.endTime
            });
        }
    }

    return conflicts;
}

/**
 * Detect student class/test conflicts
 * Check if a class conflicts with any tests for the same class of students
 */
async function detectStudentConflicts(targetClass, section, date, startTime, endTime, excludeId = null, excludeType = 'class') {
    const conflicts = [];

    // Check for conflicting classes
    if (excludeType !== 'class' || excludeId) {
        const classes = await Class.find({
            class: targetClass,
            ...(section ? { section } : {}),
            date: {
                $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
            },
            status: { $in: ['scheduled', 'ongoing'] },
            ...(excludeType === 'class' && excludeId ? { _id: { $ne: excludeId } } : {})
        }).lean();

        for (const cls of classes) {
            if (timeRangesOverlap(startTime, endTime, cls.startTime, cls.endTime)) {
                conflicts.push({
                    type: 'class',
                    id: cls._id,
                    title: cls.title,
                    subject: cls.subject,
                    date: cls.date,
                    startTime: cls.startTime,
                    endTime: cls.endTime
                });
            }
        }
    }

    // Check for conflicting tests
    const tests = await Test.find({
        class: targetClass,
        ...(section ? { section } : {}),
        date: {
            $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
        },
        status: { $in: ['scheduled', 'ongoing'] },
        startTime: { $exists: true },
        endTime: { $exists: true },
        ...(excludeType === 'test' && excludeId ? { _id: { $ne: excludeId } } : {})
    }).lean();

    for (const test of tests) {
        if (timeRangesOverlap(startTime, endTime, test.startTime, test.endTime)) {
            conflicts.push({
                type: 'test',
                id: test._id,
                title: test.testName,
                date: test.date,
                startTime: test.startTime,
                endTime: test.endTime
            });
        }
    }

    return conflicts;
}

/**
 * Comprehensive conflict check
 * Returns all types of conflicts for a proposed schedule
 */
async function checkAllConflicts(scheduleData, excludeId = null, excludeType = 'class') {
    const {
        instructorId,
        room,
        class: targetClass,
        section,
        date,
        startTime,
        endTime
    } = scheduleData;

    const allConflicts = {
        instructor: [],
        room: [],
        students: [],
        hasConflicts: false
    };

    // Check instructor conflicts
    if (instructorId) {
        allConflicts.instructor = await detectInstructorConflicts(
            instructorId,
            date,
            startTime,
            endTime,
            excludeType === 'class' ? excludeId : null
        );
    }

    // Check room conflicts
    if (room) {
        allConflicts.room = await detectRoomConflicts(
            room,
            date,
            startTime,
            endTime,
            excludeType === 'class' ? excludeId : null
        );
    }

    // Check student conflicts
    if (targetClass) {
        allConflicts.students = await detectStudentConflicts(
            targetClass,
            section,
            date,
            startTime,
            endTime,
            excludeId,
            excludeType
        );
    }

    allConflicts.hasConflicts =
        allConflicts.instructor.length > 0 ||
        allConflicts.room.length > 0 ||
        allConflicts.students.length > 0;

    return allConflicts;
}

/**
 * Validate a batch of classes for conflicts
 * Used when creating recurring classes from a template
 */
async function validateBatchClasses(classes) {
    const results = [];

    for (let i = 0; i < classes.length; i++) {
        const cls = classes[i];
        const conflicts = await checkAllConflicts(cls);

        // Also check against other classes in the same batch
        const batchConflicts = [];
        for (let j = 0; j < i; j++) {
            const other = classes[j];
            if (isSameDay(cls.date, other.date)) {
                if (timeRangesOverlap(cls.startTime, cls.endTime, other.startTime, other.endTime)) {
                    // Check if same instructor
                    if (cls.instructorId && other.instructorId &&
                        cls.instructorId.toString() === other.instructorId.toString()) {
                        batchConflicts.push({
                            type: 'batch-instructor',
                            batchIndex: j,
                            date: other.date,
                            startTime: other.startTime
                        });
                    }
                    // Check if same room
                    if (cls.room && other.room && cls.room === other.room) {
                        batchConflicts.push({
                            type: 'batch-room',
                            batchIndex: j,
                            date: other.date,
                            startTime: other.startTime
                        });
                    }
                    // Check if same class of students
                    if (cls.class === other.class) {
                        batchConflicts.push({
                            type: 'batch-students',
                            batchIndex: j,
                            date: other.date,
                            startTime: other.startTime
                        });
                    }
                }
            }
        }

        results.push({
            index: i,
            date: cls.date,
            startTime: cls.startTime,
            conflicts: conflicts,
            batchConflicts: batchConflicts,
            hasConflicts: conflicts.hasConflicts || batchConflicts.length > 0
        });
    }

    return {
        results,
        hasAnyConflicts: results.some(r => r.hasConflicts),
        totalConflicts: results.filter(r => r.hasConflicts).length
    };
}

module.exports = {
    timeRangesOverlap,
    isSameDay,
    detectInstructorConflicts,
    detectRoomConflicts,
    detectStudentConflicts,
    checkAllConflicts,
    validateBatchClasses
};
