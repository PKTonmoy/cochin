/**
 * CMS Canvas Component
 * Main editing area that renders sections with inline editing
 */

import { useRef, useEffect } from 'react'
import {
    ChevronUp,
    ChevronDown,
    Copy,
    Trash2,
    Eye,
    EyeOff,
    Settings,
    Plus,
    GripVertical
} from 'lucide-react'
import useEditorStore from '../../contexts/EditorStore'

// Import block renderers
import HeroBlock from './blocks/HeroBlock'
import TextBlock from './blocks/TextBlock'
import ImageBlock from './blocks/ImageBlock'
import CardGridBlock from './blocks/CardGridBlock'
import GalleryBlock from './blocks/GalleryBlock'
import TestimonialBlock from './blocks/TestimonialBlock'
import CTABlock from './blocks/CTABlock'
import StatisticsBlock from './blocks/StatisticsBlock'
import FormBlock from './blocks/FormBlock'

// Block component mapping
const blockComponents = {
    hero: HeroBlock,
    text: TextBlock,
    image: ImageBlock,
    cardGrid: CardGridBlock,
    gallery: GalleryBlock,
    testimonial: TestimonialBlock,
    cta: CTABlock,
    statistics: StatisticsBlock,
    form: FormBlock
}

// Section Wrapper with controls
const SectionWrapper = ({ section, children }) => {
    const {
        selectedSectionId,
        hoveredSectionId,
        isPreviewMode,
        selectSection,
        setHoveredSection,
        moveSection,
        duplicateSection,
        deleteSection,
        toggleSectionVisibility,
        openBlockPicker,
        page
    } = useEditorStore()

    const isSelected = selectedSectionId === section.id
    const isHovered = hoveredSectionId === section.id
    const sectionIndex = page?.sections?.findIndex(s => s.id === section.id) ?? -1
    const isFirst = sectionIndex === 0
    const isLast = sectionIndex === (page?.sections?.length ?? 0) - 1

    if (isPreviewMode) {
        return <>{children}</>
    }

    const handleDelete = async (e) => {
        e.stopPropagation()
        if (confirm('Delete this section?')) {
            await deleteSection(section.id)
        }
    }

    return (
        <div
            className={`section-wrapper ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${!section.visible ? 'hidden-section' : ''}`}
            onClick={(e) => {
                e.stopPropagation()
                selectSection(section.id)
            }}
            onMouseEnter={() => setHoveredSection(section.id)}
            onMouseLeave={() => setHoveredSection(null)}
        >
            {/* Add Section Before */}
            <button
                className="add-section-between before"
                onClick={(e) => { e.stopPropagation(); openBlockPicker(sectionIndex) }}
                title="Add section here"
            >
                <Plus size={14} />
            </button>

            {/* Section Label */}
            <div className="section-label">
                <GripVertical size={14} />
                <span>{section.type.charAt(0).toUpperCase() + section.type.slice(1)}</span>
                {!section.visible && <EyeOff size={12} />}
            </div>

            {/* Section Controls */}
            {(isSelected || isHovered) && (
                <div className="section-controls">
                    <button
                        onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up') }}
                        disabled={isFirst}
                        title="Move up"
                    >
                        <ChevronUp size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down') }}
                        disabled={isLast}
                        title="Move down"
                    >
                        <ChevronDown size={16} />
                    </button>
                    <div className="control-divider" />
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(section.id) }}
                        title={section.visible ? 'Hide section' : 'Show section'}
                    >
                        {section.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); duplicateSection(section.id) }}
                        title="Duplicate section"
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        title="Delete section"
                        className="delete-control"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )}

            {/* Section Content */}
            <div className="section-content" style={{ opacity: section.visible ? 1 : 0.4 }}>
                {children}
            </div>

            {/* Add Section After */}
            <button
                className="add-section-between after"
                onClick={(e) => { e.stopPropagation(); openBlockPicker(sectionIndex + 1) }}
                title="Add section here"
            >
                <Plus size={14} />
            </button>
        </div>
    )
}

const Canvas = () => {
    const canvasRef = useRef(null)
    const {
        page,
        isLoading,
        previewMode,
        isPreviewMode,
        clearSelection,
        updateSectionContent,
        updateSectionStyles
    } = useEditorStore()

    // Get canvas width based on preview mode
    const getCanvasWidth = () => {
        switch (previewMode) {
            case 'mobile': return '375px'
            case 'tablet': return '768px'
            default: return '100%'
        }
    }

    // Click outside to deselect
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (canvasRef.current && !canvasRef.current.contains(e.target)) {
                clearSelection()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [clearSelection])

    if (isLoading) {
        return (
            <div className="cms-canvas loading">
                <div className="loading-spinner">
                    <div className="spinner" />
                    <p>Loading page...</p>
                </div>
            </div>
        )
    }

    if (!page) {
        return (
            <div className="cms-canvas empty">
                <p>Select a page to edit</p>
            </div>
        )
    }

    return (
        <div className={`cms-canvas ${isPreviewMode ? 'preview-mode' : ''}`}>
            <div
                ref={canvasRef}
                className="canvas-content"
                style={{
                    maxWidth: getCanvasWidth(),
                    margin: previewMode !== 'desktop' ? '0 auto' : undefined
                }}
            >
                {page.sections.length === 0 ? (
                    <div className="empty-canvas">
                        <div className="empty-state">
                            <h3>Start Building</h3>
                            <p>Add your first section using the sidebar</p>
                        </div>
                    </div>
                ) : (
                    page.sections.map((section) => {
                        const BlockComponent = blockComponents[section.type]

                        if (!BlockComponent) {
                            return (
                                <SectionWrapper key={section.id} section={section}>
                                    <div className="unsupported-block">
                                        Unknown block type: {section.type}
                                    </div>
                                </SectionWrapper>
                            )
                        }

                        return (
                            <SectionWrapper key={section.id} section={section}>
                                <BlockComponent
                                    section={section}
                                    content={section.content}
                                    styles={section.styles}
                                    isEditing={!isPreviewMode}
                                    onContentChange={(path, value) =>
                                        updateSectionContent(section.id, path, value)
                                    }
                                    onStyleChange={(styles) =>
                                        updateSectionStyles(section.id, styles)
                                    }
                                />
                            </SectionWrapper>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default Canvas
