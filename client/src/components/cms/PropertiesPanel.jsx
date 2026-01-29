/**
 * CMS Properties Panel Component
 * Right panel for editing selected section properties
 */

import { useState } from 'react'
import {
    Type,
    Palette,
    Layout,
    Sparkles,
    Eye,
    Code,
    ChevronDown,
    ChevronUp,
    Upload,
    X,
    Plus,
    Trash2,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Monitor,
    Tablet,
    Smartphone
} from 'lucide-react'
import { SketchPicker } from 'react-color'
import useEditorStore from '../../contexts/EditorStore'
import api from '../../lib/api'
import toast from 'react-hot-toast'

// Color Picker Component
const ColorPickerField = ({ label, value, onChange }) => {
    const [showPicker, setShowPicker] = useState(false)

    return (
        <div className="property-field">
            <label>{label}</label>
            <div className="color-picker-wrapper">
                <button
                    className="color-preview"
                    onClick={() => setShowPicker(!showPicker)}
                    style={{ backgroundColor: value || 'transparent' }}
                >
                    {!value && <span className="no-color">None</span>}
                </button>
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                />
                {value && (
                    <button className="clear-color" onClick={() => onChange('')}>
                        <X size={12} />
                    </button>
                )}
                {showPicker && (
                    <div className="color-picker-popover">
                        <div className="color-picker-cover" onClick={() => setShowPicker(false)} />
                        <SketchPicker
                            color={value || '#000000'}
                            onChange={(color) => onChange(color.hex)}
                            presetColors={[
                                '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488',
                                '#2563eb', '#7c3aed', '#db2777', '#1f2937', '#6b7280',
                                '#f3f4f6', '#ffffff', 'transparent'
                            ]}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

// Spacing Control (Padding/Margin)
const SpacingControl = ({ label, value, onChange }) => {
    const spacing = value || { top: '0', bottom: '0', left: '0', right: '0' }

    return (
        <div className="property-field">
            <label>{label}</label>
            <div className="spacing-control">
                <div className="spacing-box">
                    <input
                        type="text"
                        placeholder="Top"
                        value={spacing.top || ''}
                        onChange={(e) => onChange({ ...spacing, top: e.target.value })}
                        className="spacing-top"
                    />
                    <div className="spacing-middle">
                        <input
                            type="text"
                            placeholder="L"
                            value={spacing.left || ''}
                            onChange={(e) => onChange({ ...spacing, left: e.target.value })}
                            className="spacing-left"
                        />
                        <div className="spacing-center" />
                        <input
                            type="text"
                            placeholder="R"
                            value={spacing.right || ''}
                            onChange={(e) => onChange({ ...spacing, right: e.target.value })}
                            className="spacing-right"
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Bottom"
                        value={spacing.bottom || ''}
                        onChange={(e) => onChange({ ...spacing, bottom: e.target.value })}
                        className="spacing-bottom"
                    />
                </div>
            </div>
        </div>
    )
}

// Image Upload Field
const ImageField = ({ label, value, onChange }) => {
    const [isUploading, setIsUploading] = useState(false)

    const handleUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('image', file)

        try {
            const response = await api.post('/cms/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            if (response.data.success) {
                onChange({
                    url: response.data.data.url,
                    publicId: response.data.data.publicId,
                    alt: value?.alt || ''
                })
                toast.success('Image uploaded!')
            }
        } catch (error) {
            toast.error('Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="property-field">
            <label>{label}</label>
            <div className="image-field">
                {value?.url ? (
                    <div className="image-preview">
                        <img src={value.url} alt={value.alt || ''} />
                        <div className="image-actions">
                            <label className="replace-btn">
                                <Upload size={14} />
                                <input type="file" accept="image/*" onChange={handleUpload} hidden />
                            </label>
                            <button onClick={() => onChange(null)} className="remove-btn">
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="upload-zone">
                        {isUploading ? (
                            <span>Uploading...</span>
                        ) : (
                            <>
                                <Upload size={24} />
                                <span>Click to upload</span>
                            </>
                        )}
                        <input type="file" accept="image/*" onChange={handleUpload} hidden />
                    </label>
                )}
                {value?.url && (
                    <input
                        type="text"
                        placeholder="Alt text"
                        value={value.alt || ''}
                        onChange={(e) => onChange({ ...value, alt: e.target.value })}
                        className="alt-input"
                    />
                )}
            </div>
        </div>
    )
}

// Collapsible Section
const PropertySection = ({ title, icon: Icon, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className={`property-section ${isOpen ? 'open' : ''}`}>
            <button className="section-header" onClick={() => setIsOpen(!isOpen)}>
                <Icon size={16} />
                <span>{title}</span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isOpen && <div className="section-content">{children}</div>}
        </div>
    )
}

const PropertiesPanel = () => {
    const {
        page,
        selectedSectionId,
        propertiesTab,
        setPropertiesTab,
        updateSectionContent,
        updateSectionStyles,
        updateSection
    } = useEditorStore()

    const selectedSection = page?.sections?.find(s => s.id === selectedSectionId)

    if (!selectedSection) {
        return (
            <div className="cms-properties-panel empty">
                <div className="empty-state">
                    <Layout size={32} />
                    <p>Select a section to edit</p>
                </div>
            </div>
        )
    }

    const tabs = [
        { id: 'content', icon: Type, label: 'Content' },
        { id: 'style', icon: Palette, label: 'Style' },
        { id: 'layout', icon: Layout, label: 'Layout' },
        { id: 'animation', icon: Sparkles, label: 'Animation' },
        { id: 'visibility', icon: Eye, label: 'Visibility' }
    ]

    const renderContentTab = () => {
        const content = selectedSection.content || {}

        // Different content editors based on section type
        switch (selectedSection.type) {
            case 'hero':
                return (
                    <>
                        <PropertySection title="Headline" icon={Type}>
                            <div className="property-field">
                                <label>Text</label>
                                <input
                                    type="text"
                                    value={content.headline?.text || ''}
                                    onChange={(e) => updateSectionContent(selectedSection.id, 'headline.text', e.target.value)}
                                />
                            </div>
                            <div className="property-field">
                                <label>Font Size</label>
                                <input
                                    type="text"
                                    value={content.headline?.fontSize || '48px'}
                                    onChange={(e) => updateSectionContent(selectedSection.id, 'headline.fontSize', e.target.value)}
                                />
                            </div>
                            <ColorPickerField
                                label="Color"
                                value={content.headline?.color}
                                onChange={(v) => updateSectionContent(selectedSection.id, 'headline.color', v)}
                            />
                        </PropertySection>

                        <PropertySection title="Subheadline" icon={Type}>
                            <div className="property-field">
                                <label>Text</label>
                                <textarea
                                    value={content.subheadline?.text || ''}
                                    onChange={(e) => updateSectionContent(selectedSection.id, 'subheadline.text', e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </PropertySection>

                        <PropertySection title="Background" icon={Palette}>
                            <ImageField
                                label="Background Image"
                                value={content.backgroundImage}
                                onChange={(v) => updateSectionContent(selectedSection.id, 'backgroundImage', v)}
                            />
                        </PropertySection>

                        <PropertySection title="Buttons" icon={LinkIcon}>
                            {(content.buttons || []).map((btn, index) => (
                                <div key={index} className="button-editor">
                                    <input
                                        type="text"
                                        placeholder="Button text"
                                        value={btn.text || ''}
                                        onChange={(e) => {
                                            const newButtons = [...(content.buttons || [])]
                                            newButtons[index] = { ...btn, text: e.target.value }
                                            updateSectionContent(selectedSection.id, 'buttons', newButtons)
                                        }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Link URL"
                                        value={btn.link || ''}
                                        onChange={(e) => {
                                            const newButtons = [...(content.buttons || [])]
                                            newButtons[index] = { ...btn, link: e.target.value }
                                            updateSectionContent(selectedSection.id, 'buttons', newButtons)
                                        }}
                                    />
                                    <button
                                        className="remove-item"
                                        onClick={() => {
                                            const newButtons = (content.buttons || []).filter((_, i) => i !== index)
                                            updateSectionContent(selectedSection.id, 'buttons', newButtons)
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                className="add-item-btn"
                                onClick={() => {
                                    const newButtons = [...(content.buttons || []), { text: 'Button', link: '#', style: 'primary' }]
                                    updateSectionContent(selectedSection.id, 'buttons', newButtons)
                                }}
                            >
                                <Plus size={14} /> Add Button
                            </button>
                        </PropertySection>
                    </>
                )

            case 'text':
                return (
                    <>
                        <PropertySection title="Title" icon={Type}>
                            <div className="property-field">
                                <label>Text</label>
                                <input
                                    type="text"
                                    value={content.title?.text || ''}
                                    onChange={(e) => updateSectionContent(selectedSection.id, 'title.text', e.target.value)}
                                />
                            </div>
                            <div className="property-field">
                                <label>Font Size</label>
                                <input
                                    type="text"
                                    value={content.title?.fontSize || '32px'}
                                    onChange={(e) => updateSectionContent(selectedSection.id, 'title.fontSize', e.target.value)}
                                />
                            </div>
                        </PropertySection>

                        <PropertySection title="Body Content" icon={Type}>
                            <div className="property-field">
                                <label>Content (HTML)</label>
                                <textarea
                                    value={content.body || ''}
                                    onChange={(e) => updateSectionContent(selectedSection.id, 'body', e.target.value)}
                                    rows={6}
                                    className="html-editor"
                                />
                            </div>
                            <div className="property-field">
                                <label>Text Alignment</label>
                                <div className="button-group">
                                    {['left', 'center', 'right'].map(align => (
                                        <button
                                            key={align}
                                            className={content.alignment === align ? 'active' : ''}
                                            onClick={() => updateSectionContent(selectedSection.id, 'alignment', align)}
                                        >
                                            {align === 'left' && <AlignLeft size={16} />}
                                            {align === 'center' && <AlignCenter size={16} />}
                                            {align === 'right' && <AlignRight size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </PropertySection>
                    </>
                )

            case 'image':
                return (
                    <PropertySection title="Images" icon={Type}>
                        <ImageField
                            label="Image"
                            value={content.images?.[0]}
                            onChange={(v) => updateSectionContent(selectedSection.id, 'images', v ? [v] : [])}
                        />
                        <div className="property-field">
                            <label>Layout</label>
                            <select
                                value={content.layout || 'single'}
                                onChange={(e) => updateSectionContent(selectedSection.id, 'layout', e.target.value)}
                            >
                                <option value="single">Single Image</option>
                                <option value="grid">Grid</option>
                                <option value="carousel">Carousel</option>
                            </select>
                        </div>
                    </PropertySection>
                )

            default:
                return (
                    <div className="property-field">
                        <label>Raw Content (JSON)</label>
                        <textarea
                            value={JSON.stringify(content, null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value)
                                    updateSection(selectedSection.id, { content: parsed })
                                } catch (err) {
                                    // Invalid JSON, don't update
                                }
                            }}
                            rows={10}
                            className="json-editor"
                        />
                    </div>
                )
        }
    }

    const renderStyleTab = () => {
        const styles = selectedSection.styles || {}

        return (
            <>
                <PropertySection title="Background" icon={Palette}>
                    <ColorPickerField
                        label="Background Color"
                        value={styles.backgroundColor}
                        onChange={(v) => updateSectionStyles(selectedSection.id, { backgroundColor: v })}
                    />
                    <div className="property-field">
                        <label>Background Gradient</label>
                        <input
                            type="text"
                            placeholder="linear-gradient(...)"
                            value={styles.backgroundGradient || ''}
                            onChange={(e) => updateSectionStyles(selectedSection.id, { backgroundGradient: e.target.value })}
                        />
                    </div>
                </PropertySection>

                <PropertySection title="Spacing" icon={Layout}>
                    <SpacingControl
                        label="Padding"
                        value={styles.padding}
                        onChange={(v) => updateSectionStyles(selectedSection.id, { padding: v })}
                    />
                    <SpacingControl
                        label="Margin"
                        value={styles.margin}
                        onChange={(v) => updateSectionStyles(selectedSection.id, { margin: v })}
                    />
                </PropertySection>

                <PropertySection title="Border" icon={Layout}>
                    <div className="property-field">
                        <label>Border Radius</label>
                        <input
                            type="text"
                            placeholder="8px"
                            value={styles.borderRadius || ''}
                            onChange={(e) => updateSectionStyles(selectedSection.id, { borderRadius: e.target.value })}
                        />
                    </div>
                    <div className="property-field">
                        <label>Box Shadow</label>
                        <input
                            type="text"
                            placeholder="0 4px 12px rgba(0,0,0,0.1)"
                            value={styles.boxShadow || ''}
                            onChange={(e) => updateSectionStyles(selectedSection.id, { boxShadow: e.target.value })}
                        />
                    </div>
                </PropertySection>
            </>
        )
    }

    const renderLayoutTab = () => {
        const styles = selectedSection.styles || {}

        return (
            <>
                <PropertySection title="Dimensions" icon={Layout}>
                    <div className="property-field">
                        <label>Max Width</label>
                        <input
                            type="text"
                            placeholder="1200px"
                            value={styles.maxWidth || ''}
                            onChange={(e) => updateSectionStyles(selectedSection.id, { maxWidth: e.target.value })}
                        />
                    </div>
                    <div className="property-field">
                        <label>Min Height</label>
                        <input
                            type="text"
                            placeholder="auto"
                            value={styles.minHeight || ''}
                            onChange={(e) => updateSectionStyles(selectedSection.id, { minHeight: e.target.value })}
                        />
                    </div>
                </PropertySection>

                <PropertySection title="Alignment" icon={Layout}>
                    <div className="property-field">
                        <label>Text Align</label>
                        <div className="button-group">
                            {['left', 'center', 'right'].map(align => (
                                <button
                                    key={align}
                                    className={styles.textAlign === align ? 'active' : ''}
                                    onClick={() => updateSectionStyles(selectedSection.id, { textAlign: align })}
                                >
                                    {align === 'left' && <AlignLeft size={16} />}
                                    {align === 'center' && <AlignCenter size={16} />}
                                    {align === 'right' && <AlignRight size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </PropertySection>
            </>
        )
    }

    const renderAnimationTab = () => {
        const animation = selectedSection.animation || {}

        return (
            <PropertySection title="Entrance Animation" icon={Sparkles}>
                <div className="property-field">
                    <label>Effect</label>
                    <select
                        value={animation.entrance || 'none'}
                        onChange={(e) => updateSection(selectedSection.id, {
                            animation: { ...animation, entrance: e.target.value }
                        })}
                    >
                        <option value="none">None</option>
                        <option value="fadeIn">Fade In</option>
                        <option value="slideUp">Slide Up</option>
                        <option value="slideDown">Slide Down</option>
                        <option value="slideLeft">Slide Left</option>
                        <option value="slideRight">Slide Right</option>
                        <option value="zoomIn">Zoom In</option>
                        <option value="bounce">Bounce</option>
                    </select>
                </div>
                <div className="property-field">
                    <label>Duration</label>
                    <input
                        type="text"
                        placeholder="0.5s"
                        value={animation.duration || ''}
                        onChange={(e) => updateSection(selectedSection.id, {
                            animation: { ...animation, duration: e.target.value }
                        })}
                    />
                </div>
                <div className="property-field">
                    <label>Delay</label>
                    <input
                        type="text"
                        placeholder="0s"
                        value={animation.delay || ''}
                        onChange={(e) => updateSection(selectedSection.id, {
                            animation: { ...animation, delay: e.target.value }
                        })}
                    />
                </div>
            </PropertySection>
        )
    }

    const renderVisibilityTab = () => {
        const responsive = selectedSection.responsive || {}

        return (
            <PropertySection title="Device Visibility" icon={Eye}>
                <div className="visibility-toggles">
                    <label className="visibility-toggle">
                        <Monitor size={18} />
                        <span>Desktop</span>
                        <input
                            type="checkbox"
                            checked={!responsive.hideOnDesktop}
                            onChange={(e) => updateSection(selectedSection.id, {
                                responsive: { ...responsive, hideOnDesktop: !e.target.checked }
                            })}
                        />
                        <span className="toggle-switch" />
                    </label>
                    <label className="visibility-toggle">
                        <Tablet size={18} />
                        <span>Tablet</span>
                        <input
                            type="checkbox"
                            checked={!responsive.hideOnTablet}
                            onChange={(e) => updateSection(selectedSection.id, {
                                responsive: { ...responsive, hideOnTablet: !e.target.checked }
                            })}
                        />
                        <span className="toggle-switch" />
                    </label>
                    <label className="visibility-toggle">
                        <Smartphone size={18} />
                        <span>Mobile</span>
                        <input
                            type="checkbox"
                            checked={!responsive.hideOnMobile}
                            onChange={(e) => updateSection(selectedSection.id, {
                                responsive: { ...responsive, hideOnMobile: !e.target.checked }
                            })}
                        />
                        <span className="toggle-switch" />
                    </label>
                </div>
            </PropertySection>
        )
    }

    return (
        <div className="cms-properties-panel">
            {/* Section Info */}
            <div className="panel-header">
                <span className="section-type-label">
                    {selectedSection.type.charAt(0).toUpperCase() + selectedSection.type.slice(1)}
                </span>
            </div>

            {/* Tabs */}
            <div className="panel-tabs">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            className={propertiesTab === tab.id ? 'active' : ''}
                            onClick={() => setPropertiesTab(tab.id)}
                            title={tab.label}
                        >
                            <Icon size={16} />
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="panel-content">
                {propertiesTab === 'content' && renderContentTab()}
                {propertiesTab === 'style' && renderStyleTab()}
                {propertiesTab === 'layout' && renderLayoutTab()}
                {propertiesTab === 'animation' && renderAnimationTab()}
                {propertiesTab === 'visibility' && renderVisibilityTab()}
            </div>
        </div>
    )
}

export default PropertiesPanel
