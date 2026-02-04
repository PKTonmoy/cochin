/**
 * Testimonial Model
 * Manages student testimonials and reviews
 */

const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
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

    // Course reference
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    courseName: { type: String }, // Fallback or custom name

    // Achievement (if any)
    achievement: { type: String }, // e.g., "BUET CSE", "Dhaka Medical"
    year: { type: Number },

    // Testimonial content
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    quote: {
        type: String,
        required: [true, 'Testimonial quote is required'],
        maxlength: [1000, 'Quote cannot exceed 1000 characters']
    },
    shortQuote: {
        type: String,
        maxlength: [200, 'Short quote cannot exceed 200 characters']
    },

    // Video testimonial (optional)
    videoUrl: { type: String },
    videoThumbnail: {
        url: { type: String },
        publicId: { type: String }
    },

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
testimonialSchema.index({ featured: 1, displayOrder: 1 });
testimonialSchema.index({ course: 1 });
testimonialSchema.index({ isActive: 1 });
testimonialSchema.index({ rating: -1 });

// Virtual for display rating (stars)
testimonialSchema.virtual('stars').get(function () {
    return '⭐'.repeat(this.rating);
});

// Static method to find active testimonials
testimonialSchema.statics.findActive = function () {
    return this.find({ isActive: true })
        .populate('course', 'name slug')
        .sort({ displayOrder: 1, createdAt: -1 });
};

// Static method to find featured
testimonialSchema.statics.findFeatured = function (limit = 6) {
    return this.find({ isActive: true, featured: true })
        .populate('course', 'name slug')
        .sort({ displayOrder: 1 })
        .limit(limit);
};

// Static method for homepage
testimonialSchema.statics.findForHomepage = function (limit = 4) {
    return this.find({ isActive: true, showOnHomepage: true })
        .sort({ displayOrder: 1, rating: -1 })
        .limit(limit);
};

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

module.exports = Testimonial;
