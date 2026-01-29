/**
 * UploadBatch Model
 * Tracks Excel import batches for results
 */

const mongoose = require('mongoose');

const uploadBatchSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
        trim: true
    },
    originalFilename: {
        type: String,
        trim: true
    },
    uploaderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
    },
    mapping: {
        type: Map,
        of: String,
        default: {}
    },
    totalRows: {
        type: Number,
        default: 0
    },
    insertedCount: {
        type: Number,
        default: 0
    },
    updatedCount: {
        type: Number,
        default: 0
    },
    failedRowsCount: {
        type: Number,
        default: 0
    },
    failedRows: [{
        row: Number,
        data: mongoose.Schema.Types.Mixed,
        error: String
    }],
    fileHash: {
        type: String
    },
    filePath: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'imported', 'partially_imported', 'failed', 'reverted'],
        default: 'pending'
    },
    errorMessage: {
        type: String
    },
    revertedAt: {
        type: Date
    },
    revertedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
// Primary lookup indexes
uploadBatchSchema.index({ uploaderId: 1 }); // Batches by uploader
uploadBatchSchema.index({ testId: 1 }); // Batches for a test
uploadBatchSchema.index({ fileHash: 1 }, { sparse: true }); // Duplicate detection

// Status-based queries
uploadBatchSchema.index({ status: 1 }); // Filter by status
uploadBatchSchema.index({ status: 1, createdAt: -1 }); // Recent by status
uploadBatchSchema.index({ uploaderId: 1, status: 1 }); // User's batches by status

// Date-based queries
uploadBatchSchema.index({ createdAt: -1 }); // Recent batches
uploadBatchSchema.index({ testId: 1, createdAt: -1 }); // Test batches by date

// Reversion tracking
uploadBatchSchema.index({ revertedAt: -1 }, { sparse: true }); // Recently reverted

/**
 * Populate uploader on find
 */
uploadBatchSchema.pre(/^find/, function (next) {
    if (!this.getOptions().skipPopulate) {
        this.populate('uploaderId', 'name email')
            .populate('revertedBy', 'name email');
    }
    next();
});

const UploadBatch = mongoose.model('UploadBatch', uploadBatchSchema);

module.exports = UploadBatch;
