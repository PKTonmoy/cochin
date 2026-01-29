/**
 * Page Controller
 * Handles CMS page CRUD, publishing, and versioning
 */

const Page = require('../models/Page');
const ContentBlock = require('../models/ContentBlock');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all pages (admin)
 */
exports.getAllPages = async (req, res, next) => {
    try {
        const { status, search, sort = '-updatedAt' } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { pageName: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }

        const pages = await Page.find(filter)
            .select('pageName slug status publishedAt lastEditedAt lastEditedBy currentVersion')
            .populate('lastEditedBy', 'name')
            .sort(sort);

        res.json({
            success: true,
            data: pages
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single page by slug (admin - includes draft content)
 */
exports.getPage = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const page = await Page.findOne({ slug: slug.toLowerCase() })
            .populate('lastEditedBy', 'name')
            .populate('versions.savedBy', 'name');

        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        res.json({
            success: true,
            data: page
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get published page by slug (public)
 */
exports.getPublishedPage = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const page = await Page.findPublished(slug);

        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        res.json({
            success: true,
            data: {
                pageName: page.pageName,
                slug: page.slug,
                sections: page.publishedSections,
                seo: page.seo,
                settings: page.settings
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get page by preview token (public)
 */
exports.getPreviewPage = async (req, res, next) => {
    try {
        const { token } = req.params;

        const page = await Page.findOne({
            previewToken: token,
            previewTokenExpiry: { $gt: new Date() }
        });

        if (!page) {
            throw new ApiError('Preview link expired or invalid', 404);
        }

        res.json({
            success: true,
            data: {
                pageName: page.pageName,
                slug: page.slug,
                sections: page.sections, // Preview shows draft content
                seo: page.seo,
                settings: page.settings,
                isPreview: true
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new page
 */
exports.createPage = async (req, res, next) => {
    try {
        const { pageName, slug, template = 'content' } = req.body;

        // Check if slug exists
        const existing = await Page.findOne({ slug: slug.toLowerCase() });
        if (existing) {
            throw new ApiError('A page with this slug already exists', 400);
        }

        const page = new Page({
            pageName,
            slug: slug.toLowerCase(),
            template,
            sections: [],
            createdBy: req.user.id,
            lastEditedBy: req.user.id
        });

        await page.save();

        await AuditLog.log({
            action: 'page_created',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'page',
            entityId: page._id,
            details: { pageName, slug },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Page created successfully',
            data: page
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update page (auto-save draft)
 */
exports.updatePage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { sections, settings, seo, pageName, createVersion = false, versionNote = '' } = req.body;

        const page = await Page.findById(id);
        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        // Create version snapshot if requested
        if (createVersion) {
            page.createVersion(req.user.id, versionNote);
        }

        // Update fields
        if (sections !== undefined) page.sections = sections;
        if (settings !== undefined) page.settings = { ...page.settings, ...settings };
        if (seo !== undefined) page.seo = { ...page.seo, ...seo };
        if (pageName !== undefined) page.pageName = pageName;

        page.lastEditedBy = req.user.id;

        await page.save();

        res.json({
            success: true,
            message: 'Page saved',
            data: page
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add section to page
 */
exports.addSection = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type, content, styles, position } = req.body;

        const page = await Page.findById(id);
        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        const newSection = {
            id: uuidv4(),
            type,
            order: position !== undefined ? position : page.sections.length,
            visible: true,
            content: content || getDefaultContent(type),
            styles: styles || {}
        };

        // Insert at position or append
        if (position !== undefined && position < page.sections.length) {
            page.sections.splice(position, 0, newSection);
            // Re-order subsequent sections
            page.sections.forEach((sec, idx) => {
                sec.order = idx;
            });
        } else {
            page.sections.push(newSection);
        }

        page.lastEditedBy = req.user.id;
        await page.save();

        // Increment block usage if using a template
        if (req.body.blockId) {
            await ContentBlock.incrementUsage(req.body.blockId);
        }

        res.json({
            success: true,
            message: 'Section added',
            data: { section: newSection, page }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update section
 */
exports.updateSection = async (req, res, next) => {
    try {
        const { id, sectionId } = req.params;
        const { content, styles, visible, animation, responsive } = req.body;

        const page = await Page.findById(id);
        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        const sectionIndex = page.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) {
            throw new ApiError('Section not found', 404);
        }

        if (content !== undefined) page.sections[sectionIndex].content = content;
        if (styles !== undefined) page.sections[sectionIndex].styles = styles;
        if (visible !== undefined) page.sections[sectionIndex].visible = visible;
        if (animation !== undefined) page.sections[sectionIndex].animation = animation;
        if (responsive !== undefined) page.sections[sectionIndex].responsive = responsive;

        page.lastEditedBy = req.user.id;
        await page.save();

        res.json({
            success: true,
            message: 'Section updated',
            data: page.sections[sectionIndex]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete section
 */
exports.deleteSection = async (req, res, next) => {
    try {
        const { id, sectionId } = req.params;

        const page = await Page.findById(id);
        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        const sectionIndex = page.sections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) {
            throw new ApiError('Section not found', 404);
        }

        page.sections.splice(sectionIndex, 1);

        // Re-order remaining sections
        page.sections.forEach((sec, idx) => {
            sec.order = idx;
        });

        page.lastEditedBy = req.user.id;
        await page.save();

        res.json({
            success: true,
            message: 'Section deleted'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reorder sections
 */
exports.reorderSections = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { sectionIds } = req.body; // Array of section IDs in new order

        const page = await Page.findById(id);
        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        // Create a map for quick lookup
        const sectionMap = new Map();
        page.sections.forEach(s => sectionMap.set(s.id, s));

        // Reorder based on provided array
        const reorderedSections = sectionIds
            .filter(id => sectionMap.has(id))
            .map((sectionId, index) => {
                const section = sectionMap.get(sectionId);
                section.order = index;
                return section;
            });

        page.sections = reorderedSections;
        page.lastEditedBy = req.user.id;
        await page.save();

        res.json({
            success: true,
            message: 'Sections reordered',
            data: page.sections
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Publish page (admin only)
 */
exports.publishPage = async (req, res, next) => {
    try {
        const { id } = req.params;

        const page = await Page.findById(id);
        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        page.publish();
        await page.save();

        await AuditLog.log({
            action: 'page_published',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'page',
            entityId: page._id,
            details: { pageName: page.pageName, slug: page.slug },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Page published successfully',
            data: page
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Unpublish page (revert to draft)
 */
exports.unpublishPage = async (req, res, next) => {
    try {
        const { id } = req.params;

        const page = await Page.findById(id);
        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        page.status = 'draft';
        await page.save();

        res.json({
            success: true,
            message: 'Page unpublished',
            data: page
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Schedule page publish
 */
exports.schedulePage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { publishAt } = req.body;

        const page = await Page.findById(id);
        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        page.status = 'scheduled';
        page.scheduledPublishAt = new Date(publishAt);
        await page.save();

        res.json({
            success: true,
            message: 'Page scheduled for publishing',
            data: page
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate preview link
 */
exports.generatePreviewLink = async (req, res, next) => {
    try {
        const { id } = req.params;

        const page = await Page.findById(id);
        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        const token = page.generatePreviewToken();
        await page.save();

        const previewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/preview/${token}`;

        res.json({
            success: true,
            data: {
                token,
                url: previewUrl,
                expiresAt: page.previewTokenExpiry
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get version history
 */
exports.getVersions = async (req, res, next) => {
    try {
        const { id } = req.params;

        const page = await Page.findById(id)
            .select('versions currentVersion')
            .populate('versions.savedBy', 'name');

        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        res.json({
            success: true,
            data: {
                currentVersion: page.currentVersion,
                versions: page.versions
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Restore version
 */
exports.restoreVersion = async (req, res, next) => {
    try {
        const { id, versionId } = req.params;

        const page = await Page.findById(id);
        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        const version = page.versions.id(versionId);
        if (!version) {
            throw new ApiError('Version not found', 404);
        }

        // Save current as version before restoring
        page.createVersion(req.user.id, 'Auto-save before restore');

        // Restore sections from version
        page.sections = JSON.parse(JSON.stringify(version.sections));
        page.lastEditedBy = req.user.id;

        await page.save();

        res.json({
            success: true,
            message: 'Version restored successfully',
            data: page
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Duplicate page
 */
exports.duplicatePage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { newSlug, newName } = req.body;

        const originalPage = await Page.findById(id);
        if (!originalPage) {
            throw new ApiError('Page not found', 404);
        }

        // Check new slug doesn't exist
        const existing = await Page.findOne({ slug: newSlug.toLowerCase() });
        if (existing) {
            throw new ApiError('A page with this slug already exists', 400);
        }

        const newPage = new Page({
            pageName: newName || `${originalPage.pageName} (Copy)`,
            slug: newSlug.toLowerCase(),
            template: originalPage.template,
            sections: JSON.parse(JSON.stringify(originalPage.sections)).map(s => ({
                ...s,
                id: uuidv4() // Generate new IDs for sections
            })),
            settings: originalPage.settings,
            seo: originalPage.seo,
            status: 'draft',
            createdBy: req.user.id,
            lastEditedBy: req.user.id
        });

        await newPage.save();

        res.status(201).json({
            success: true,
            message: 'Page duplicated successfully',
            data: newPage
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete page
 */
exports.deletePage = async (req, res, next) => {
    try {
        const { id } = req.params;

        const page = await Page.findByIdAndDelete(id);
        if (!page) {
            throw new ApiError('Page not found', 404);
        }

        await AuditLog.log({
            action: 'page_deleted',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'page',
            entityId: page._id,
            details: { pageName: page.pageName, slug: page.slug },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Page deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Helper: Get default content for section type
 */
function getDefaultContent(type) {
    const defaults = {
        hero: {
            headline: { text: 'Welcome to Our Coaching Center', fontSize: '48px', color: '#1f2937', fontWeight: '700' },
            subheadline: { text: 'Transform your future with expert guidance', fontSize: '20px', color: '#6b7280' },
            backgroundImage: { url: '', alt: '' },
            buttons: [{ text: 'Get Started', link: '/contact', style: 'primary' }],
            overlay: { enabled: true, color: 'rgba(0,0,0,0.3)' }
        },
        text: {
            title: { text: 'Section Title', fontSize: '32px', color: '#1f2937', fontWeight: '600' },
            body: '<p>Enter your content here. You can format this text using the rich text editor.</p>',
            alignment: 'left'
        },
        image: {
            images: [{ url: '', alt: '', caption: '' }],
            layout: 'single', // single, grid, carousel
            columns: 3,
            aspectRatio: '16:9',
            lightbox: true
        },
        cardGrid: {
            title: { text: 'Our Features', fontSize: '32px', color: '#1f2937' },
            cards: [
                { title: 'Feature 1', description: 'Description for feature 1', icon: 'star', image: { url: '' } },
                { title: 'Feature 2', description: 'Description for feature 2', icon: 'award', image: { url: '' } },
                { title: 'Feature 3', description: 'Description for feature 3', icon: 'check', image: { url: '' } }
            ],
            columns: 3,
            cardStyle: 'elevated' // elevated, bordered, flat
        },
        gallery: {
            title: { text: 'Gallery', fontSize: '32px', color: '#1f2937' },
            images: [],
            layout: 'masonry', // masonry, grid, carousel
            columns: 4
        },
        testimonial: {
            title: { text: 'What Our Students Say', fontSize: '32px', color: '#1f2937' },
            testimonials: [
                { name: 'Student Name', role: 'Class 10', content: 'Great coaching center!', image: { url: '' }, rating: 5 }
            ],
            layout: 'carousel' // carousel, grid
        },
        cta: {
            headline: { text: 'Ready to Get Started?', fontSize: '36px', color: '#ffffff', fontWeight: '700' },
            subheadline: { text: 'Join thousands of successful students', fontSize: '18px', color: '#f3f4f6' },
            buttons: [
                { text: 'Enroll Now', link: '/contact', style: 'primary' },
                { text: 'Learn More', link: '/about', style: 'secondary' }
            ],
            backgroundGradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
        },
        form: {
            title: { text: 'Contact Us', fontSize: '32px', color: '#1f2937' },
            fields: [
                { type: 'text', name: 'name', label: 'Name', required: true },
                { type: 'email', name: 'email', label: 'Email', required: true },
                { type: 'textarea', name: 'message', label: 'Message', required: true }
            ],
            submitText: 'Send Message',
            successMessage: 'Thank you! We will get back to you soon.'
        },
        statistics: {
            title: { text: 'Our Achievements', fontSize: '32px', color: '#1f2937' },
            stats: [
                { value: 500, suffix: '+', label: 'Students', icon: 'users' },
                { value: 95, suffix: '%', label: 'Success Rate', icon: 'trending-up' },
                { value: 10, suffix: '+', label: 'Years Experience', icon: 'award' },
                { value: 50, suffix: '+', label: 'Expert Teachers', icon: 'graduation-cap' }
            ],
            animated: true
        },
        custom: {
            html: '<div>Custom HTML content</div>',
            css: ''
        }
    };

    return defaults[type] || {};
}
