/**
 * Dashboard Controller
 * Provides stats and analytics for admin dashboard
 */

const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Test = require('../models/Test');
const Result = require('../models/Result');
const AuditLog = require('../models/AuditLog');

/**
 * Get dashboard statistics
 */
exports.getStats = async (req, res, next) => {
    try {
        const [
            totalStudents,
            activeStudents,
            pendingStudents,
            totalTests,
            totalPayments,
            recentPayments
        ] = await Promise.all([
            Student.countDocuments(),
            Student.countDocuments({ status: 'active' }),
            Student.countDocuments({ status: 'pending_payment' }),
            Test.countDocuments(),
            Payment.countDocuments({ isVerified: true }),
            Payment.find({ isVerified: true })
                .sort({ paymentDate: -1 })
                .limit(30)
                .select('amountPaid paymentDate')
        ]);

        // Calculate total collection
        const totalCollection = recentPayments.reduce((sum, p) => sum + p.amountPaid, 0);

        // Get class-wise student distribution
        const classDistribution = await Student.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$class', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Get recent dues
        const totalDues = await Student.aggregate([
            { $match: { status: 'active', dueAmount: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$dueAmount' } } }
        ]);

        res.json({
            success: true,
            data: {
                students: {
                    total: totalStudents,
                    active: activeStudents,
                    pending: pendingStudents
                },
                tests: {
                    total: totalTests
                },
                payments: {
                    total: totalPayments,
                    recentCollection: totalCollection,
                    totalDues: totalDues[0]?.total || 0
                },
                classDistribution: classDistribution.map(c => ({
                    class: c._id,
                    count: c.count
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get recent activity
 */
exports.getRecentActivity = async (req, res, next) => {
    try {
        const { limit = 20 } = req.query;

        const activities = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'name email');

        res.json({
            success: true,
            data: activities.map(a => ({
                id: a._id,
                action: a.action,
                user: a.userId?.name || 'System',
                details: a.details,
                timestamp: a.createdAt
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get payment summary
 */
exports.getPaymentSummary = async (req, res, next) => {
    try {
        const { period = 'month' } = req.query;

        let dateFilter = new Date();
        if (period === 'week') {
            dateFilter.setDate(dateFilter.getDate() - 7);
        } else if (period === 'month') {
            dateFilter.setMonth(dateFilter.getMonth() - 1);
        } else if (period === 'year') {
            dateFilter.setFullYear(dateFilter.getFullYear() - 1);
        }

        const payments = await Payment.aggregate([
            {
                $match: {
                    isVerified: true,
                    paymentDate: { $gte: dateFilter }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' }
                    },
                    total: { $sum: '$amountPaid' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Payment method breakdown
        const methodBreakdown = await Payment.aggregate([
            {
                $match: {
                    isVerified: true,
                    paymentDate: { $gte: dateFilter }
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    total: { $sum: '$amountPaid' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                dailyPayments: payments.map(p => ({
                    date: p._id,
                    total: p.total,
                    count: p.count
                })),
                methodBreakdown: methodBreakdown.map(m => ({
                    method: m._id,
                    total: m.total,
                    count: m.count
                })),
                grandTotal: payments.reduce((sum, p) => sum + p.total, 0)
            }
        });
    } catch (error) {
        next(error);
    }
};
