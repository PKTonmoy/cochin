/**
 * Media Controller
 * Handles media library operations with Cloudinary
 */

const Media = require('../models/Media');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');
const cloudinary = require('cloudinary').v2;

// Configure cloudinary (should be in config, but fallback here)
if (!cloudinary.config().cloud_name) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

/**
 * Get all media (admin)
 */
exports.getAllMedia = async (req, res, next) => {
    try {
        const {
            type,
            folder,
            search,
            page = 1,
            limit = 50,
            sort = '-createdAt'
        } = req.query;

        const query = {};

        if (type) query.type = type;
        if (folder) query.folder = folder;
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [media, total, folders] = await Promise.all([
            Media.find(query)
                .populate('uploadedBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Media.countDocuments(query),
            Media.getFolders()
        ]);

        res.json({
            success: true,
            data: media,
            folders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single media item
 */
exports.getMedia = async (req, res, next) => {
    try {
        const { id } = req.params;

        const media = await Media.findById(id);

        if (!media) {
            throw new ApiError('Media not found', 404);
        }

        res.json({
            success: true,
            data: media
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload media to Cloudinary
 */
exports.uploadMedia = async (req, res, next) => {
    try {
        console.log('[MediaController] uploadMedia called');
        console.log('[MediaController] req.file:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            hasBuffer: !!req.file.buffer
        } : 'NO FILE');

        if (!req.file) {
            console.error('[MediaController] No file in request');
            throw new ApiError('No file uploaded', 400);
        }

        if (!req.file.buffer) {
            console.error('[MediaController] File exists but no buffer');
            throw new ApiError('File buffer is missing', 400);
        }

        const { folder = 'general', alt, title, tags } = req.body;
        console.log('[MediaController] Uploading to folder:', folder);

        // Upload to Cloudinary
        console.log('[MediaController] Starting Cloudinary upload...');
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `paragon/${folder}`,
                    resource_type: 'auto',
                    transformation: [
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) {
                        console.error('[MediaController] Cloudinary error:', error);
                        reject(error);
                    } else {
                        console.log('[MediaController] Cloudinary success:', result?.secure_url);
                        resolve(result);
                    }
                }
            );
            uploadStream.end(req.file.buffer);
        });

        // Determine media type
        let mediaType = 'other';
        if (result.resource_type === 'image') mediaType = 'image';
        else if (result.resource_type === 'video') mediaType = 'video';

        // Generate thumbnail for images
        let thumbnailUrl = null;
        if (mediaType === 'image') {
            thumbnailUrl = cloudinary.url(result.public_id, {
                width: 200,
                height: 200,
                crop: 'fill',
                quality: 'auto'
            });
        }

        // Save to database
        const media = await Media.create({
            filename: req.file.originalname || result.original_filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: result.bytes,
            type: mediaType,
            url: result.secure_url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
            thumbnailUrl,
            width: result.width,
            height: result.height,
            format: result.format,
            alt: alt || '',
            title: title || '',
            folder,
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            uploadedBy: req.user._id
        });

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'upload',
            entity: 'media',
            entityId: media._id,
            details: `Uploaded: ${media.filename}`,
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            data: media,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update media metadata
 */
exports.updateMedia = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { alt, title, folder, tags } = req.body;

        const media = await Media.findByIdAndUpdate(
            id,
            { alt, title, folder, tags },
            { new: true, runValidators: true }
        );

        if (!media) {
            throw new ApiError('Media not found', 404);
        }

        res.json({
            success: true,
            data: media,
            message: 'Media updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete media
 */
exports.deleteMedia = async (req, res, next) => {
    try {
        const { id } = req.params;

        const media = await Media.findById(id);

        if (!media) {
            throw new ApiError('Media not found', 404);
        }

        // Check if media is in use
        if (media.usedIn && media.usedIn.length > 0) {
            throw new ApiError('Media is in use and cannot be deleted', 400);
        }

        // Delete from Cloudinary
        try {
            await cloudinary.uploader.destroy(media.publicId);
        } catch (cloudinaryError) {
            console.error('Cloudinary delete error:', cloudinaryError);
            // Continue with database deletion even if Cloudinary fails
        }

        // Delete from database
        await Media.findByIdAndDelete(id);

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'delete',
            entity: 'media',
            entityId: id,
            details: `Deleted: ${media.filename}`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Media deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Bulk delete media
 */
exports.bulkDelete = async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            throw new ApiError('IDs array is required', 400);
        }

        // Find all media items
        const mediaItems = await Media.find({
            _id: { $in: ids },
            $or: [
                { usedIn: { $size: 0 } },
                { usedIn: { $exists: false } }
            ]
        });

        // Delete from Cloudinary
        const publicIds = mediaItems.map(m => m.publicId);
        if (publicIds.length > 0) {
            try {
                await cloudinary.api.delete_resources(publicIds);
            } catch (cloudinaryError) {
                console.error('Cloudinary bulk delete error:', cloudinaryError);
            }
        }

        // Delete from database
        const result = await Media.deleteMany({ _id: { $in: mediaItems.map(m => m._id) } });

        // Log the action
        await AuditLog.log({
            userId: req.user._id,
            action: 'bulk_delete',
            entity: 'media',
            details: `Deleted ${result.deletedCount} media items`,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: `${result.deletedCount} media items deleted`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get folder list
 */
exports.getFolders = async (req, res, next) => {
    try {
        const folders = await Media.getFolders();

        res.json({
            success: true,
            data: folders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create folder (virtual - just for organization)
 */
exports.createFolder = async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name) {
            throw new ApiError('Folder name is required', 400);
        }

        // Folders are virtual - they exist when media has that folder value
        // We can create a placeholder record or just return success

        res.json({
            success: true,
            data: { folder: name },
            message: 'Folder created. Upload files to this folder to see it.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get media stats
 */
exports.getStats = async (req, res, next) => {
    try {
        const [totalCount, byType, totalSize] = await Promise.all([
            Media.countDocuments(),
            Media.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            Media.aggregate([
                { $group: { _id: null, total: { $sum: '$size' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalCount,
                byType: byType.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                totalSize: totalSize[0]?.total || 0,
                formattedTotalSize: formatBytes(totalSize[0]?.total || 0)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Cloudinary account usage (storage, bandwidth, resources)
 */
exports.getCloudinaryUsage = async (req, res, next) => {
    try {
        const usage = await cloudinary.api.usage();

        // Extract relevant fields
        const data = {
            // Storage
            storage: {
                used: usage.storage?.usage || 0,
                limit: usage.storage?.limit || 0,
                usedPercent: usage.storage?.used_percent || 0,
                formattedUsed: formatBytes(usage.storage?.usage || 0),
                formattedLimit: formatBytes(usage.storage?.limit || 0)
            },
            // Bandwidth (current period)
            bandwidth: {
                used: usage.bandwidth?.usage || 0,
                limit: usage.bandwidth?.limit || 0,
                usedPercent: usage.bandwidth?.used_percent || 0,
                formattedUsed: formatBytes(usage.bandwidth?.usage || 0),
                formattedLimit: formatBytes(usage.bandwidth?.limit || 0)
            },
            // Resources
            resources: {
                images: usage.resources || 0,
                videos: usage.video?.usage || 0,
                raw: usage.raw?.usage || 0,
                total: (usage.resources || 0) + (usage.video?.usage || 0) + (usage.raw?.usage || 0)
            },
            // Transformations
            transformations: {
                used: usage.transformations?.usage || 0,
                limit: usage.transformations?.limit || 0,
                usedPercent: usage.transformations?.used_percent || 0
            },
            // Credits
            credits: {
                used: usage.credits?.usage || 0,
                limit: usage.credits?.limit || 0,
                usedPercent: usage.credits?.used_percent || 0
            },
            // Plan info
            plan: usage.plan || 'Free',
            lastUpdated: usage.last_updated || new Date().toISOString()
        };

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Cloudinary usage fetch error:', error);
        // Return a fallback so the frontend doesn't break
        res.json({
            success: false,
            message: 'Could not fetch Cloudinary usage. Check API credentials.',
            data: null
        });
    }
};

// Helper function
function formatBytes(bytes) {
    if (!bytes) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
