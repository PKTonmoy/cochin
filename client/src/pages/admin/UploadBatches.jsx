import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { RotateCcw, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const UploadBatches = () => {
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['upload-batches'],
        queryFn: async () => {
            const response = await api.get('/uploads/batches')
            return response.data.data
        }
    })

    const rollbackMutation = useMutation({
        mutationFn: async (batchId) => {
            const response = await api.post('/uploads/results/rollback', { batchId })
            return response.data
        },
        onSuccess: (data) => {
            toast.success(data.message)
            queryClient.invalidateQueries(['upload-batches'])
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Rollback failed')
        }
    })

    const handleRollback = (batchId) => {
        if (window.confirm('Are you sure you want to rollback this import? All results from this batch will be deleted.')) {
            rollbackMutation.mutate(batchId)
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            imported: { class: 'badge-success', icon: CheckCircle },
            partially_imported: { class: 'badge-warning', icon: AlertTriangle },
            failed: { class: 'badge-danger', icon: XCircle },
            reverted: { class: 'badge-info', icon: RotateCcw }
        }
        return badges[status] || { class: 'badge-info', icon: FileSpreadsheet }
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-[var(--primary)]">Upload History</h1>
                <p className="text-gray-500">View and manage result import batches</p>
            </div>

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
                                    <th>File</th>
                                    <th>Uploaded By</th>
                                    <th>Date</th>
                                    <th>Results</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.batches?.map((batch) => {
                                    const statusInfo = getStatusBadge(batch.status)
                                    const StatusIcon = statusInfo.icon
                                    return (
                                        <tr key={batch._id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <FileSpreadsheet className="text-green-600" size={20} />
                                                    <span className="font-medium">{batch.originalFilename}</span>
                                                </div>
                                            </td>
                                            <td>{batch.uploaderId?.name}</td>
                                            <td>{new Date(batch.createdAt).toLocaleString()}</td>
                                            <td>
                                                <span className="text-green-600">{batch.insertedCount} new</span>
                                                {batch.updatedCount > 0 && (
                                                    <span className="text-blue-600 ml-2">{batch.updatedCount} updated</span>
                                                )}
                                                {batch.failedRowsCount > 0 && (
                                                    <span className="text-red-600 ml-2">{batch.failedRowsCount} failed</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${statusInfo.class} flex items-center gap-1 w-fit`}>
                                                    <StatusIcon size={14} />
                                                    {batch.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                {batch.status === 'imported' && (
                                                    <button
                                                        onClick={() => handleRollback(batch._id)}
                                                        disabled={rollbackMutation.isPending}
                                                        className="btn btn-danger btn-sm py-1 px-3"
                                                    >
                                                        <RotateCcw size={14} />
                                                        Rollback
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {data?.batches?.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">
                                            No upload history found
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

export default UploadBatches
