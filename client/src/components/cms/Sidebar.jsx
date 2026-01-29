/**
 * CMS Sidebar Component
 * Contains pages list, sections list, and block picker
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    FileText,
    Layers,
    Plus,
    GripVertical,
    Eye,
    EyeOff,
    Trash2,
    Copy,
    ChevronRight,
    Layout,
    Type,
    Image,
    Grid3X3,
    MessageSquare,
    Target,
    BarChart3,
    FormInput,
    Sparkles,
    Search
} from 'lucide-react'
import api from '../../lib/api'
import useEditorStore from '../../contexts/EditorStore'
import toast from 'react-hot-toast'

// Block type definitions with icons
const blockTypes = [
    { type: 'hero', icon: Layout, label: 'Hero Banner', category: 'header' },
    { type: 'text', icon: Type, label: 'Text Content', category: 'content' },
    { type: 'image', icon: Image, label: 'Image', category: 'media' },
    { type: 'cardGrid', icon: Grid3X3, label: 'Card Grid', category: 'content' },
    { type: 'gallery', icon: Image, label: 'Gallery', category: 'media' },
    { type: 'testimonial', icon: MessageSquare, label: 'Testimonials', category: 'social' },
    { type: 'cta', icon: Target, label: 'Call to Action', category: 'cta' },
    { type: 'statistics', icon: BarChart3, label: 'Statistics', category: 'content' },
    { type: 'form', icon: FormInput, label: 'Contact Form', category: 'form' }
]

// Sortable Section Item
const SortableSectionItem = ({ section, isSelected, onSelect, onDelete, onDuplicate, onToggleVisibility }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: section.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    }

    const blockDef = blockTypes.find(b => b.type === section.type)
    const Icon = blockDef?.icon || Layers

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`section-item ${isSelected ? 'selected' : ''} ${!section.visible ? 'hidden-section' : ''}`}
            onClick={() => onSelect(section.id)}
        >
            <div className="section-drag" {...attributes} {...listeners}>
                <GripVertical size={14} />
            </div>

            <div className="section-icon">
                <Icon size={16} />
            </div>

            <div className="section-info">
                <span className="section-type">{blockDef?.label || section.type}</span>
            </div>

            <div className="section-actions">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(section.id) }}
                    title={section.visible ? 'Hide' : 'Show'}
                >
                    {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(section.id) }}
                    title="Duplicate"
                >
                    <Copy size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(section.id) }}
                    title="Delete"
                    className="delete-btn"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    )
}

// Block Picker Grid
const BlockPicker = ({ onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredBlocks = blockTypes.filter(block =>
        block.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const groupedBlocks = filteredBlocks.reduce((acc, block) => {
        if (!acc[block.category]) acc[block.category] = []
        acc[block.category].push(block)
        return acc
    }, {})

    return (
        <div className="block-picker">
            <div className="block-picker-header">
                <h3>Add Section</h3>
                <div className="search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search blocks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <div className="block-picker-content">
                {Object.entries(groupedBlocks).map(([category, blocks]) => (
                    <div key={category} className="block-category">
                        <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                        <div className="block-grid">
                            {blocks.map(block => {
                                const Icon = block.icon
                                return (
                                    <button
                                        key={block.type}
                                        className="block-item"
                                        onClick={() => onSelect(block.type)}
                                    >
                                        <div className="block-icon">
                                            <Icon size={24} />
                                        </div>
                                        <span>{block.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const Sidebar = () => {
    const navigate = useNavigate()
    const {
        page,
        selectedSectionId,
        sidebarTab,
        showBlockPicker,
        insertPosition,
        setSidebarTab,
        selectSection,
        addSection,
        deleteSection,
        duplicateSection,
        toggleSectionVisibility,
        reorderSections,
        openBlockPicker,
        closeBlockPicker
    } = useEditorStore()

    // Fetch pages list
    const { data: pagesData } = useQuery({
        queryKey: ['cms-pages'],
        queryFn: async () => {
            const res = await api.get('/cms/pages')
            return res.data.data
        }
    })

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            const oldIndex = page.sections.findIndex(s => s.id === active.id)
            const newIndex = page.sections.findIndex(s => s.id === over.id)
            reorderSections(oldIndex, newIndex)
        }
    }

    const handleAddSection = async (type) => {
        try {
            await addSection(type, null, insertPosition)
            toast.success('Section added!')
        } catch (error) {
            toast.error('Failed to add section')
        }
    }

    const handleDeleteSection = async (sectionId) => {
        if (!confirm('Delete this section?')) return
        try {
            await deleteSection(sectionId)
            toast.success('Section deleted')
        } catch (error) {
            toast.error('Failed to delete section')
        }
    }

    return (
        <div className="cms-sidebar">
            {/* Tabs */}
            <div className="sidebar-tabs">
                <button
                    className={sidebarTab === 'sections' ? 'active' : ''}
                    onClick={() => setSidebarTab('sections')}
                >
                    <Layers size={16} />
                    <span>Sections</span>
                </button>
                <button
                    className={sidebarTab === 'pages' ? 'active' : ''}
                    onClick={() => setSidebarTab('pages')}
                >
                    <FileText size={16} />
                    <span>Pages</span>
                </button>
            </div>

            {/* Content */}
            <div className="sidebar-content">
                {sidebarTab === 'sections' && (
                    <>
                        {/* Add Section Button */}
                        <button
                            className="add-section-btn"
                            onClick={() => openBlockPicker()}
                        >
                            <Plus size={18} />
                            <span>Add Section</span>
                        </button>

                        {/* Sections List */}
                        {page?.sections?.length > 0 ? (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={page.sections.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="sections-list">
                                        {page.sections.map(section => (
                                            <SortableSectionItem
                                                key={section.id}
                                                section={section}
                                                isSelected={selectedSectionId === section.id}
                                                onSelect={selectSection}
                                                onDelete={handleDeleteSection}
                                                onDuplicate={duplicateSection}
                                                onToggleVisibility={toggleSectionVisibility}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        ) : (
                            <div className="empty-sections">
                                <Sparkles size={32} />
                                <p>No sections yet</p>
                                <span>Click "Add Section" to start building</span>
                            </div>
                        )}
                    </>
                )}

                {sidebarTab === 'pages' && (
                    <div className="pages-list">
                        {pagesData?.map(p => (
                            <Link
                                key={p._id}
                                to={`/admin/cms/pages/${p.slug}`}
                                className={`page-item ${p.slug === page?.slug ? 'active' : ''}`}
                            >
                                <FileText size={16} />
                                <div className="page-item-info">
                                    <span className="page-name">{p.pageName}</span>
                                    <span className={`status-dot status-${p.status}`} />
                                </div>
                                <ChevronRight size={14} />
                            </Link>
                        ))}

                        <Link to="/admin/cms" className="view-all-pages">
                            View all pages
                        </Link>
                    </div>
                )}
            </div>

            {/* Block Picker Modal */}
            {showBlockPicker && (
                <div className="block-picker-overlay" onClick={closeBlockPicker}>
                    <div onClick={e => e.stopPropagation()}>
                        <BlockPicker
                            onSelect={handleAddSection}
                            onClose={closeBlockPicker}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Sidebar
