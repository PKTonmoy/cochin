/**
 * Topper Model
 * Manages student results and top rankers
 */

const mongoose = require('mongoose');

// Subject score schema
const subjectScoreSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    score: { type: Number },
    maxScore: { type: Number }
}, { _id: false });

// Main Topper schema
const topperSchema = new mongoose.Schema({
    // Student info
    studentName: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true
    },
    photo: {
        url: { type: String },
        publicId: { type: String },
        alt: { type: String }
    },

    // Achievement details
    exam: {
        type: String,
        required: [true, 'Exam name is required'],
        enum: ['jee_main', 'jee_advanced', 'neet', 'buet', 'du_ka', 'du_kha', 'du_cha', 'du_gha', 'medical', 'engineering', 'hsc', 'ssc', 'other']
    },
    examName: { type: String }, // Display name if different from enum
    year: {
        type: Number,
        required: [true, 'Year is required']
    },
    rank: { type: String }, // e.g., "AIR 12", "Merit 45"
    score: { type: Number },
    maxScore: { type: Number },
    percentile: { type: Number },

    // Subject-wise breakdown
    subjectScores: [subjectScoreSchema],

    // Course reference
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    courseName: { type: String }, // Fallback if course deleted
    batch: { type: String }, // e.g., "2024-2026 Morning"

    // Success story
    successStory: {
        type: String,
        maxlength: [2000, 'Success story cannot exceed 2000 characters']
    },
    videoUrl: { type: String }, // YouTube/Vimeo link

    // College/Institution they got into
    institution: { type: String },

    // Display settings
    featured: { type: Boolean, default: false },
    showOnHomepage: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // Tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
topperSchema.index({ exam: 1, year: -1 });
topperSchema.index({ year: -1 });
topperSchema.index({ featured: 1, displayOrder: 1 });
topperSchema.index({ course: 1 });
topperSchema.index({ isActive: 1 });
topperSchema.index({ studentName: 'text', successStory: 'text' });

// Static method to find by year
topperSchema.statics.findByYear = function (year) {
    return this.find({ year, isActive: true })
        .populate('course', 'name slug')
        .sort({ displayOrder: 1, rank: 1 });
};

// Static method to find by exam
topperSchema.statics.findByExam = function (exam, limit = 10) {
    return this.find({ exam, isActive: true })
        .populate('course', 'name slug')
        .sort({ year: -1, displayOrder: 1 })
        .limit(limit);
};

// Static method to find featured toppers
topperSchema.statics.findFeatured = function (limit = 6) {
    return this.find({ isActive: true, featured: true })
        .populate('course', 'name slug')
        .sort({ displayOrder: 1, year: -1 })
        .limit(limit);
};

// Static method for homepage display
topperSchema.statics.findForHomepage = function (limit = 3) {
    return this.find({ isActive: true, showOnHomepage: true })
        .sort({ displayOrder: 1, year: -1 })
        .limit(limit);
};

const Topper = mongoose.model('Topper', topperSchema);

module.exports = Topper;
