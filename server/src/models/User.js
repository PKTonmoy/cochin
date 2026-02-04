/**
 * User Model
 * Admin and Staff users for the coaching center
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'staff'],
        default: 'staff'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    mustChangePassword: {
        type: Boolean,
        default: false
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    lastLogin: {
        type: Date
    },
    refreshToken: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for faster queries (email has unique: true which auto-creates index)
userSchema.index({ role: 1 }); // Role filtering
userSchema.index({ isActive: 1 }); // Active users
userSchema.index({ role: 1, isActive: 1 }); // Active users by role
userSchema.index({ lastLogin: -1 }, { sparse: true }); // Recently active users
userSchema.index({ createdAt: -1 }); // Recently created

// Text search for user name
userSchema.index({ name: 'text', email: 'text' }, {
    weights: { name: 2, email: 1 },
    name: 'user_text_search'
});

/**
 * Hash password before saving
 */
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();

    // Only hash if it's not already hashed (bcrypt hashes start with $2)
    if (!this.passwordHash.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
    next();
});

/**
 * Compare password with hash
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Check if account is locked
 */
userSchema.methods.isLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
};

/**
 * Increment failed login attempts
 */
userSchema.methods.incrementLoginAttempts = async function () {
    const lockoutAttempts = parseInt(process.env.ACCOUNT_LOCKOUT_ATTEMPTS) || 5;
    const lockoutDuration = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MS) || 30 * 60 * 1000;

    // If we have a previous lock that has expired, reset
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { failedLoginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    const updates = { $inc: { failedLoginAttempts: 1 } };

    // Lock account if we've reached max attempts
    if (this.failedLoginAttempts + 1 >= lockoutAttempts) {
        updates.$set = { lockUntil: Date.now() + lockoutDuration };
    }

    return this.updateOne(updates);
};

/**
 * Reset login attempts on successful login
 */
userSchema.methods.resetLoginAttempts = function () {
    return this.updateOne({
        $set: { failedLoginAttempts: 0, lastLogin: new Date() },
        $unset: { lockUntil: 1 }
    });
};

/**
 * Transform output (remove sensitive fields)
 */
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    delete obj.refreshToken;
    delete obj.__v;
    return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
