/**
 * Payment Controller
 * Handles payment creation, verification, and management
 */

const Payment = require('../models/Payment');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');
const receiptService = require('../services/receiptService');

/**
 * Get all payments with filters
 */
exports.getAllPayments = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            studentId,
            isVerified,
            paymentMethod,
            fromDate,
            toDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};

        if (studentId) query.studentId = studentId;
        if (isVerified !== undefined) query.isVerified = isVerified === 'true';
        if (paymentMethod) query.paymentMethod = paymentMethod;

        if (fromDate || toDate) {
            query.paymentDate = {};
            if (fromDate) query.paymentDate.$gte = new Date(fromDate);
            if (toDate) query.paymentDate.$lte = new Date(toDate);
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [payments, total] = await Promise.all([
            Payment.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Payment.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                payments,
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
 * Get single payment
 */
exports.getPayment = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            throw new ApiError('Payment not found', 404);
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all payments for a student
 */
exports.getStudentPayments = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId);
        if (!student) {
            throw new ApiError('Student not found', 404);
        }

        const payments = await Payment.find({ studentId })
            .sort({ paymentDate: -1 });

        res.json({
            success: true,
            data: {
                student: {
                    roll: student.roll,
                    name: student.name,
                    totalFee: student.totalFee,
                    paidAmount: student.paidAmount,
                    dueAmount: student.dueAmount
                },
                payments
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new payment record
 */
exports.createPayment = async (req, res, next) => {
    try {
        const {
            studentId,
            amountPaid,
            totalFee,
            paymentMethod,
            paymentDate,
            transactionId,
            notes,
            month,
            paymentType
        } = req.body;

        // Validate student exists
        const student = await Student.findById(studentId);
        if (!student) {
            throw new ApiError('Student not found', 404);
        }

        // Calculate previous due
        const previousDue = student.dueAmount;

        // Use student's totalFee if not provided
        const fee = totalFee || student.totalFee;

        const payment = await Payment.create({
            studentId,
            amountPaid: parseFloat(amountPaid),
            totalFee: fee,
            previousDue,
            paymentMethod: paymentMethod || 'cash',
            paymentDate: paymentDate || new Date(),
            transactionId,
            notes,
            month,
            paymentType: paymentType || 'monthly',
            createdBy: req.user.id,
            isVerified: false
        });

        await AuditLog.log({
            action: 'payment_created',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'payment',
            entityId: payment._id,
            details: {
                studentId,
                studentRoll: student.roll,
                amountPaid,
                paymentMethod
            },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Payment recorded. Please verify to activate student account.',
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify payment - activates student account and generates receipt
 */
exports.verifyPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.body;

        const payment = await Payment.findById(paymentId).setOptions({ skipPopulate: true });

        if (!payment) {
            throw new ApiError('Payment not found', 404);
        }

        if (payment.isVerified) {
            throw new ApiError('Payment already verified', 400);
        }

        const student = await Student.findById(payment.studentId);
        if (!student) {
            throw new ApiError('Student not found', 404);
        }

        // Update payment
        payment.isVerified = true;
        payment.verifiedBy = req.user.id;
        payment.verifiedAt = new Date();
        await payment.save();

        // Update student payment totals (status is always 'active' by default)
        student.paidAmount += payment.amountPaid;
        student.dueAmount = student.totalFee - student.paidAmount;
        await student.save();

        // Generate receipt
        let receiptUrl = null;
        try {
            const isFirstPayment = student.status === 'active' && payment.paymentType === 'admission';
            receiptUrl = await receiptService.generateReceipt(payment._id, isFirstPayment);

            payment.receiptGenerated = true;
            payment.receiptUrl = receiptUrl;
            await payment.save();
        } catch (receiptError) {
            console.error('Receipt generation error:', receiptError);
            // Don't fail the verification if receipt generation fails
        }

        await AuditLog.log({
            action: 'payment_verified',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'payment',
            entityId: payment._id,
            details: {
                studentId: student._id,
                studentRoll: student.roll,
                amountPaid: payment.amountPaid,
                studentActivated: student.status === 'active'
            },
            ipAddress: req.ip
        });

        // Fetch updated payment with populated fields
        const updatedPayment = await Payment.findById(paymentId);

        res.json({
            success: true,
            message: 'Payment verified successfully' + (student.status === 'active' ? '. Student account activated.' : ''),
            data: {
                payment: updatedPayment,
                student: {
                    roll: student.roll,
                    name: student.name,
                    status: student.status,
                    paidAmount: student.paidAmount,
                    dueAmount: student.dueAmount,
                    // Only show credentials on first activation
                    credentials: student.status === 'active' && payment.paymentType === 'admission' ? {
                        roll: student.roll,
                        password: student.phone // The phone is used as initial password
                    } : undefined
                },
                receiptUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update payment (admin/staff can adjust amounts)
 */
exports.updatePayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amountPaid, totalFee, notes, paymentMethod } = req.body;

        const payment = await Payment.findById(id).setOptions({ skipPopulate: true });
        if (!payment) {
            throw new ApiError('Payment not found', 404);
        }

        const student = await Student.findById(payment.studentId);
        if (!student) {
            throw new ApiError('Student not found', 404);
        }

        // If payment was verified and amount is changing, update student totals
        if (payment.isVerified && amountPaid !== undefined) {
            const diff = parseFloat(amountPaid) - payment.amountPaid;
            student.paidAmount += diff;
            student.dueAmount = student.totalFee - student.paidAmount;
            await student.save();
        }

        // Update payment fields
        if (amountPaid !== undefined) payment.amountPaid = parseFloat(amountPaid);
        if (totalFee !== undefined) payment.totalFee = parseFloat(totalFee);
        if (notes !== undefined) payment.notes = notes;
        if (paymentMethod) payment.paymentMethod = paymentMethod;

        await payment.save();

        await AuditLog.log({
            action: 'payment_updated',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'payment',
            entityId: payment._id,
            details: { amountPaid, totalFee },
            ipAddress: req.ip
        });

        const updatedPayment = await Payment.findById(id);

        res.json({
            success: true,
            message: 'Payment updated successfully',
            data: updatedPayment
        });
    } catch (error) {
        next(error);
    }
};
