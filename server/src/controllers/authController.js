/**
 * Authentication Controller
 * Handles all authentication logic
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Generate JWT tokens
 */
const generateTokens = (user, role) => {
    const accessToken = jwt.sign(
        { id: user._id, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user._id, role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

/**
 * Admin/Staff Login
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ApiError('Email and password are required', 400);
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            throw new ApiError('Invalid credentials', 401);
        }

        // Check if account is locked
        if (user.isLocked()) {
            throw new ApiError('Account is locked. Please try again later.', 423);
        }

        // Check if account is active
        if (!user.isActive) {
            throw new ApiError('Account is deactivated', 403);
        }

        // Verify password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            await user.incrementLoginAttempts();
            throw new ApiError('Invalid credentials', 401);
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user, user.role);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        // Log the action
        await AuditLog.log({
            action: 'user_login',
            userId: user._id,
            userRole: user.role,
            entityType: 'user',
            entityId: user._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    mustChangePassword: user.mustChangePassword
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Student Login
 */
exports.studentLogin = async (req, res, next) => {
    try {
        const { roll, password } = req.body;

        if (!roll || !password) {
            throw new ApiError('Roll number and password are required', 400);
        }

        const student = await Student.findOne({ roll: roll.toUpperCase() });

        if (!student) {
            throw new ApiError('Invalid credentials', 401);
        }

        // Check if student account is active (only block suspended/inactive)
        if (student.status === 'suspended' || student.status === 'inactive') {
            throw new ApiError('Your account is not active', 403);
        }

        // Verify password
        const isMatch = await student.comparePassword(password);

        if (!isMatch) {
            throw new ApiError('Invalid credentials', 401);
        }

        // Update last login
        student.lastLogin = new Date();
        await student.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(student, 'student');

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                student: {
                    id: student._id,
                    roll: student.roll,
                    name: student.name,
                    class: student.class,
                    section: student.section,
                    mustChangePassword: student.mustChangePassword
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user info
 */
exports.getMe = async (req, res, next) => {
    try {
        if (req.user.role === 'student') {
            const student = await Student.findById(req.user.id);
            res.json({
                success: true,
                data: {
                    id: student._id,
                    roll: student.roll,
                    name: student.name,
                    class: student.class,
                    section: student.section,
                    phone: student.phone,
                    email: student.email,
                    photo: student.photo,
                    role: 'student',
                    mustChangePassword: student.mustChangePassword
                }
            });
        } else {
            const user = await User.findById(req.user.id);
            res.json({
                success: true,
                data: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    role: user.role,
                    mustChangePassword: user.mustChangePassword
                }
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new ApiError('Refresh token is required', 400);
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        let user;
        if (decoded.role === 'student') {
            user = await Student.findById(decoded.id);
        } else {
            user = await User.findById(decoded.id);
            if (user && user.refreshToken !== refreshToken) {
                throw new ApiError('Invalid refresh token', 401);
            }
        }

        if (!user) {
            throw new ApiError('User not found', 401);
        }

        // Generate new tokens
        const tokens = generateTokens(user, decoded.role);

        // Update refresh token for admin/staff
        if (decoded.role !== 'student') {
            user.refreshToken = tokens.refreshToken;
            await user.save();
        }

        res.json({
            success: true,
            data: tokens
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }
        next(error);
    }
};

/**
 * Change password
 */
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            throw new ApiError('Current and new passwords are required', 400);
        }

        if (newPassword.length < 6) {
            throw new ApiError('New password must be at least 6 characters', 400);
        }

        let user;
        if (req.user.role === 'student') {
            user = await Student.findById(req.user.id);
        } else {
            user = await User.findById(req.user.id);
        }

        if (!user) {
            throw new ApiError('User not found', 404);
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            throw new ApiError('Current password is incorrect', 400);
        }

        // Update password
        user.passwordHash = newPassword;
        user.mustChangePassword = false;
        await user.save();

        // Log the action
        await AuditLog.log({
            action: 'password_changed',
            userId: user._id,
            userRole: req.user.role,
            entityType: req.user.role === 'student' ? 'student' : 'user',
            entityId: user._id,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Forgot password - send reset email
 */
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new ApiError('Email is required', 400);
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        // Don't reveal if user exists
        if (user) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

            // TODO: Store reset token and send email
            // For now, just log it
            console.log('Password reset token:', resetToken);

            await AuditLog.log({
                action: 'password_reset',
                userId: user._id,
                userRole: user.role,
                entityType: 'user',
                entityId: user._id,
                details: { email },
                ipAddress: req.ip
            });
        }

        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset password with token
 */
exports.resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            throw new ApiError('Token and new password are required', 400);
        }

        // TODO: Implement token verification and password reset
        // For now, return error
        throw new ApiError('Password reset functionality not fully implemented', 501);
    } catch (error) {
        next(error);
    }
};

/**
 * Logout
 */
exports.logout = async (req, res, next) => {
    try {
        if (req.user.role !== 'student') {
            await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
        }

        await AuditLog.log({
            action: 'user_logout',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: req.user.role === 'student' ? 'student' : 'user',
            entityId: req.user.id,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};
