/**
 * Faculty Model
 * Manages faculty/teacher information
 */

const mongoose = require('mongoose');

// Experience schema
const experienceSchema = new mongoose.Schema({
    totalYears: { type: Number, default: 0 },
    teachingSince: { type: Number }, // Year
    previous: [{ type: String }] // Previous work experience
}, { _id: false });

// Main Faculty schema
const facultySchema = new mongoose.Schema({
    // Personal info
    name: {
        type: String,
        required: [true, 'Faculty name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    designation: {
        type: String,
        trim: true,
        default: 'Faculty'
    },
    photo: {
        url: { type: String },
        publicId: { type: String },
        alt: { type: String }
    },

    // Professional details
    subjects: [{
        type: String,
        enum: ['physics', 'chemistry', 'mathematics', 'biology', 'english', 'bangla', 'ict', 'general_knowledge', 'other']
    }],
    qualifications: [{ type: String }],
    experience: { type: experienceSchema, default: () => ({}) },

    // Achievements
    achievements: [{ type: String }],

    // Bio
    bio: {
        type: String,
        maxlength: [1000, 'Bio cannot exceed 1000 characters']
    },

    // Contact (optional)
    contact: {
        email: { type: String },
        phone: { type: String },
        linkedin: { type: String }
    },

    // Display settings
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    showOnHomepage: { type: Boolean, default: true },
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
facultySchema.index({ subjects: 1 });
facultySchema.index({ featured: 1, displayOrder: 1 });
facultySchema.index({ isActive: 1 });
facultySchema.index({ name: 'text', bio: 'text' });

// Static method to find active faculty
facultySchema.statics.findActive = function () {
    return this.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 });
};

// Static method to find featured faculty
facultySchema.statics.findFeatured = function (limit = 4) {
    return this.find({ isActive: true, featured: true })
        .sort({ displayOrder: 1 })
        .limit(limit);
};

// Static method to find by subject
facultySchema.statics.findBySubject = function (subject) {
    return this.find({ isActive: true, subjects: subject })
        .sort({ displayOrder: 1 });
};

const Faculty = mongoose.model('Faculty', facultySchema);

module.exports = Faculty;
