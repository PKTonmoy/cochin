/**
 * Course Model
 * Manages coaching courses/programs
 */

const mongoose = require('mongoose');

// Pricing schema
const pricingSchema = new mongoose.Schema({
    original: { type: Number, required: true },
    discounted: { type: Number },
    discount: { type: Number }, // Percentage
    emiAvailable: { type: Boolean, default: false },
    emiStarting: { type: Number }
}, { _id: false });

// Syllabus topic schema
const syllabusSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    lectures: { type: Number, default: 0 },
    topics: [{ type: String }]
}, { _id: false });

// Main Course schema
const courseSchema = new mongoose.Schema({
    // Basic info
    name: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true,
        maxlength: [200, 'Course name cannot exceed 200 characters']
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    shortDescription: {
        type: String,
        maxlength: [300, 'Short description cannot exceed 300 characters']
    },
    fullDescription: {
        type: String // Rich HTML content
    },
    category: {
        type: String,
        enum: ['medical', 'engineering', 'university', 'hsc', 'ssc', 'foundation', 'other'],
        default: 'other'
    },
    tags: [{ type: String }],

    // Media
    image: {
        url: { type: String },
        publicId: { type: String },
        alt: { type: String }
    },
    gallery: [{
        url: { type: String },
        publicId: { type: String },
        alt: { type: String }
    }],

    // Course details
    duration: { type: String }, // e.g., "2 Years", "6 Months"
    startDate: { type: Date },
    endDate: { type: Date },
    totalSeats: { type: Number },
    availableSeats: { type: Number },
    eligibility: { type: String },

    // Pricing
    pricing: { type: pricingSchema },

    // Syllabus
    syllabus: [syllabusSchema],

    // Faculty (references)
    faculty: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty'
    }],

    // Study materials included
    studyMaterials: [{
        type: String,
        enum: ['printed_books', 'online_notes', 'practice_papers', 'video_lectures', 'live_classes', 'doubt_sessions']
    }],

    // Features and highlights
    features: [{ type: String }],

    // SEO
    seo: {
        metaTitle: { type: String },
        metaDescription: { type: String, maxlength: 160 },
        keywords: [{ type: String }]
    },

    // Display settings
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    showOnHomepage: { type: Boolean, default: true },

    // Tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
courseSchema.index({ slug: 1 }, { unique: true });
courseSchema.index({ category: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ featured: 1, displayOrder: 1 });
courseSchema.index({ 'pricing.discounted': 1 });
courseSchema.index({ name: 'text', shortDescription: 'text', tags: 'text' });

// Pre-save: auto-generate slug if not provided
courseSchema.pre('save', function (next) {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    // Calculate discount percentage
    if (this.pricing && this.pricing.original && this.pricing.discounted) {
        this.pricing.discount = Math.round(
            ((this.pricing.original - this.pricing.discounted) / this.pricing.original) * 100
        );
    }

    next();
});

// Static method to find published courses
courseSchema.statics.findPublished = function (category = null) {
    const query = { status: 'published' };
    if (category) query.category = category;
    return this.find(query)
        .populate('faculty', 'name designation photo')
        .sort({ displayOrder: 1, createdAt: -1 });
};

// Static method to find featured courses
courseSchema.statics.findFeatured = function (limit = 6) {
    return this.find({ status: 'published', featured: true })
        .populate('faculty', 'name designation photo')
        .sort({ displayOrder: 1 })
        .limit(limit);
};

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
