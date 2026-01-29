import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    Clock,
    X,
    Save,
    BookOpen,
    Calendar
} from 'lucide-react'

const TestList = () => {
    const queryClient = useQueryClient()
    const [searchParams, setSearchParams] = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [filter, setFilter] = useState('all') // all, published, pending
    const [classFilter, setClassFilter] = useState(searchParams.get('class') || '')
    const [editingTest, setEditingTest] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    const page = parseInt(searchParams.get('page')) || 1

    // Fetch tests
    const { data, isLoading } = useQuery({
        queryKey: ['tests', page, search, classFilter, filter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page,
                limit: 20,
                ...(search && { search }),
                ...(classFilter && { class: classFilter }),
                ...(filter !== 'all' && { isPublished: filter === 'published' })
            })
            const response = await api.get(`/tests?${params}`)
            return response.data.data
        }
    })

    // Update test mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await api.put(`/tests/${id}`, data)
            return response.data
        },
        onSuccess: () => {
            toast.success('Test updated successfully!')
            queryClient.invalidateQueries(['tests'])
            setEditingTest(null)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update test')
        }
    })

    // Delete test mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const response = await api.delete(`/tests/${id}`)
            return response.data
        },
        onSuccess: () => {
            toast.success('Test deleted successfully!')
            queryClient.invalidateQueries(['tests'])
            setDeletingId(null)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete test')
            setDeletingId(null)
        }
    })

    // Publish/unpublish mutation
    const publishMutation = useMutation({
        mutationFn: async ({ id, isPublished }) => {
            if (isPublished) {
                // Unpublish
                const response = await api.put(`/tests/${id}`, { isPublished: false })
                return response.data
            } else {
                // Publish
                const response = await api.post(`/tests/${id}/publish`)
                return response.data
            }
        },
        onSuccess: (_, { isPublished }) => {
            toast.success(isPublished ? 'Test unpublished!' : 'Test published!')
            queryClient.invalidateQueries(['tests'])
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Operation failed')
        }
    })

    const handleSearch = (e) => {
        e.preventDefault()
        setSearchParams({ ...Object.fromEntries(searchParams), search, page: 1 })
    }

    const handleDelete = (test) => {
        if (window.confirm(`Are you sure you want to delete "${test.testName}"? This will also delete all associated results.`)) {
            setDeletingId(test._id)
            deleteMutation.mutate(test._id)
        }
    }

    const handleEditSubmit = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        updateMutation.mutate({
            id: editingTest._id,
            data: {
                testName: formData.get('testName'),
                class: formData.get('class'),
                date: formData.get('date'),
                description: formData.get('description')
            }
        })
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary)]">Tests</h1>
                    <p className="text-gray-500">Manage exams and tests</p>
                </div>
                <Link to="/admin/tests/add" className="btn btn-primary">
                    <Plus size={18} /> Create Test
                </Link>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            className="input pl-10"
                            placeholder="Search by test name or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="input w-full md:w-40"
                        value={classFilter}
                        onChange={(e) => {
                            setClassFilter(e.target.value)
                            setSearchParams({ ...Object.fromEntries(searchParams), class: e.target.value, page: 1 })
                        }}
                    >
                        <option value="">All Classes</option>
                        {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                            <option key={c} value={c}>Class {c}</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        {['all', 'published', 'pending'].map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => setFilter(f)}
                                className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                            >
                                {f === 'all' ? 'All' : f === 'published' ? 'Published' : 'Pending'}
                            </button>
                        ))}
                    </div>
                </form>
            </div>

            {/* Tests Table */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Test</th>
                                        <th>Class</th>
                                        <th>Date</th>
                                        <th>Subjects</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.tests?.map((test) => (
                                        <tr key={test._id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium">{test.testName}</p>
                                                    <p className="text-sm text-gray-500">{test.testCode}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="font-medium">Class {test.class}</span>
                                                {test.section && <span className="text-gray-500"> - {test.section}</span>}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <Calendar size={14} />
                                                    {formatDate(test.date)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <BookOpen size={14} className="text-gray-400" />
                                                    <span>{test.subjects?.length || 0} subjects</span>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="text-[var(--secondary)]">{test.totalMaxMarks} marks</span>
                                                </div>
                                            </td>
                                            <td>
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            checked={test.isPublished}
                                                            onChange={() => publishMutation.mutate({ id: test._id, isPublished: test.isPublished })}
                                                            disabled={publishMutation.isPending}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[var(--success)] transition-colors"></div>
                                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                                                    </div>
                                                    {test.isPublished ? (
                                                        <span className="badge badge-success flex items-center gap-1">
                                                            <CheckCircle size={14} />
                                                            Complete
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-warning flex items-center gap-1">
                                                            <Clock size={14} />
                                                            Pending
                                                        </span>
                                                    )}
                                                </label>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingTest(test)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} className="text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(test)}
                                                        disabled={deletingId === test._id}
                                                        className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                                                        title="Delete"
                                                    >
                                                        {deletingId === test._id ? (
                                                            <span className="spinner w-4 h-4 border-2"></span>
                                                        ) : (
                                                            <Trash2 size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {data?.tests?.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-gray-500">
                                                No tests found. Create your first test to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data?.pagination && data.pagination.pages > 1 && (
                            <div className="p-4 border-t flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: page - 1 })}
                                        disabled={page === 1}
                                        className="btn btn-outline py-2 px-4"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: page + 1 })}
                                        disabled={page >= data.pagination.pages}
                                        className="btn btn-outline py-2 px-4"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Modal */}
            {editingTest && (
                <div className="modal-overlay" onClick={() => setEditingTest(null)}>
                    <div className="modal-content w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[var(--primary)]">Edit Test</h2>
                            <button onClick={() => setEditingTest(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                                <input
                                    name="testName"
                                    defaultValue={editingTest.testName}
                                    className="input"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                    <select name="class" defaultValue={editingTest.class} className="input">
                                        {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                                            <option key={c} value={c}>Class {c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        name="date"
                                        type="date"
                                        defaultValue={editingTest.date?.split('T')[0]}
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea
                                    name="description"
                                    defaultValue={editingTest.description}
                                    className="input"
                                    rows={3}
                                    placeholder="Add a description..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setEditingTest(null)} className="btn btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                                    <Save size={18} />
                                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TestList
