/**
 * Payment Model
 * Tracks all payments made by students
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentSchema = new mongoose.Schema({
    receiptId: {
        type: String,
        unique: true,
        default: () => `RCP-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required']
    },
    amountPaid: {
        type: Number,
        required: [true, 'Amount paid is required'],
        min: [0, 'Amount cannot be negative']
    },
    totalFee: {
        type: Number,
        required: [true, 'Total fee is required'],
        min: [0, 'Total fee cannot be negative']
    },
    dueAmount: {
        type: Number,
        default: 0
    },
    previousDue: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'card', 'other'],
        default: 'cash'
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    transactionId: {
        type: String,
        trim: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    receiptGenerated: {
        type: Boolean,
        default: false
    },
    receiptUrl: {
        type: String
    },
    notes: {
        type: String,
        trim: true
    },
    month: {
        type: String, // e.g., "January 2024"
        trim: true
    },
    paymentType: {
        type: String,
        enum: ['admission', 'monthly', 'exam_fee', 'other'],
        default: 'monthly'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for faster queries
// Primary lookup indexes
paymentSchema.index({ studentId: 1 }); // All payments for a student
paymentSchema.index({ receiptId: 1 }); // Receipt lookup
paymentSchema.index({ transactionId: 1 }, { sparse: true }); // Transaction ID lookup

// Date-based queries
paymentSchema.index({ paymentDate: -1 }); // Recent payments
paymentSchema.index({ createdAt: -1 }); // Recently added
paymentSchema.index({ studentId: 1, paymentDate: -1 }); // Student's payment history

// Verification and status queries
paymentSchema.index({ isVerified: 1, createdAt: -1 }); // Pending verifications
paymentSchema.index({ isVerified: 1, paymentDate: -1 }); // Verified payments by date

// Payment method and type filtering
paymentSchema.index({ paymentMethod: 1, paymentDate: -1 }); // Payments by method
paymentSchema.index({ paymentType: 1, paymentDate: -1 }); // Payments by type

// Financial reports
paymentSchema.index({ paymentDate: -1, amountPaid: -1 }); // Revenue reports
paymentSchema.index({ month: 1 }, { sparse: true }); // Monthly payments

// Compound index for admin dashboard
paymentSchema.index({ isVerified: 1, paymentType: 1, paymentDate: -1 }); // Admin filtering

/**
 * Calculate due amount before saving
 */
paymentSchema.pre('save', function (next) {
    this.dueAmount = this.totalFee - this.amountPaid + this.previousDue;
    next();
});

/**
 * Populate student and verifier on find
 */
paymentSchema.pre(/^find/, function (next) {
    if (!this.getOptions().skipPopulate) {
        this.populate('studentId', 'roll name class section phone')
            .populate('verifiedBy', 'name email')
            .populate('createdBy', 'name email');
    }
    next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
