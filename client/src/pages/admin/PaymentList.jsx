import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import {
    CheckCircle,
    XCircle,
    Receipt,
    Search,
    Filter,
    Eye
} from 'lucide-react'

const PaymentList = () => {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all') // pending, verified, all
    const [verifyingId, setVerifyingId] = useState(null)

    const { data, isLoading } = useQuery({
        queryKey: ['payments', filter],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filter !== 'all') {
                params.append('isVerified', filter === 'verified')
            }
            const response = await api.get(`/payments?${params}`)
            return response.data.data
        }
    })

    const verifyMutation = useMutation({
        mutationFn: async (paymentId) => {
            const response = await api.post('/payments/verify', { paymentId })
            return response.data
        },
        onSuccess: (data) => {
            toast.success('Payment verified! Student account activated.')
            if (data.data?.receiptUrl) {
                toast.success('Receipt generated successfully!')
            }
            queryClient.invalidateQueries(['payments'])
            setVerifyingId(null)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Verification failed')
            setVerifyingId(null)
        }
    })

    const handleVerify = (paymentId) => {
        if (window.confirm('Are you sure you want to verify this payment? This will activate the student account.')) {
            setVerifyingId(paymentId)
            verifyMutation.mutate(paymentId)
        }
    }

    const filteredPayments = data?.payments?.filter(p => {
        if (!search) return true
        const student = p.studentId
        return (
            student?.name?.toLowerCase().includes(search.toLowerCase()) ||
            student?.roll?.toLowerCase().includes(search.toLowerCase())
        )
    })

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--primary)]">Payments</h1>
                <p className="text-gray-500">Manage and verify student payments</p>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            className="input pl-10"
                            placeholder="Search by student name or roll..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {['pending', 'verified', 'all'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                            >
                                {f === 'pending' ? 'Pending' : f === 'verified' ? 'Verified' : 'All'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payments list */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments?.map((payment) => (
                                    <tr key={payment._id}>
                                        <td>
                                            <div>
                                                <p className="font-medium">{payment.studentId?.name}</p>
                                                <p className="text-sm text-gray-500">{payment.studentId?.roll}</p>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <p className="font-medium text-green-600">৳{payment.amountPaid?.toLocaleString()}</p>
                                                {payment.dueAmount > 0 && (
                                                    <p className="text-xs text-red-500">Due: ৳{payment.dueAmount?.toLocaleString()}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="capitalize">{payment.paymentMethod}</span>
                                        </td>
                                        <td>
                                            {new Date(payment.paymentDate).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {payment.isVerified ? (
                                                <span className="badge badge-success flex items-center gap-1 w-fit">
                                                    <CheckCircle size={14} />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="badge badge-warning flex items-center gap-1 w-fit">
                                                    <XCircle size={14} />
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {!payment.isVerified && (
                                                    <button
                                                        onClick={() => handleVerify(payment._id)}
                                                        disabled={verifyingId === payment._id}
                                                        className="btn btn-primary btn-sm py-1 px-3"
                                                    >
                                                        {verifyingId === payment._id ? (
                                                            <span className="spinner w-4 h-4 border-2"></span>
                                                        ) : (
                                                            <>
                                                                <CheckCircle size={14} />
                                                                Verify
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                {payment.receiptGenerated && (
                                                    <Link
                                                        to={`/admin/receipts/${payment.receiptId}`}
                                                        className="btn btn-outline btn-sm py-1 px-3"
                                                    >
                                                        <Receipt size={14} />
                                                        Receipt
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPayments?.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">
                                            No payments found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PaymentList
