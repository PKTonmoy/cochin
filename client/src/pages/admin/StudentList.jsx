import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import {
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    Edit,
    Trash2,
    Phone,
    AlertTriangle
} from 'lucide-react'
import TableSkeleton from '../../components/TableSkeleton'

const StudentList = () => {
    const queryClient = useQueryClient()
    const [searchParams, setSearchParams] = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [filters, setFilters] = useState({
        class: searchParams.get('class') || '',
        status: searchParams.get('status') || ''
    })
    const [deletingId, setDeletingId] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const page = parseInt(searchParams.get('page')) || 1

    const { data, isLoading } = useQuery({
        queryKey: ['students', page, search, filters],
        queryFn: async () => {
            const params = new URLSearchParams({
                page,
                limit: 20,
                ...(search && { search }),
                ...(filters.class && { class: filters.class }),
                ...(filters.status && { status: filters.status })
            })
            const response = await api.get(`/students?${params}`)
            return response.data.data
        }
    })

    const handleSearch = (e) => {
        e.preventDefault()
        setSearchParams({ ...Object.fromEntries(searchParams), search, page: 1 })
    }

    const exportStudents = async () => {
        try {
            const response = await api.get('/students/export', { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'students.xlsx')
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('Export started')
        } catch (error) {
            toast.error('Export failed')
        }
    }

    // Delete student mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const response = await api.delete(`/students/${id}`)
            return response.data
        },
        onSuccess: () => {
            toast.success('Student deactivated successfully!')
            queryClient.invalidateQueries(['students'])
            setDeletingId(null)
            setDeleteConfirm(null)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete student')
        }
    })

    // Status change mutation
    const statusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            const response = await api.put(`/students/${id}`, { status })
            return response.data
        },
        onSuccess: () => {
            toast.success('Status updated!')
            queryClient.invalidateQueries(['students'])
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update status')
        }
    })

    const handleStatusChange = (studentId, newStatus) => {
        statusMutation.mutate({ id: studentId, status: newStatus })
    }


    const handleDelete = (student) => {
        setDeleteConfirm(student)
    }

    const confirmDelete = () => {
        if (deleteConfirm) {
            setDeletingId(deleteConfirm._id)
            deleteMutation.mutate(deleteConfirm._id)
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            active: 'badge-success',
            pending_payment: 'badge-warning',
            suspended: 'badge-danger',
            inactive: 'badge-info'
        }
        return badges[status] || 'badge-info'
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary)]">Students</h1>
                    <p className="text-gray-500">Manage enrolled students</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportStudents} className="btn btn-outline">
                        <Download size={18} />
                        Export
                    </button>
                    <Link to="/admin/students/add" className="btn btn-primary">
                        <Plus size={18} />
                        Add Student
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            className="input pl-10"
                            placeholder="Search by name, roll, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="input w-full md:w-40"
                        value={filters.class}
                        onChange={(e) => {
                            setFilters({ ...filters, class: e.target.value })
                            setSearchParams({ ...Object.fromEntries(searchParams), class: e.target.value, page: 1 })
                        }}
                    >
                        <option value="">All Classes</option>
                        {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                            <option key={c} value={c}>Class {c}</option>
                        ))}
                    </select>
                    <select
                        className="input w-full md:w-40"
                        value={filters.status}
                        onChange={(e) => {
                            setFilters({ ...filters, status: e.target.value })
                            setSearchParams({ ...Object.fromEntries(searchParams), status: e.target.value, page: 1 })
                        }}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending_payment">Pending Payment</option>
                        <option value="suspended">Suspended</option>
                    </select>
                    <button type="submit" className="btn btn-primary">
                        <Filter size={18} />
                        Filter
                    </button>
                </form>
            </div>


            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-4">
                        <TableSkeleton columns={6} rows={10} />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Class</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Dues</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.students?.map((student) => (
                                        <tr key={student._id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-medium">
                                                        {student.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{student.name}</p>
                                                        <p className="text-sm text-gray-500">{student.roll}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="font-medium">{student.class}</span>
                                                {student.section && <span className="text-gray-500"> - {student.section}</span>}
                                            </td>
                                            <td>
                                                <a href={`tel:${student.phone}`} className="text-[var(--secondary)] hover:underline flex items-center gap-1">
                                                    <Phone size={14} />
                                                    {student.phone}
                                                </a>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        Active
                                                    </span>
                                                    {student.dueAmount > 0 && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                            Due
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {student.dueAmount > 0 ? (
                                                    <span className="text-red-600 font-medium">৳{student.dueAmount?.toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-green-600">Paid</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        to={`/admin/students/${student._id}/edit`}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} className="text-gray-500" />
                                                    </Link>
                                                    <Link
                                                        to={`/admin/students/${student._id}`}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                        title="View"
                                                    >
                                                        <Eye size={18} className="text-gray-500" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(student)}
                                                        disabled={deletingId === student._id}
                                                        className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                                                        title="Delete"
                                                    >
                                                        {deletingId === student._id ? (
                                                            <span className="spinner w-4 h-4 border-2"></span>
                                                        ) : (
                                                            <Trash2 size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {data?.students?.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-gray-500">
                                                No students found
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

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle size={24} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Student</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-red-800">
                                <strong>Warning:</strong> You are about to deactivate <strong>{deleteConfirm.name}</strong> ({deleteConfirm.roll}).
                                The student will no longer be able to log in or appear in active lists.
                            </p>
                            {deleteConfirm.dueAmount > 0 && (
                                <p className="text-sm text-red-800 mt-2">
                                    ⚠️ This student has a pending due of <strong>৳{deleteConfirm.dueAmount?.toLocaleString()}</strong>
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                                className="btn btn-danger"
                            >
                                {deleteMutation.isPending ? (
                                    <>
                                        <span className="spinner w-4 h-4 border-2"></span>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={18} />
                                        Delete Student
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StudentList
