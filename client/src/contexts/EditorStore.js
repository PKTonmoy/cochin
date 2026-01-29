/**
 * Editor Context using Zustand
 * Global state management for the CMS page editor
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import api from '../lib/api'

const useEditorStore = create(
    immer((set, get) => ({
        // Current page being edited
        page: null,
        pageId: null,
        isLoading: false,
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: null,

        // Selection state
        selectedSectionId: null,
        selectedElementPath: null,
        hoveredSectionId: null,

        // UI state
        previewMode: 'desktop', // 'desktop', 'tablet', 'mobile'
        isPreviewMode: false,
        sidebarTab: 'sections', // 'sections', 'pages', 'blocks'
        propertiesTab: 'content', // 'content', 'style', 'layout', 'animation'
        showBlockPicker: false,
        insertPosition: null, // Position to insert new block

        // Undo/Redo
        history: [],
        historyIndex: -1,
        maxHistory: 50,

        // ==================== PAGE ACTIONS ====================

        // Load a page by slug
        loadPage: async (slug) => {
            set({ isLoading: true })
            try {
                const response = await api.get(`/cms/pages/${slug}`)
                if (response.data.success) {
                    set(state => {
                        state.page = response.data.data
                        state.pageId = response.data.data._id
                        state.isLoading = false
                        state.hasUnsavedChanges = false
                        state.selectedSectionId = null
                        state.history = [JSON.stringify(response.data.data.sections)]
                        state.historyIndex = 0
                    })
                }
            } catch (error) {
                console.error('Failed to load page:', error)
                set({ isLoading: false })
                throw error
            }
        },

        // Save page (auto-save or manual)
        savePage: async (createVersion = false, versionNote = '') => {
            const { page, pageId } = get()
            if (!pageId || !page) return

            set({ isSaving: true })
            try {
                const response = await api.put(`/cms/pages/${pageId}`, {
                    sections: page.sections,
                    settings: page.settings,
                    seo: page.seo,
                    createVersion,
                    versionNote
                })
                if (response.data.success) {
                    set(state => {
                        state.isSaving = false
                        state.hasUnsavedChanges = false
                        state.lastSaved = new Date()
                        if (response.data.data.currentVersion) {
                            state.page.currentVersion = response.data.data.currentVersion
                        }
                    })
                }
            } catch (error) {
                console.error('Failed to save page:', error)
                set({ isSaving: false })
                throw error
            }
        },

        // Publish page
        publishPage: async () => {
            const { pageId } = get()
            if (!pageId) return

            try {
                const response = await api.post(`/cms/pages/${pageId}/publish`)
                if (response.data.success) {
                    set(state => {
                        state.page.status = 'published'
                        state.page.publishedAt = new Date()
                    })
                    return response.data
                }
            } catch (error) {
                console.error('Failed to publish:', error)
                throw error
            }
        },

        // Generate preview link
        generatePreviewLink: async () => {
            const { pageId } = get()
            if (!pageId) return null

            try {
                const response = await api.post(`/cms/pages/${pageId}/preview-link`)
                return response.data.data
            } catch (error) {
                console.error('Failed to generate preview link:', error)
                throw error
            }
        },

        // ==================== SECTION ACTIONS ====================

        // Add a new section
        addSection: async (type, content = null, position = null) => {
            const { pageId, page } = get()
            if (!pageId) return

            try {
                const response = await api.post(`/cms/pages/${pageId}/sections`, {
                    type,
                    content,
                    position: position !== null ? position : page.sections.length
                })

                if (response.data.success) {
                    const newSection = response.data.data.section
                    set(state => {
                        if (position !== null && position < state.page.sections.length) {
                            state.page.sections.splice(position, 0, newSection)
                            // Update order for all sections
                            state.page.sections.forEach((s, i) => { s.order = i })
                        } else {
                            state.page.sections.push(newSection)
                        }
                        state.selectedSectionId = newSection.id
                        state.hasUnsavedChanges = true
                        state.showBlockPicker = false
                        state.insertPosition = null
                    })
                    get().pushToHistory()
                    return newSection
                }
            } catch (error) {
                console.error('Failed to add section:', error)
                throw error
            }
        },

        // Update section content
        updateSectionContent: (sectionId, contentPath, value) => {
            set(state => {
                const sectionIndex = state.page.sections.findIndex(s => s.id === sectionId)
                if (sectionIndex === -1) return

                const section = state.page.sections[sectionIndex]

                // Ensure content object exists
                if (!section.content) {
                    section.content = {}
                }

                // Handle nested paths like "headline.text"
                const paths = contentPath.split('.')

                if (paths.length === 1) {
                    // Simple path like "buttons" or "body"
                    section.content[paths[0]] = value
                } else {
                    // Nested path like "headline.text"
                    let current = section.content
                    for (let i = 0; i < paths.length - 1; i++) {
                        const key = paths[i]
                        if (current[key] === undefined || current[key] === null) {
                            current[key] = {}
                        }
                        current = current[key]
                    }
                    current[paths[paths.length - 1]] = value
                }

                state.hasUnsavedChanges = true
            })
        },

        // Update section styles
        updateSectionStyles: (sectionId, styles) => {
            set(state => {
                const section = state.page.sections.find(s => s.id === sectionId)
                if (section) {
                    section.styles = { ...section.styles, ...styles }
                    state.hasUnsavedChanges = true
                }
            })
        },

        // Update full section
        updateSection: (sectionId, updates) => {
            set(state => {
                const index = state.page.sections.findIndex(s => s.id === sectionId)
                if (index !== -1) {
                    state.page.sections[index] = { ...state.page.sections[index], ...updates }
                    state.hasUnsavedChanges = true
                }
            })
        },

        // Delete section
        deleteSection: async (sectionId) => {
            const { pageId } = get()
            if (!pageId) return

            try {
                await api.delete(`/cms/pages/${pageId}/sections/${sectionId}`)
                set(state => {
                    state.page.sections = state.page.sections.filter(s => s.id !== sectionId)
                    state.page.sections.forEach((s, i) => { s.order = i })
                    if (state.selectedSectionId === sectionId) {
                        state.selectedSectionId = null
                    }
                    state.hasUnsavedChanges = true
                })
                get().pushToHistory()
            } catch (error) {
                console.error('Failed to delete section:', error)
                throw error
            }
        },

        // Duplicate section
        duplicateSection: (sectionId) => {
            const { page } = get()
            const section = page.sections.find(s => s.id === sectionId)
            if (section) {
                const position = page.sections.findIndex(s => s.id === sectionId) + 1
                get().addSection(section.type, JSON.parse(JSON.stringify(section.content)), position)
            }
        },

        // Move section up/down
        moveSection: (sectionId, direction) => {
            set(state => {
                const index = state.page.sections.findIndex(s => s.id === sectionId)
                if (index === -1) return

                const newIndex = direction === 'up' ? index - 1 : index + 1
                if (newIndex < 0 || newIndex >= state.page.sections.length) return

                const [section] = state.page.sections.splice(index, 1)
                state.page.sections.splice(newIndex, 0, section)
                state.page.sections.forEach((s, i) => { s.order = i })
                state.hasUnsavedChanges = true
            })
            get().pushToHistory()
        },

        // Reorder sections (drag & drop)
        reorderSections: (fromIndex, toIndex) => {
            set(state => {
                const [section] = state.page.sections.splice(fromIndex, 1)
                state.page.sections.splice(toIndex, 0, section)
                state.page.sections.forEach((s, i) => { s.order = i })
                state.hasUnsavedChanges = true
            })
            get().pushToHistory()
        },

        // Toggle section visibility
        toggleSectionVisibility: (sectionId) => {
            set(state => {
                const section = state.page.sections.find(s => s.id === sectionId)
                if (section) {
                    section.visible = !section.visible
                    state.hasUnsavedChanges = true
                }
            })
        },

        // ==================== SELECTION ACTIONS ====================

        selectSection: (sectionId) => {
            set({ selectedSectionId: sectionId, selectedElementPath: null })
        },

        selectElement: (sectionId, elementPath) => {
            set({ selectedSectionId: sectionId, selectedElementPath: elementPath })
        },

        clearSelection: () => {
            set({ selectedSectionId: null, selectedElementPath: null })
        },

        setHoveredSection: (sectionId) => {
            set({ hoveredSectionId: sectionId })
        },

        // ==================== UI ACTIONS ====================

        setPreviewMode: (mode) => set({ previewMode: mode }),
        togglePreviewMode: () => set(state => ({ isPreviewMode: !state.isPreviewMode })),
        setSidebarTab: (tab) => set({ sidebarTab: tab }),
        setPropertiesTab: (tab) => set({ propertiesTab: tab }),

        openBlockPicker: (position = null) => {
            set({ showBlockPicker: true, insertPosition: position })
        },
        closeBlockPicker: () => {
            set({ showBlockPicker: false, insertPosition: null })
        },

        // ==================== HISTORY (UNDO/REDO) ====================

        pushToHistory: () => {
            const { page, history, historyIndex, maxHistory } = get()
            const snapshot = JSON.stringify(page.sections)

            set(state => {
                // Remove any future history if we're not at the end
                state.history = state.history.slice(0, historyIndex + 1)
                state.history.push(snapshot)

                // Limit history size
                if (state.history.length > maxHistory) {
                    state.history = state.history.slice(-maxHistory)
                }
                state.historyIndex = state.history.length - 1
            })
        },

        undo: () => {
            const { history, historyIndex } = get()
            if (historyIndex > 0) {
                set(state => {
                    state.historyIndex -= 1
                    state.page.sections = JSON.parse(history[state.historyIndex])
                    state.hasUnsavedChanges = true
                })
            }
        },

        redo: () => {
            const { history, historyIndex } = get()
            if (historyIndex < history.length - 1) {
                set(state => {
                    state.historyIndex += 1
                    state.page.sections = JSON.parse(history[state.historyIndex])
                    state.hasUnsavedChanges = true
                })
            }
        },

        canUndo: () => get().historyIndex > 0,
        canRedo: () => get().historyIndex < get().history.length - 1,

        // ==================== CLEANUP ====================

        reset: () => {
            set({
                page: null,
                pageId: null,
                isLoading: false,
                isSaving: false,
                hasUnsavedChanges: false,
                selectedSectionId: null,
                selectedElementPath: null,
                hoveredSectionId: null,
                history: [],
                historyIndex: -1
            })
        }
    }))
)

export default useEditorStore
