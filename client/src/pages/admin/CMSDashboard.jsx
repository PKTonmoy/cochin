/**
 * CMS Dashboard Page
 * List all pages with create, edit, preview, delete actions
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Plus,
    FileText,
    Edit,
    Eye,
    Trash2,
    Copy,
    Search,
    MoreVertical,
    Clock,
    CheckCircle,
    Calendar,
    ExternalLink,
    Settings
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const CMSDashboard = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newPage, setNewPage] = useState({ pageName: '', slug: '' })

    // Fetch pages
    const { data: pages, isLoading } = useQuery({
        queryKey: ['cms-pages', statusFilter, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (searchQuery) params.append('search', searchQuery)
            const res = await api.get(`/cms/pages?${params}`)
            return res.data.data
        }
    })

    // Create page mutation
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/cms/pages', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['cms-pages'])
            toast.success('Page created!')
            setShowCreateModal(false)
            navigate(`/admin/cms/pages/${res.data.data.slug}`)
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create page')
    })

    // Delete page mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/cms/pages/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['cms-pages'])
            toast.success('Page deleted')
        },
        onError: () => toast.error('Failed to delete page')
    })

    // Duplicate page mutation
    const duplicateMutation = useMutation({
        mutationFn: ({ id, newSlug, newName }) =>
            api.post(`/cms/pages/${id}/duplicate`, { newSlug, newName }),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['cms-pages'])
            toast.success('Page duplicated!')
            navigate(`/admin/cms/pages/${res.data.data.slug}`)
        },
        onError: () => toast.error('Failed to duplicate page')
    })

    const handleCreatePage = (e) => {
        e.preventDefault()
        if (!newPage.pageName || !newPage.slug) {
            toast.error('Please fill in all fields')
            return
        }
        createMutation.mutate(newPage)
    }

    const handleDeletePage = (page) => {
        if (confirm(`Delete "${page.pageName}"? This action cannot be undone.`)) {
            deleteMutation.mutate(page._id)
        }
    }

    const handleDuplicatePage = (page) => {
        const newSlug = `${page.slug}-copy-${Date.now()}`
        duplicateMutation.mutate({
            id: page._id,
            newSlug,
            newName: `${page.pageName} (Copy)`
        })
    }

    const generateSlug = (name) => {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
    }

    const getStatusBadge = (status) => {
        const styles = {
            published: { bg: '#dcfce7', color: '#166534' },
            draft: { bg: '#fef3c7', color: '#92400e' },
            scheduled: { bg: '#dbeafe', color: '#1e40af' }
        }
        const icons = {
            published: CheckCircle,
            draft: Clock,
            scheduled: Calendar
        }
        const Icon = icons[status] || Clock
        const style = styles[status] || styles.draft

        return (
            <span
                className="status-badge"
                style={{
                    backgroundColor: style.bg,
                    color: style.color,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
            >
                <Icon size={12} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    }

    return (
        <div className="cms-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>Content Management</h1>
                    <p>Create and manage website pages with the visual editor</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={18} />
                    <span>Create Page</span>
                </button>
            </div>

            {/* Filters */}
            <div className="dashboard-filters">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search pages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-tabs">
                    {['all', 'published', 'draft', 'scheduled'].map(status => (
                        <button
                            key={status}
                            className={statusFilter === status ? 'active' : ''}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pages List */}
            {isLoading ? (
                <div className="loading-state">
                    <div className="spinner" />
                    <p>Loading pages...</p>
                </div>
            ) : pages?.length === 0 ? (
                <div className="empty-state">
                    <FileText size={48} />
                    <h3>No pages yet</h3>
                    <p>Create your first page to get started</p>
                    <button
                        className="btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={18} />
                        Create Page
                    </button>
                </div>
            ) : (
                <div className="pages-grid">
                    {pages?.map(page => (
                        <div key={page._id} className="page-card">
                            <div className="page-card-header">
                                <FileText size={20} />
                                <h3>{page.pageName}</h3>
                                {getStatusBadge(page.status)}
                            </div>

                            <div className="page-card-meta">
                                <span>/{page.slug}</span>
                                <span>•</span>
                                <span>v{page.currentVersion || 1}</span>
                                {page.lastEditedAt && (
                                    <>
                                        <span>•</span>
                                        <span>
                                            {new Date(page.lastEditedAt).toLocaleDateString()}
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="page-card-actions">
                                <Link
                                    to={`/admin/cms/pages/${page.slug}`}
                                    className="btn-edit"
                                >
                                    <Edit size={16} />
                                    <span>Edit</span>
                                </Link>

                                {page.status === 'published' && (
                                    <a
                                        href={`/${page.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-view"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                )}

                                <button
                                    className="btn-icon"
                                    onClick={() => handleDuplicatePage(page)}
                                    title="Duplicate"
                                >
                                    <Copy size={16} />
                                </button>

                                <button
                                    className="btn-icon delete"
                                    onClick={() => handleDeletePage(page)}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Page Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Create New Page</h2>
                        <form onSubmit={handleCreatePage}>
                            <div className="form-group">
                                <label>Page Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. About Us"
                                    value={newPage.pageName}
                                    onChange={(e) => setNewPage({
                                        ...newPage,
                                        pageName: e.target.value,
                                        slug: generateSlug(e.target.value)
                                    })}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>URL Slug</label>
                                <div className="slug-input">
                                    <span>/</span>
                                    <input
                                        type="text"
                                        placeholder="about-us"
                                        value={newPage.slug}
                                        onChange={(e) => setNewPage({
                                            ...newPage,
                                            slug: generateSlug(e.target.value)
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending ? 'Creating...' : 'Create Page'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CMSDashboard
