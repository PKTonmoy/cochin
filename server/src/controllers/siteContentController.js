/**
 * Site Content Controller
 * Handles editable content for landing page
 */

const SiteContent = require('../models/SiteContent');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');
const cloudinary = require('cloudinary').v2;

// Helper function to upload buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto',
                transformation: [
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve({
                    success: true,
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
        );
        uploadStream.end(buffer);
    });
};

/**
 * Get all site content
 */
exports.getAllContent = async (req, res, next) => {
    try {
        const content = await SiteContent.find({ isActive: true })
            .sort({ order: 1 })
            .select('-updatedBy -__v');

        // Convert to object keyed by sectionKey
        const contentMap = {};
        content.forEach(item => {
            contentMap[item.sectionKey] = {
                title: item.title,
                content: item.content,
                order: item.order
            };
        });

        res.json({
            success: true,
            data: contentMap
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single content section
 */
exports.getContent = async (req, res, next) => {
    try {
        const { key } = req.params;

        const content = await SiteContent.findOne({ sectionKey: key.toLowerCase() });

        if (!content) {
            // Return empty content instead of error for frontend flexibility
            return res.json({
                success: true,
                data: {
                    sectionKey: key,
                    title: '',
                    content: {}
                }
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update content section
 */
exports.updateContent = async (req, res, next) => {
    try {
        const { key } = req.params;
        const { title, content, order, isActive } = req.body;

        // Handle uploaded images (now using buffer)
        const uploadedImages = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const result = await uploadBufferToCloudinary(file.buffer, 'paragon/site');
                    if (result.success) {
                        uploadedImages.push({
                            url: result.url,
                            publicId: result.publicId
                        });
                    }
                } catch (uploadErr) {
                    console.error('Image upload error:', uploadErr);
                }
            }
        }

        // Parse content if it's a string
        let parsedContent = content;
        if (typeof content === 'string') {
            try {
                parsedContent = JSON.parse(content);
            } catch {
                parsedContent = { text: content };
            }
        }

        // Add uploaded images to content
        if (uploadedImages.length > 0) {
            parsedContent = parsedContent || {};
            parsedContent.uploadedImages = [
                ...(parsedContent.uploadedImages || []),
                ...uploadedImages
            ];
        }

        const updateData = {
            updatedBy: req.user.id
        };

        if (title !== undefined) updateData.title = title;
        if (parsedContent !== undefined) updateData.content = parsedContent;
        if (order !== undefined) updateData.order = parseInt(order);
        if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

        const updatedContent = await SiteContent.findOneAndUpdate(
            { sectionKey: key.toLowerCase() },
            { $set: updateData },
            { new: true, upsert: true, runValidators: true }
        );

        await AuditLog.log({
            action: 'site_content_updated',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'site_content',
            entityId: updatedContent._id,
            details: { sectionKey: key },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Content updated successfully',
            data: updatedContent
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload image for site content
 */
exports.uploadContentImage = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new ApiError('No file uploaded', 400);
        }

        const result = await uploadBufferToCloudinary(req.file.buffer, 'paragon/site');

        if (!result.success) {
            throw new ApiError('Image upload failed', 500);
        }

        res.json({
            success: true,
            data: {
                url: result.url,
                publicId: result.publicId
            }
        });
    } catch (error) {
        next(error);
    }
};
