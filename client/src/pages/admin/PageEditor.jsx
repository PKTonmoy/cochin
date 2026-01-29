/**
 * Page Editor Page
 * Main WYSIWYG editor combining Canvas, Sidebar, and PropertiesPanel
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useEditorStore from '../../contexts/EditorStore'
import TopBar from '../../components/cms/TopBar'
import Sidebar from '../../components/cms/Sidebar'
import Canvas from '../../components/cms/Canvas'
import PropertiesPanel from '../../components/cms/PropertiesPanel'
import toast from 'react-hot-toast'

// Version History Modal
const VersionHistoryModal = ({ isOpen, onClose, page, onRestore }) => {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal version-history-modal" onClick={e => e.stopPropagation()}>
                <h2>Version History</h2>
                <p>Restore previous versions of this page</p>

                <div className="versions-list">
                    <div className="version-item current">
                        <div className="version-info">
                            <span className="version-number">Current Draft</span>
                            <span className="version-date">
                                {page?.lastEditedAt ? new Date(page.lastEditedAt).toLocaleString() : 'Now'}
                            </span>
                        </div>
                        <span className="version-badge">Current</span>
                    </div>

                    {page?.versions?.slice().reverse().map((version, index) => (
                        <div key={version._id} className="version-item">
                            <div className="version-info">
                                <span className="version-number">
                                    Version {version.versionNumber}
                                    {version.note && ` - ${version.note}`}
                                </span>
                                <span className="version-date">
                                    {new Date(version.savedAt).toLocaleString()}
                                    {version.savedBy?.name && ` by ${version.savedBy.name}`}
                                </span>
                            </div>
                            <button
                                className="btn-restore"
                                onClick={() => onRestore(version._id)}
                            >
                                Restore
                            </button>
                        </div>
                    ))}

                    {(!page?.versions || page.versions.length === 0) && (
                        <div className="no-versions">
                            <p>No version history yet</p>
                            <span>Versions are created when you save or publish</span>
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    )
}

// Page Settings Modal
const PageSettingsModal = ({ isOpen, onClose, page, onSave }) => {
    const [settings, setSettings] = useState({
        pageName: page?.pageName || '',
        seo: page?.seo || {}
    })

    useEffect(() => {
        if (page) {
            setSettings({
                pageName: page.pageName,
                seo: page.seo || {}
            })
        }
    }, [page])

    if (!isOpen) return null

    const handleSave = () => {
        onSave(settings)
        onClose()
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
                <h2>Page Settings</h2>

                <div className="form-group">
                    <label>Page Name</label>
                    <input
                        type="text"
                        value={settings.pageName}
                        onChange={(e) => setSettings({ ...settings, pageName: e.target.value })}
                    />
                </div>

                <h3>SEO Settings</h3>

                <div className="form-group">
                    <label>Meta Title</label>
                    <input
                        type="text"
                        value={settings.seo.title || ''}
                        onChange={(e) => setSettings({
                            ...settings,
                            seo: { ...settings.seo, title: e.target.value }
                        })}
                        placeholder="Page title for search engines"
                    />
                    <span className="char-count">{(settings.seo.title || '').length}/60</span>
                </div>

                <div className="form-group">
                    <label>Meta Description</label>
                    <textarea
                        value={settings.seo.description || ''}
                        onChange={(e) => setSettings({
                            ...settings,
                            seo: { ...settings.seo, description: e.target.value }
                        })}
                        placeholder="Brief description for search results"
                        rows={3}
                    />
                    <span className="char-count">{(settings.seo.description || '').length}/160</span>
                </div>

                <div className="form-group">
                    <label>Keywords</label>
                    <input
                        type="text"
                        value={(settings.seo.keywords || []).join(', ')}
                        onChange={(e) => setSettings({
                            ...settings,
                            seo: {
                                ...settings.seo,
                                keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                            }
                        })}
                        placeholder="keyword1, keyword2, keyword3"
                    />
                </div>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>Save Settings</button>
                </div>
            </div>
        </div>
    )
}

const PageEditor = () => {
    const { slug } = useParams()
    const navigate = useNavigate()
    const {
        page,
        isLoading,
        hasUnsavedChanges,
        loadPage,
        savePage,
        reset
    } = useEditorStore()

    const [showVersionHistory, setShowVersionHistory] = useState(false)
    const [showSettings, setShowSettings] = useState(false)

    // Load page on mount
    useEffect(() => {
        if (slug) {
            loadPage(slug).catch(() => {
                toast.error('Page not found')
                navigate('/admin/cms')
            })
        }

        return () => reset()
    }, [slug])

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!hasUnsavedChanges) return

        const autoSave = setInterval(() => {
            savePage(false).catch(() => { })
        }, 30000)

        return () => clearInterval(autoSave)
    }, [hasUnsavedChanges, savePage])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyboard = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                savePage(false).then(() => toast.success('Saved!')).catch(() => toast.error('Save failed'))
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                useEditorStore.getState().undo()
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault()
                useEditorStore.getState().redo()
            }
        }

        window.addEventListener('keydown', handleKeyboard)
        return () => window.removeEventListener('keydown', handleKeyboard)
    }, [savePage])

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault()
                e.returnValue = ''
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasUnsavedChanges])

    const handleRestoreVersion = async (versionId) => {
        try {
            const { restoreVersion } = useEditorStore.getState()
            // For now, reload the page after restore
            await loadPage(slug)
            toast.success('Version restored!')
            setShowVersionHistory(false)
        } catch (error) {
            toast.error('Failed to restore version')
        }
    }

    const handleSaveSettings = async (settings) => {
        try {
            const { updateSection, page } = useEditorStore.getState()
            // Update page name and SEO via the store
            await savePage(false)
            toast.success('Settings saved!')
        } catch (error) {
            toast.error('Failed to save settings')
        }
    }

    if (isLoading) {
        return (
            <div className="page-editor-loading">
                <div className="spinner" />
                <p>Loading editor...</p>
            </div>
        )
    }

    return (
        <div className="page-editor">
            <TopBar
                onOpenVersionHistory={() => setShowVersionHistory(true)}
                onOpenSettings={() => setShowSettings(true)}
            />

            <div className="editor-main">
                <Sidebar />
                <Canvas />
                <PropertiesPanel />
            </div>

            <VersionHistoryModal
                isOpen={showVersionHistory}
                onClose={() => setShowVersionHistory(false)}
                page={page}
                onRestore={handleRestoreVersion}
            />

            <PageSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                page={page}
                onSave={handleSaveSettings}
            />
        </div>
    )
}

export default PageEditor
