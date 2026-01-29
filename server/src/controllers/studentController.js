/**
 * Student Controller
 * Handles student CRUD and dashboard
 */

const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Result = require('../models/Result');
const Schedule = require('../models/Schedule');
const Test = require('../models/Test');
const AuditLog = require('../models/AuditLog');
const { uploadImage } = require('../config/cloudinary');
const { ApiError } = require('../middleware/errorHandler');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

/**
 * Get all students with filters and pagination
 */
exports.getAllStudents = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            class: classFilter,
            section,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};

        // Search by name or roll
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { roll: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        if (classFilter) query.class = classFilter;
        if (section) query.section = section;
        if (status) query.status = status;

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [students, total] = await Promise.all([
            Student.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', 'name email'),
            Student.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                students,
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
 * Get single student by ID
 */
exports.getStudent = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!student) {
            throw new ApiError('Student not found', 404);
        }

        // Get payment history
        const payments = await Payment.find({ studentId: student._id })
            .sort({ paymentDate: -1 })
            .limit(10);

        // Get recent results
        const results = await Result.find({ studentId: student._id })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                student,
                payments,
                results
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new student
 */
exports.createStudent = async (req, res, next) => {
    try {
        const {
            name,
            fatherName,
            motherName,
            dob,
            gender,
            class: classValue,
            section,
            group,
            phone,
            guardianPhone,
            email,
            address,
            school,
            totalFee,
            advancePayment,
            paymentDeadline,
            paymentMethod,
            notes
        } = req.body;

        // Generate roll number
        const roll = await Student.generateRoll(classValue, group);

        // Password is the phone number
        const password = phone;

        // Upload photo if provided
        let photoUrl = null;
        if (req.file) {
            const result = await uploadImage(req.file.path, 'paragon/students');
            if (result.success) {
                photoUrl = result.url;
            }
            // Clean up local file
            fs.unlinkSync(req.file.path);
        }

        // Parse payment amounts
        const parsedTotalFee = parseFloat(totalFee) || 0;
        const parsedAdvance = parseFloat(advancePayment) || 0;

        // Helper to sanitize dates
        const sanitizeDate = (date) => (date && date !== '' && date !== 'null' && date !== 'undefined') ? date : null;

        const student = await Student.create({
            roll,
            name,
            fatherName,
            motherName,
            dob: sanitizeDate(dob),
            gender,
            class: classValue,
            section,
            group,
            phone,
            guardianPhone,
            email: email || undefined, // Avoid empty string unique constraint issues if any
            address,
            school,
            photo: photoUrl,
            passwordHash: password, // Will be hashed by pre-save hook
            totalFee: parsedTotalFee,
            paidAmount: parsedAdvance,
            paymentDeadline: sanitizeDate(paymentDeadline),
            status: 'active', // All students are active by default, dues don't affect access
            createdBy: req.user.id,
            notes
        });

        // If there's an advance payment, create a payment record
        let paymentRecord = null;
        if (parsedAdvance > 0) {
            paymentRecord = await Payment.create({
                studentId: student._id,
                amountPaid: parsedAdvance,
                totalFee: parsedTotalFee,
                paymentDate: new Date(),
                paymentMethod: paymentMethod || 'cash',
                paymentType: 'admission',
                isVerified: true,
                verifiedBy: req.user.id,
                verifiedAt: new Date(),
                createdBy: req.user.id,
                notes: 'Advance payment during enrollment'
            });
        }

        // Log the action
        await AuditLog.log({
            action: 'student_created',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'student',
            entityId: student._id,
            details: {
                roll,
                name,
                class: classValue,
                status: student.status,
                advancePayment: parsedAdvance,
                receiptId: paymentRecord?.receiptId
            },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Student created and activated successfully!',
            data: {
                student,
                credentials: {
                    roll,
                    password: phone // Show password only on creation
                },
                payment: paymentRecord ? {
                    receiptId: paymentRecord.receiptId,
                    amountPaid: paymentRecord.amountPaid,
                    totalFee: paymentRecord.totalFee,
                    dueAmount: paymentRecord.dueAmount,
                    paymentMethod: paymentRecord.paymentMethod,
                    paymentDate: paymentRecord.paymentDate
                } : null
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update student
 */
exports.updateStudent = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            throw new ApiError('Student not found', 404);
        }

        const updateFields = { ...req.body };
        delete updateFields.roll; // Roll cannot be changed
        delete updateFields.passwordHash;
        // status can now be updated manually by admin

        // Upload new photo if provided
        if (req.file) {
            const result = await uploadImage(req.file.path, 'paragon/students');
            if (result.success) {
                updateFields.photo = result.url;
            }
            fs.unlinkSync(req.file.path);
        }

        // Handle totalFee update - recalculate due
        if (updateFields.totalFee !== undefined) {
            updateFields.totalFee = parseFloat(updateFields.totalFee);
            updateFields.dueAmount = updateFields.totalFee - student.paidAmount;
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        );

        await AuditLog.log({
            action: 'student_updated',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'student',
            entityId: student._id,
            details: { changes: Object.keys(updateFields) },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Student updated successfully',
            data: updatedStudent
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete student (hard delete)
 */
exports.deleteStudent = async (req, res, next) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);

        if (!student) {
            throw new ApiError('Student not found', 404);
        }

        await AuditLog.log({
            action: 'student_deleted',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'student',
            entityId: student._id,
            details: { roll: student.roll, name: student.name },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get student dashboard (for student portal)
 */
exports.getStudentDashboard = async (req, res, next) => {
    try {
        const { roll } = req.params;

        // Verify the student is accessing their own dashboard
        if (req.user.role === 'student' && req.user.roll !== roll.toUpperCase()) {
            throw new ApiError('Not authorized to access this dashboard', 403);
        }

        const student = await Student.findOne({ roll: roll.toUpperCase() });

        if (!student) {
            throw new ApiError('Student not found', 404);
        }

        // Get next class schedule
        const today = new Date();
        const dayOfWeek = today.getDay();

        const nextClass = await Schedule.findOne({
            class: student.class,
            section: student.section || { $exists: true },
            dayOfWeek: { $gte: dayOfWeek },
            isActive: true
        }).sort({ dayOfWeek: 1, startTime: 1 });

        // Get upcoming tests
        const upcomingTests = await Test.find({
            class: student.class,
            date: { $gte: today },
            isPublished: true
        }).sort({ date: 1 }).limit(5);

        // Get recent results
        const recentResults = await Result.find({
            studentId: student._id
        }).sort({ createdAt: -1 }).limit(10);

        // Get payment info
        const payments = await Payment.find({
            studentId: student._id,
            isVerified: true
        }).sort({ paymentDate: -1 }).limit(5);

        res.json({
            success: true,
            data: {
                student: {
                    roll: student.roll,
                    name: student.name,
                    class: student.class,
                    section: student.section,
                    photo: student.photo,
                    totalFee: student.totalFee,
                    paidAmount: student.paidAmount,
                    dueAmount: student.dueAmount
                },
                nextClass,
                upcomingTests,
                recentResults,
                recentPayments: payments
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Export students to Excel
 */
exports.exportStudents = async (req, res, next) => {
    try {
        const { class: classFilter, status } = req.query;

        const query = {};
        if (classFilter) query.class = classFilter;
        if (status) query.status = status;

        const students = await Student.find(query).sort({ class: 1, roll: 1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Students');

        worksheet.columns = [
            { header: 'Roll', key: 'roll', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Class', key: 'class', width: 10 },
            { header: 'Section', key: 'section', width: 10 },
            { header: "Father's Name", key: 'fatherName', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Guardian Phone', key: 'guardianPhone', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Total Fee', key: 'totalFee', width: 12 },
            { header: 'Paid', key: 'paidAmount', width: 12 },
            { header: 'Due', key: 'dueAmount', width: 12 },
            { header: 'Enrollment Date', key: 'enrollmentDate', width: 15 }
        ];

        students.forEach(student => {
            worksheet.addRow({
                roll: student.roll,
                name: student.name,
                class: student.class,
                section: student.section,
                fatherName: student.fatherName,
                phone: student.phone,
                guardianPhone: student.guardianPhone,
                status: student.status,
                totalFee: student.totalFee,
                paidAmount: student.paidAmount,
                dueAmount: student.dueAmount,
                enrollmentDate: student.enrollmentDate?.toLocaleDateString()
            });
        });

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        const filename = `students-export-${Date.now()}.xlsx`;
        const filepath = path.join(__dirname, '../../uploads', filename);
        await workbook.xlsx.writeFile(filepath);

        res.download(filepath, filename, (err) => {
            if (err) console.error('Download error:', err);
            // Clean up file after download
            fs.unlink(filepath, () => { });
        });
    } catch (error) {
        next(error);
    }
};
