/**
 * Receipt Controller
 * Handles receipt viewing, downloading, and emailing
 */

const Payment = require('../models/Payment');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const receiptService = require('../services/receiptService');
const { ApiError } = require('../middleware/errorHandler');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Get receipt HTML for viewing
 */
exports.getReceipt = async (req, res, next) => {
    try {
        const { receiptId } = req.params;

        const payment = await Payment.findOne({ receiptId });
        if (!payment) {
            throw new ApiError('Receipt not found', 404);
        }

        // Check authorization
        if (req.user) {
            if (req.user.role === 'student') {
                const student = await Student.findById(payment.studentId);
                if (!student || student.roll !== req.user.roll) {
                    throw new ApiError('Not authorized to view this receipt', 403);
                }
            }
        }

        const html = await receiptService.getReceiptHTML(receiptId);

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        next(error);
    }
};

/**
 * Download receipt as PDF
 */
exports.downloadPDF = async (req, res, next) => {
    try {
        const { receiptId } = req.params;

        const payment = await Payment.findOne({ receiptId });
        if (!payment) {
            throw new ApiError('Receipt not found', 404);
        }

        // Check if PDF exists
        if (payment.receiptUrl) {
            // If it's a Cloudinary URL, redirect
            if (payment.receiptUrl.startsWith('http')) {
                return res.redirect(payment.receiptUrl);
            }

            // If it's a local path, send file
            const relativePath = payment.receiptUrl.startsWith('/') ? payment.receiptUrl.slice(1) : payment.receiptUrl;
            const localPath = path.join(__dirname, '../..', relativePath);
            if (fs.existsSync(localPath)) {
                return res.download(localPath, `receipt-${receiptId}.pdf`);
            }
        }

        // Generate PDF if not exists
        const pdfUrl = await receiptService.generateReceipt(payment._id, false);

        if (pdfUrl.startsWith('http')) {
            return res.redirect(pdfUrl);
        }

        const relativePath = pdfUrl.startsWith('/') ? pdfUrl.slice(1) : pdfUrl;
        const localPath = path.join(__dirname, '../..', relativePath);
        res.download(localPath, `receipt-${receiptId}.pdf`);
    } catch (error) {
        next(error);
    }
};

/**
 * Email receipt to student
 */
exports.emailReceipt = async (req, res, next) => {
    try {
        const { receiptId } = req.params;

        const payment = await Payment.findOne({ receiptId }).setOptions({ skipPopulate: true });
        if (!payment) {
            throw new ApiError('Receipt not found', 404);
        }

        const student = await Student.findById(payment.studentId);
        if (!student) {
            throw new ApiError('Student not found', 404);
        }

        if (!student.email) {
            throw new ApiError('Student does not have an email address', 400);
        }

        // Generate PDF if not exists
        let pdfPath;
        if (payment.receiptUrl && !payment.receiptUrl.startsWith('http')) {
            const relativePath = payment.receiptUrl.startsWith('/') ? payment.receiptUrl.slice(1) : payment.receiptUrl;
            pdfPath = path.join(__dirname, '../..', relativePath);
        } else {
            const pdfUrl = await receiptService.generateReceipt(payment._id, false);
            const relativePath = pdfUrl.startsWith('/') ? pdfUrl.slice(1) : pdfUrl;
            pdfPath = path.join(__dirname, '../..', relativePath);
        }

        // Create email transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'PARAGON Coaching <noreply@paragon.com>',
            to: student.email,
            subject: `Payment Receipt - ${receiptId}`,
            html: `
        <h2>Payment Receipt</h2>
        <p>Dear ${student.name},</p>
        <p>Please find attached your payment receipt.</p>
        <p><strong>Receipt ID:</strong> ${receiptId}</p>
        <p><strong>Amount Paid:</strong> ৳${payment.amountPaid.toLocaleString()}</p>
        <p><strong>Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}</p>
        <br>
        <p>Thank you for your payment.</p>
        <p>PARAGON Coaching Center</p>
      `,
            attachments: [
                {
                    filename: `receipt-${receiptId}.pdf`,
                    path: pdfPath
                }
            ]
        });

        await AuditLog.log({
            action: 'receipt_emailed',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'payment',
            entityId: payment._id,
            details: { receiptId, email: student.email },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: `Receipt sent to ${student.email}`
        });
    } catch (error) {
        next(error);
    }
};
