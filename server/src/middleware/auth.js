/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const { ApiError } = require('./errorHandler');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError('No token provided', 401);
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if it's a student or admin/staff
        if (decoded.role === 'student') {
            const student = await Student.findById(decoded.id).select('-passwordHash');
            if (!student) {
                throw new ApiError('Student not found', 401);
            }
            if (student.status === 'suspended' || student.status === 'inactive') {
                throw new ApiError('Account is not active', 403);
            }
            req.user = {
                id: student._id,
                studentId: student._id,
                roll: student.roll,
                name: student.name,
                class: student.class,
                section: student.section,
                role: 'student'
            };
        } else {
            const user = await User.findById(decoded.id).select('-passwordHash');
            if (!user) {
                throw new ApiError('User not found', 401);
            }
            if (!user.isActive) {
                throw new ApiError('Account is deactivated', 403);
            }
            req.user = {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            };
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
            });
        }
        next(error);
    }
};

/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this resource'
            });
        }

        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role === 'student') {
            const student = await Student.findById(decoded.id).select('-passwordHash');
            if (student && student.status === 'active') {
                req.user = {
                    id: student._id,
                    studentId: student._id,
                    roll: student.roll,
                    name: student.name,
                    class: student.class,
                    section: student.section,
                    role: 'student'
                };
            }
        } else {
            const user = await User.findById(decoded.id).select('-passwordHash');
            if (user && user.isActive) {
                req.user = {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
            }
        }

        next();
    } catch (error) {
        // Token invalid or expired, continue without user
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    optionalAuth
};
