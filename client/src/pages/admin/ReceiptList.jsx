/**
 * ReceiptList Page
 * Admin page for viewing and managing all receipts
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
    Search,
    Filter,
    Download,
    Printer,
    Mail,
    Eye,
    MoreVertical,
    FileText,
    Calendar,
    User,
    RefreshCw,
    XCircle,
    CheckCircle,
    Clock,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import TableSkeleton from '../../components/TableSkeleton'
import api from '../../lib/api'
import { CLASSES } from '../../data/classData'

const ReceiptList = () => {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [filters, setFilters] = useState({
        class: '',
        paymentMethod: '',
        dateFrom: '',
        dateTo: '',
        status: ''
    })
    const [showFilters, setShowFilters] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState(null)
    const [showActionMenu, setShowActionMenu] = useState(null)

    // Fetch payments (receipts)
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['receipts', page, search, filters],
        queryFn: async () => {
            const params = new URLSearchParams({
                page,
                limit: 20,
                ...(search && { search }),
                ...(filters.class && { class: filters.class }),
                ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo })
            })
            const response = await api.get(`/payments?${params}`)
            return response.data.data
        }
    })

    // Email receipt mutation
    const emailMutation = useMutation({
        mutationFn: async (receiptId) => {
            return api.post(`/receipts/${receiptId}/email`)
        },
        onSuccess: () => {
            toast.success('Receipt emailed successfully')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send email')
        }
    })

    const handleDownloadPDF = async (receiptId) => {
        const toastId = toast.loading('Downloading PDF...')
        try {
            const response = await api.get(`/receipts/${receiptId}/pdf`, {
                responseType: 'blob'
            })

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `receipt-${receiptId}.pdf`)

            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success('Download complete', { id: toastId })
        } catch (error) {
            console.error('Download error:', error)
            // Fallback: fetch HTML and print
            try {
                const htmlResponse = await api.get(`/receipts/${receiptId}`, { responseType: 'text' })
                if (htmlResponse.data) {
                    toast.success('Opening print dialog — use "Save as PDF" to download', { icon: '🖨️', duration: 5000, id: toastId })
                    const printWindow = window.open('', '_blank')
                    if (printWindow) {
                        printWindow.document.write(htmlResponse.data)
                        printWindow.document.close()
                        // Add print style to ensure it fits nicely
                        const style = printWindow.document.createElement('style')
                        style.textContent = `
                            body { margin: 0; padding: 0; }
                            @page { size: A4; margin: 0; }
                        `
                        printWindow.document.head.appendChild(style)
                        printWindow.onload = () => printWindow.print()
                    }
                } else {
                    throw new Error('No content')
                }
            } catch (err) {
                toast.error('Failed to download PDF', { id: toastId })
            }
        }
    }

    const handlePrint = (receiptId) => {
        window.open(`/admin/receipts/${receiptId}`, '_blank')
    }

    const handleEmail = (receipt) => {
        if (!receipt.studentId?.email) {
            toast.error('Student does not have an email address')
            return
        }
        emailMutation.mutate(receipt.receiptId)
    }

    const getStatusBadge = (payment) => {
        if (payment.dueAmount <= 0) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Paid
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                <Clock className="w-3 h-3" />
                Partial
            </span>
        )
    }

    const getPaymentMethodBadge = (method) => {
        const methods = {
            cash: { label: 'Cash', class: 'bg-gray-100 text-gray-700' },
            bkash: { label: 'bKash', class: 'bg-pink-100 text-pink-700' },
            nagad: { label: 'Nagad', class: 'bg-orange-100 text-orange-700' },
            rocket: { label: 'Rocket', class: 'bg-purple-100 text-purple-700' },
            bank_transfer: { label: 'Bank', class: 'bg-blue-100 text-blue-700' },
            card: { label: 'Card', class: 'bg-indigo-100 text-indigo-700' }
        }
        const m = methods[method] || { label: method, class: 'bg-gray-100 text-gray-700' }
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${m.class}`}>
                {m.label}
            </span>
        )
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary)]">Receipt Management</h1>
                    <p className="text-gray-500">View and manage all payment receipts</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="btn btn-outline flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Search and Filters */}
            <div className="card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by receipt ID, student name, or roll..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input pl-10"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn flex items-center gap-2 ${showFilters ? 'btn-primary' : 'btn-outline'}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select
                                value={filters.class}
                                onChange={(e) => setFilters({ ...filters, class: e.target.value })}
                                className="input"
                            >
                                <option value="">All Classes</option>
                                {CLASSES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                            <select
                                value={filters.paymentMethod}
                                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                                className="input"
                            >
                                <option value="">All Methods</option>
                                <option value="cash">Cash</option>
                                <option value="bkash">bKash</option>
                                <option value="nagad">Nagad</option>
                                <option value="bank_transfer">Bank</option>
                                <option value="card">Card</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                className="input"
                            />
                        </div>
                    </div>
                )}
            </div>


            {/* Receipts Table */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-4">
                        <TableSkeleton columns={7} rows={10} />
                    </div>
                ) : data?.payments?.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Receipt #</th>
                                        <th>Student</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.payments.map((payment) => (
                                        <tr key={payment._id}>
                                            <td>
                                                <span className="font-mono text-sm font-medium text-[var(--primary)]">
                                                    {payment.receiptId}
                                                </span>
                                            </td>
                                            <td>
                                                <div>
                                                    <p className="font-medium">{payment.studentId?.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {payment.studentId?.roll} • {payment.studentId?.class}
                                                    </p>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <p className="font-semibold text-green-600">
                                                        ৳{payment.amountPaid?.toLocaleString()}
                                                    </p>
                                                    {payment.dueAmount > 0 && (
                                                        <p className="text-xs text-red-500">
                                                            Due: ৳{payment.dueAmount?.toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{getPaymentMethodBadge(payment.paymentMethod)}</td>
                                            <td>
                                                <p className="text-sm">
                                                    {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(payment.paymentDate), 'hh:mm a')}
                                                </p>
                                            </td>
                                            <td>{getStatusBadge(payment)}</td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <Link
                                                        to={`/admin/receipts/${payment.receiptId}`}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                        title="View Receipt"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-600" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handlePrint(payment.receiptId)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                        title="Print"
                                                    >
                                                        <Printer className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadPDF(payment.receiptId)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                        title="Download PDF"
                                                    >
                                                        <Download className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    {payment.studentId?.email && (
                                                        <button
                                                            onClick={() => handleEmail(payment)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                                            title="Email Receipt"
                                                            disabled={emailMutation.isPending}
                                                        >
                                                            <Mail className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data.pagination && (
                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                <p className="text-sm text-gray-500">
                                    Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                                    {data.pagination.total} receipts
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="btn btn-outline p-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="flex items-center px-3 text-sm">
                                        Page {data.pagination.page} of {data.pagination.pages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                                        disabled={page >= data.pagination.pages}
                                        className="btn btn-outline p-2"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <FileText className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No receipts found</p>
                        <p className="text-sm">Receipts will appear here when payments are recorded</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ReceiptList
