/**
 * CMS TopBar Component
 * Contains save, publish, preview, and device controls
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Save,
    Eye,
    Rocket,
    Undo,
    Redo,
    Monitor,
    Tablet,
    Smartphone,
    ChevronDown,
    Clock,
    ExternalLink,
    CheckCircle,
    Loader2,
    ArrowLeft,
    History,
    Settings
} from 'lucide-react'
import useEditorStore from '../../contexts/EditorStore'
import toast from 'react-hot-toast'

const TopBar = ({ onOpenVersionHistory, onOpenSettings }) => {
    const {
        page,
        isSaving,
        hasUnsavedChanges,
        lastSaved,
        previewMode,
        isPreviewMode,
        setPreviewMode,
        togglePreviewMode,
        savePage,
        publishPage,
        generatePreviewLink,
        undo,
        redo,
        canUndo,
        canRedo
    } = useEditorStore()

    const [showPublishMenu, setShowPublishMenu] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)

    const handleSave = async (createVersion = false) => {
        try {
            await savePage(createVersion, createVersion ? 'Manual save' : '')
            toast.success(createVersion ? 'Version saved!' : 'Draft saved!')
        } catch (error) {
            toast.error('Failed to save')
        }
    }

    const handlePublish = async () => {
        setIsPublishing(true)
        try {
            await savePage(true, 'Pre-publish save')
            await publishPage()
            toast.success('Page published successfully!')
            setShowPublishMenu(false)
        } catch (error) {
            toast.error('Failed to publish')
        } finally {
            setIsPublishing(false)
        }
    }

    const handlePreview = async () => {
        try {
            const result = await generatePreviewLink()
            if (result?.url) {
                window.open(result.url, '_blank')
            }
        } catch (error) {
            toast.error('Failed to generate preview link')
        }
    }

    const deviceModes = [
        { id: 'desktop', icon: Monitor, label: 'Desktop', width: '100%' },
        { id: 'tablet', icon: Tablet, label: 'Tablet', width: '768px' },
        { id: 'mobile', icon: Smartphone, label: 'Mobile', width: '375px' }
    ]

    const formatLastSaved = () => {
        if (!lastSaved) return 'Not saved'
        const diff = Math.floor((Date.now() - new Date(lastSaved).getTime()) / 1000)
        if (diff < 60) return 'Saved just now'
        if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`
        return `Saved ${Math.floor(diff / 3600)}h ago`
    }

    return (
        <div className="cms-topbar">
            {/* Left Section */}
            <div className="topbar-left">
                <Link to="/admin/cms" className="topbar-back">
                    <ArrowLeft size={18} />
                    <span>Pages</span>
                </Link>

                <div className="topbar-divider" />

                <div className="page-info">
                    <h2 className="page-title">{page?.pageName || 'Untitled Page'}</h2>
                    <div className="page-meta">
                        <span className={`status-badge status-${page?.status}`}>
                            {page?.status || 'draft'}
                        </span>
                        {hasUnsavedChanges && (
                            <span className="unsaved-indicator">
                                <span className="dot" /> Unsaved changes
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Center Section - Device Preview */}
            <div className="topbar-center">
                <div className="device-toggle">
                    {deviceModes.map(device => {
                        const Icon = device.icon
                        return (
                            <button
                                key={device.id}
                                className={`device-btn ${previewMode === device.id ? 'active' : ''}`}
                                onClick={() => setPreviewMode(device.id)}
                                title={device.label}
                            >
                                <Icon size={18} />
                            </button>
                        )
                    })}
                </div>

                <button
                    className={`preview-mode-btn ${isPreviewMode ? 'active' : ''}`}
                    onClick={togglePreviewMode}
                    title={isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
                >
                    <Eye size={16} />
                    <span>{isPreviewMode ? 'Exit Preview' : 'Preview'}</span>
                </button>
            </div>

            {/* Right Section - Actions */}
            <div className="topbar-right">
                {/* Undo/Redo */}
                <div className="action-group">
                    <button
                        className="action-btn"
                        onClick={undo}
                        disabled={!canUndo()}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={18} />
                    </button>
                    <button
                        className="action-btn"
                        onClick={redo}
                        disabled={!canRedo()}
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo size={18} />
                    </button>
                </div>

                <div className="topbar-divider" />

                {/* Version History */}
                <button
                    className="action-btn"
                    onClick={onOpenVersionHistory}
                    title="Version History"
                >
                    <History size={18} />
                </button>

                {/* Settings */}
                <button
                    className="action-btn"
                    onClick={onOpenSettings}
                    title="Page Settings"
                >
                    <Settings size={18} />
                </button>

                <div className="topbar-divider" />

                {/* Save Status */}
                <div className="save-status">
                    {isSaving ? (
                        <span className="saving">
                            <Loader2 size={14} className="spin" />
                            Saving...
                        </span>
                    ) : (
                        <span className="last-saved">
                            <Clock size={14} />
                            {formatLastSaved()}
                        </span>
                    )}
                </div>

                {/* Save Button */}
                <button
                    className="btn-save"
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                >
                    <Save size={16} />
                    <span>Save</span>
                </button>

                {/* Preview Button */}
                <button
                    className="btn-preview"
                    onClick={handlePreview}
                >
                    <ExternalLink size={16} />
                    <span>Preview</span>
                </button>

                {/* Publish Button */}
                <div className="publish-wrapper">
                    <button
                        className="btn-publish"
                        onClick={() => setShowPublishMenu(!showPublishMenu)}
                        disabled={isPublishing}
                    >
                        {isPublishing ? (
                            <Loader2 size={16} className="spin" />
                        ) : page?.status === 'published' ? (
                            <CheckCircle size={16} />
                        ) : (
                            <Rocket size={16} />
                        )}
                        <span>{page?.status === 'published' ? 'Update' : 'Publish'}</span>
                        <ChevronDown size={14} />
                    </button>

                    {showPublishMenu && (
                        <div className="publish-menu">
                            <button onClick={handlePublish}>
                                <Rocket size={16} />
                                <div>
                                    <strong>Publish Now</strong>
                                    <span>Make changes live immediately</span>
                                </div>
                            </button>
                            <button onClick={() => handleSave(true)}>
                                <Save size={16} />
                                <div>
                                    <strong>Save Version</strong>
                                    <span>Create a named version point</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TopBar
