/**
 * Student Model
 * Students enrolled in the coaching center
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    roll: {
        type: String,
        required: [true, 'Roll number is required'],
        unique: true,
        trim: true,
        maxlength: [6, 'Roll number cannot exceed 6 digits'],
        match: [/^\d+$/, 'Roll number must contain only numbers']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    fatherName: {
        type: String,
        trim: true
    },
    motherName: {
        type: String,
        trim: true
    },
    dob: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    class: {
        type: String,
        required: [true, 'Class is required'],
        trim: true
    },
    section: {
        type: String,
        trim: true
    },
    group: {
        type: String,
        trim: true // Science, Commerce, Arts
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    guardianPhone: {
        type: String,
        required: [true, 'Guardian phone is required'],
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    school: {
        type: String,
        trim: true
    },
    photo: {
        type: String // Cloudinary URL
    },
    passwordHash: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending_payment', 'active', 'suspended', 'inactive'],
        default: 'active'
    },
    mustChangePassword: {
        type: Boolean,
        default: true
    },
    totalFee: {
        type: Number,
        required: [true, 'Total fee is required'],
        default: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    dueAmount: {
        type: Number,
        default: 0
    },
    paymentDeadline: {
        type: Date
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastLogin: {
        type: Date
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for faster queries
// Primary lookup indexes
studentSchema.index({ phone: 1 }); // Phone search
studentSchema.index({ email: 1 }, { sparse: true }); // Email lookup (sparse for optional field)

// Compound indexes for common query patterns
studentSchema.index({ class: 1, section: 1 }); // Filter by class and section
studentSchema.index({ class: 1, status: 1 }); // Active students in a class
studentSchema.index({ status: 1, class: 1 }); // All students by status then class
studentSchema.index({ class: 1, enrollmentDate: -1 }); // Recent enrollments by class

// Payment/Fee related queries
studentSchema.index({ status: 1, dueAmount: -1 }); // Students with dues
studentSchema.index({ dueAmount: -1 }); // Sort by due amount

// Date-based queries
studentSchema.index({ enrollmentDate: -1 }); // Recent enrollments
studentSchema.index({ createdAt: -1 }); // Recently added
studentSchema.index({ lastLogin: -1 }, { sparse: true }); // Recently active students

// Text search index for full-text search across multiple fields
studentSchema.index({
    name: 'text',
    roll: 'text',
    phone: 'text',
    school: 'text',
    fatherName: 'text',
    email: 'text'
}, {
    weights: {
        roll: 10,      // Roll number gets highest priority
        name: 8,       // Name is very important
        phone: 6,      // Phone is important
        email: 4,      // Email next
        school: 2,     // School name lower priority
        fatherName: 1  // Father name lowest
    },
    name: 'student_text_search'
});

/**
 * Hash password before saving
 */
studentSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();

    // Only hash if it's not already hashed
    if (!this.passwordHash.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
    next();
});

/**
 * Calculate due amount before saving
 */
studentSchema.pre('save', function (next) {
    this.dueAmount = this.totalFee - this.paidAmount;
    next();
});

/**
 * Compare password with hash
 */
studentSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Transform output (remove sensitive fields)
 */
studentSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    delete obj.__v;
    return obj;
};

/**
 * Generate roll number
 */
/**
 * Generate roll number
 */
studentSchema.statics.generateRoll = async function (classValue, group) {
    // Determine Class Code
    let classCode = classValue.toString();

    // Map special classes like "1st Timer" to single digit codes
    // Map: 1st Timer -> 1, 2nd Timer -> 2
    if (classCode.toLowerCase().includes('1st') || classCode === '11') classCode = '1';
    else if (classCode.toLowerCase().includes('2nd') || classCode === '12') classCode = '2';

    // Determine Group Code
    let groupCode = '0'; // Default no group / general
    if (group) {
        const g = group.toLowerCase();
        if (g === 'science') groupCode = '1';
        else if (g === 'commerce') groupCode = '2';
        else if (g === 'arts') groupCode = '3';
    }

    // Prefix construction
    // standard: ClassCode + GroupCode
    const prefix = `${classCode}${groupCode}`;

    // Find the last roll for this prefix
    const lastStudent = await this.findOne({
        roll: new RegExp(`^${prefix}\\d+$`)
    }).sort({ roll: -1 });

    let nextSequence = 1;

    if (lastStudent) {
        const rollStr = lastStudent.roll;
        if (rollStr.startsWith(prefix)) {
            const sequenceStr = rollStr.substring(prefix.length);
            const lastSequence = parseInt(sequenceStr);
            if (!isNaN(lastSequence)) {
                nextSequence = lastSequence + 1;
            }
        }
    }

    const sequencePadding = 3;

    return `${prefix}${nextSequence.toString().padStart(sequencePadding, '0')}`;
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
