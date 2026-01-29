/**
 * Class List Page
 * Admin view for managing classes
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
    Plus,
    Search,
    Filter,
    Calendar,
    Clock,
    MapPin,
    User,
    Video,
    MoreVertical,
    Edit,
    Trash2,
    XCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Upload,
    CalendarDays
} from 'lucide-react'
import api from '../../lib/api'

export default function ClassList() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState({
        class: '',
        subject: '',
        status: '',
        fromDate: '',
        toDate: '',
        search: ''
    })
    const [showFilters, setShowFilters] = useState(false)
    const [actionMenu, setActionMenu] = useState(null)
    const [cancelModal, setCancelModal] = useState(null)
    const [cancelReason, setCancelReason] = useState('')

    // Fetch classes
    const { data, isLoading } = useQuery({
        queryKey: ['classes', page, filters],
        queryFn: async () => {
            const params = new URLSearchParams({ page, limit: 20 })
            if (filters.class) params.append('class', filters.class)
            if (filters.subject) params.append('subject', filters.subject)
            if (filters.status) params.append('status', filters.status)
            if (filters.fromDate) params.append('fromDate', filters.fromDate)
            if (filters.toDate) params.append('toDate', filters.toDate)
            if (filters.search) params.append('search', filters.search)

            const response = await api.get(`/classes?${params}`)
            return response.data.data
        }
    })

    // Cancel mutation
    const cancelMutation = useMutation({
        mutationFn: ({ id, reason }) => api.post(`/classes/${id}/cancel`, { reason }),
        onSuccess: () => {
            toast.success('Class cancelled successfully')
            queryClient.invalidateQueries({ queryKey: ['classes'] })
            setCancelModal(null)
            setCancelReason('')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to cancel class')
        }
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/classes/${id}`),
        onSuccess: () => {
            toast.success('Class deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['classes'] })
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete class')
        }
    })

    const classes = data?.classes || []
    const pagination = data?.pagination || { page: 1, pages: 1, total: 0 }

    const getStatusBadge = (status) => {
        const styles = {
            scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            ongoing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            rescheduled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        }
        return styles[status] || styles.scheduled
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary)]">Classes</h1>
                    <p className="text-gray-500">Manage class schedules</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        to="/admin/schedule-calendar"
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <CalendarDays className="w-4 h-4" />
                        Calendar View
                    </Link>
                    <Link
                        to="/admin/classes/add"
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Class
                    </Link>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search classes..."
                            value={filters.search}
                            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                            className="input pl-10 w-full"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} flex items-center gap-2`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-200">
                        <select
                            value={filters.class}
                            onChange={(e) => setFilters(f => ({ ...f, class: e.target.value }))}
                            className="input"
                        >
                            <option value="">All Classes</option>
                            <option value="6">Class 6</option>
                            <option value="7">Class 7</option>
                            <option value="8">Class 8</option>
                            <option value="9">Class 9</option>
                            <option value="10">Class 10</option>
                            <option value="1st Timer">1st Timer</option>
                            <option value="2nd Timer">2nd Timer</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Subject"
                            value={filters.subject}
                            onChange={(e) => setFilters(f => ({ ...f, subject: e.target.value }))}
                            className="input"
                        />
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                            className="input"
                        >
                            <option value="">All Status</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => setFilters(f => ({ ...f, fromDate: e.target.value }))}
                            className="input"
                            placeholder="From Date"
                        />
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => setFilters(f => ({ ...f, toDate: e.target.value }))}
                            className="input"
                            placeholder="To Date"
                        />
                    </div>
                )}
            </div>

            {/* Class List */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="spinner mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading classes...</p>
                    </div>
                ) : classes.length === 0 ? (
                    <div className="p-8 text-center">
                        <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">No classes found</p>
                        <Link to="/admin/classes/add" className="btn-primary mt-4">
                            Create First Class
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Class</th>
                                        <th>Date & Time</th>
                                        <th>Target</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map((cls) => (
                                        <tr key={cls._id}>
                                            <td>
                                                <div>
                                                    <p className="font-medium">{cls.title}</p>
                                                    <p className="text-sm text-gray-500">{cls.subject}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span>{format(new Date(cls.date), 'MMM d, yyyy')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span>{cls.startTime} - {cls.endTime}</span>
                                                </div>
                                            </td>
                                            <td className="text-sm">
                                                <span className="font-medium">{cls.class}</span>
                                                {cls.section && <span className="text-gray-500"> - {cls.section}</span>}
                                            </td>
                                            <td className="text-sm">
                                                {cls.isOnline ? (
                                                    <div className="flex items-center gap-1 text-blue-600">
                                                        <Video className="w-4 h-4" />
                                                        <span>Online</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4 text-gray-400" />
                                                        <span>{cls.room || 'TBA'}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(cls.status)}`}>
                                                    {cls.status}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActionMenu(actionMenu === cls._id ? null : cls._id)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {actionMenu === cls._id && (
                                                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                            <Link
                                                                to={`/admin/classes/${cls._id}/edit`}
                                                                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                                Edit
                                                            </Link>
                                                            <Link
                                                                to={`/admin/classes/${cls._id}/reschedule`}
                                                                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                                Reschedule
                                                            </Link>
                                                            {cls.status !== 'cancelled' && cls.status !== 'completed' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setCancelModal(cls)
                                                                        setActionMenu(null)
                                                                    }}
                                                                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left text-orange-600"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                    Cancel
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('Are you sure you want to delete this class?')) {
                                                                        deleteMutation.mutate(cls._id)
                                                                    }
                                                                    setActionMenu(null)
                                                                }}
                                                                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Showing {((pagination.page - 1) * 20) + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} classes
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={pagination.page <= 1}
                                    className="btn btn-outline p-2 disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                    disabled={pagination.page >= pagination.pages}
                                    className="btn btn-outline p-2 disabled:opacity-50"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Cancel Modal */}
            {cancelModal && (
                <div className="modal-overlay">
                    <div className="modal-content max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4 text-[var(--primary)]">Cancel Class</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to cancel "{cancelModal.title}"? Students will be notified.
                        </p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Reason for cancellation (optional)"
                            className="input w-full h-24 mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setCancelModal(null)
                                    setCancelReason('')
                                }}
                                className="btn btn-outline"
                            >
                                Keep Class
                            </button>
                            <button
                                onClick={() => cancelMutation.mutate({ id: cancelModal._id, reason: cancelReason })}
                                disabled={cancelMutation.isPending}
                                className="btn btn-danger"
                            >
                                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Class'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
