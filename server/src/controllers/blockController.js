/**
 * ContentBlock Controller
 * Handles content block templates CRUD
 */

const ContentBlock = require('../models/ContentBlock');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all blocks (grouped by category)
 */
exports.getAllBlocks = async (req, res, next) => {
    try {
        const { category, includeCustom = true } = req.query;

        const filter = { isActive: true };
        if (category) filter.category = category;
        if (!includeCustom) filter.isDefault = true;

        const blocks = await ContentBlock.find(filter)
            .select('-template.content -createdBy')
            .sort({ category: 1, name: 1 });

        // Group by category
        const grouped = blocks.reduce((acc, block) => {
            if (!acc[block.category]) {
                acc[block.category] = [];
            }
            acc[block.category].push(block);
            return acc;
        }, {});

        res.json({
            success: true,
            data: grouped
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single block with full template
 */
exports.getBlock = async (req, res, next) => {
    try {
        const { id } = req.params;

        const block = await ContentBlock.findById(id);
        if (!block) {
            throw new ApiError('Block not found', 404);
        }

        res.json({
            success: true,
            data: block
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create custom block (save section as template)
 */
exports.createBlock = async (req, res, next) => {
    try {
        const { name, category, type, description, template, thumbnail } = req.body;

        const block = new ContentBlock({
            name,
            category,
            type,
            description,
            template,
            thumbnail,
            isDefault: false,
            createdBy: req.user.id
        });

        await block.save();

        res.status(201).json({
            success: true,
            message: 'Block template saved',
            data: block
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update block
 */
exports.updateBlock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const block = await ContentBlock.findById(id);
        if (!block) {
            throw new ApiError('Block not found', 404);
        }

        // Don't allow updating default blocks
        if (block.isDefault) {
            throw new ApiError('Cannot modify default blocks', 403);
        }

        Object.assign(block, updates);
        await block.save();

        res.json({
            success: true,
            message: 'Block updated',
            data: block
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete block
 */
exports.deleteBlock = async (req, res, next) => {
    try {
        const { id } = req.params;

        const block = await ContentBlock.findById(id);
        if (!block) {
            throw new ApiError('Block not found', 404);
        }

        if (block.isDefault) {
            throw new ApiError('Cannot delete default blocks', 403);
        }

        await block.deleteOne();

        res.json({
            success: true,
            message: 'Block deleted'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Seed default blocks
 */
exports.seedDefaultBlocks = async () => {
    const defaultBlocks = [
        {
            name: 'Hero Banner',
            category: 'header',
            type: 'hero',
            description: 'Full-width hero section with background image and CTA',
            isDefault: true,
            template: {
                content: {
                    headline: { text: 'Welcome', fontSize: '48px', color: '#ffffff', fontWeight: '700' },
                    subheadline: { text: 'Your success starts here', fontSize: '20px', color: '#f3f4f6' },
                    backgroundImage: { url: '', alt: '' },
                    buttons: [{ text: 'Get Started', link: '#', style: 'primary' }]
                },
                styles: {
                    minHeight: '600px',
                    textAlign: 'center',
                    padding: { top: '120px', bottom: '120px' }
                }
            }
        },
        {
            name: 'Text Content',
            category: 'content',
            type: 'text',
            description: 'Rich text section for paragraphs and formatted content',
            isDefault: true,
            template: {
                content: {
                    title: { text: 'Section Title', fontSize: '32px', color: '#1f2937' },
                    body: '<p>Your content here</p>',
                    alignment: 'left'
                },
                styles: {
                    padding: { top: '60px', bottom: '60px' }
                }
            }
        },
        {
            name: 'Image Gallery',
            category: 'media',
            type: 'image',
            description: 'Display single or multiple images in various layouts',
            isDefault: true,
            template: {
                content: {
                    images: [],
                    layout: 'grid',
                    columns: 3
                },
                styles: {
                    padding: { top: '40px', bottom: '40px' }
                }
            }
        },
        {
            name: 'Feature Cards',
            category: 'content',
            type: 'cardGrid',
            description: '3-column feature cards with icons',
            isDefault: true,
            template: {
                content: {
                    title: { text: 'Our Features', fontSize: '32px' },
                    cards: [
                        { title: 'Feature 1', description: 'Description', icon: 'star' },
                        { title: 'Feature 2', description: 'Description', icon: 'award' },
                        { title: 'Feature 3', description: 'Description', icon: 'target' }
                    ],
                    columns: 3
                },
                styles: {
                    padding: { top: '60px', bottom: '60px' }
                }
            }
        },
        {
            name: 'Testimonials',
            category: 'social',
            type: 'testimonial',
            description: 'Customer testimonial carousel',
            isDefault: true,
            template: {
                content: {
                    title: { text: 'What People Say', fontSize: '32px' },
                    testimonials: [],
                    layout: 'carousel'
                },
                styles: {
                    padding: { top: '60px', bottom: '60px' },
                    backgroundColor: '#f9fafb'
                }
            }
        },
        {
            name: 'Call to Action',
            category: 'cta',
            type: 'cta',
            description: 'Eye-catching CTA banner',
            isDefault: true,
            template: {
                content: {
                    headline: { text: 'Ready to Start?', fontSize: '36px', color: '#ffffff' },
                    buttons: [{ text: 'Contact Us', link: '/contact', style: 'primary' }],
                    backgroundGradient: 'linear-gradient(135deg, #dc2626, #991b1b)'
                },
                styles: {
                    padding: { top: '80px', bottom: '80px' },
                    textAlign: 'center'
                }
            }
        },
        {
            name: 'Statistics',
            category: 'content',
            type: 'statistics',
            description: 'Animated counter statistics',
            isDefault: true,
            template: {
                content: {
                    stats: [
                        { value: 100, suffix: '+', label: 'Students' },
                        { value: 95, suffix: '%', label: 'Success Rate' }
                    ],
                    animated: true
                },
                styles: {
                    padding: { top: '60px', bottom: '60px' }
                }
            }
        },
        {
            name: 'Contact Form',
            category: 'form',
            type: 'form',
            description: 'Contact form with customizable fields',
            isDefault: true,
            template: {
                content: {
                    title: { text: 'Get in Touch', fontSize: '32px' },
                    fields: [
                        { type: 'text', name: 'name', label: 'Name', required: true },
                        { type: 'email', name: 'email', label: 'Email', required: true },
                        { type: 'textarea', name: 'message', label: 'Message', required: true }
                    ],
                    submitText: 'Send'
                },
                styles: {
                    padding: { top: '60px', bottom: '60px' }
                }
            }
        }
    ];

    try {
        for (const block of defaultBlocks) {
            await ContentBlock.findOneAndUpdate(
                { name: block.name, isDefault: true },
                block,
                { upsert: true, new: true }
            );
        }
        console.log('Default content blocks seeded');
    } catch (error) {
        console.error('Error seeding blocks:', error);
    }
};
