const Lead = require('../models/Lead');
const { ApiError } = require('../middleware/errorHandler');

// @desc    Create new lead (Public)
// @route   POST /api/leads
// @access  Public
exports.createLead = async (req, res, next) => {
    try {
        const { name, phone, class: className } = req.body;

        if (!name || !phone) {
            throw new ApiError('Please provide name and phone number', 400);
        }

        const lead = await Lead.create({
            name,
            phone,
            class: className
        });

        res.status(201).json({
            success: true,
            data: lead,
            message: 'Thank you for your interest! We will contact you soon.'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all leads (Admin)
// @route   GET /api/leads
// @access  Private/Admin
exports.getLeads = async (req, res, next) => {
    try {
        // Filtering
        const queryObj = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Advanced filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Search by name or phone
        if (req.query.search) {
            const searchRegex = { $regex: req.query.search, $options: 'i' };
            const searchQuery = JSON.parse(queryStr);
            delete searchQuery.search;

            searchQuery.$or = [
                { name: searchRegex },
                { phone: searchRegex },
                { class: searchRegex }
            ];

            queryStr = JSON.stringify(searchQuery);
        }

        let query = Lead.find(JSON.parse(queryStr));

        // Sorting
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Lead.countDocuments(JSON.parse(queryStr));

        query = query.skip(startIndex).limit(limit);

        const leads = await query;

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        res.status(200).json({
            success: true,
            count: leads.length,
            total,
            pagination,
            data: leads
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update lead status (Admin)
// @route   PATCH /api/leads/:id
// @access  Private/Admin
exports.updateLead = async (req, res, next) => {
    try {
        let lead = await Lead.findById(req.params.id);

        if (!lead) {
            throw new ApiError(`Lead not found with id of ${req.params.id}`, 404);
        }

        lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: lead
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete lead (Admin)
// @route   DELETE /api/leads/:id
// @access  Private/Admin
exports.deleteLead = async (req, res, next) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            throw new ApiError(`Lead not found with id of ${req.params.id}`, 404);
        }

        await lead.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
