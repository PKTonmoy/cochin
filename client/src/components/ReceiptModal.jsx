/**
 * ReceiptModal Component
 * Shows after student enrollment with receipt preview and actions
 */

import { useState, useRef, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
    X,
    Printer,
    Download,
    Mail,
    Eye,
    CheckCircle2,
    FileText,
    Copy,
    ExternalLink,
    Sparkles
} from 'lucide-react'
import api from '../lib/api'

export default function ReceiptModal({
    isOpen,
    onClose,
    paymentData,
    studentData,
    showCredentials = false
}) {
    const [activeTab, setActiveTab] = useState('summary')
    const [emailSending, setEmailSending] = useState(false)
    const [pendingPrint, setPendingPrint] = useState(false)
    const printRef = useRef()

    // Fetch receipt HTML for preview
    const { data: receiptHtml, isLoading: loadingReceipt } = useQuery({
        queryKey: ['receipt-preview', paymentData?.receiptId],
        queryFn: async () => {
            const response = await api.get(`/receipts/${paymentData.receiptId}`, {
                responseType: 'text'
            })
            return response.data
        },
        enabled: isOpen && !!paymentData?.receiptId && activeTab === 'preview'
    })

    // Print handler
    const reactToPrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Receipt-${paymentData?.receiptId}`,
        onAfterPrint: () => toast.success('Receipt printed successfully!')
    })

    // Effect: trigger print after switching to preview tab
    useEffect(() => {
        if (pendingPrint && activeTab === 'preview' && receiptHtml && printRef.current) {
            setPendingPrint(false)
            // Small delay to ensure DOM has rendered
            setTimeout(() => reactToPrint(), 300)
        }
    }, [pendingPrint, activeTab, receiptHtml, reactToPrint])

    const handlePrint = () => {
        if (activeTab !== 'preview') {
            // Switch to preview tab first, then print after content loads
            setActiveTab('preview')
            setPendingPrint(true)
        } else if (printRef.current) {
            reactToPrint()
        }
    }

    // Download PDF
    const handleDownload = async () => {
        const toastId = toast.loading('Downloading PDF...')
        try {
            const response = await api.get(`/receipts/${paymentData.receiptId}/pdf`, {
                responseType: 'blob'
            })

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `receipt-${paymentData.receiptId}.pdf`)

            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success('Download complete', { id: toastId })
        } catch (error) {
            console.error('Download error:', error)
            // Fallback: open receipt HTML in new window for browser print-to-PDF
            toast.dismiss(toastId)

            let htmlContent = receiptHtml
            if (!htmlContent) {
                try {
                    const htmlResponse = await api.get(`/receipts/${paymentData.receiptId}`, { responseType: 'text' })
                    htmlContent = htmlResponse.data
                } catch (e) {
                    console.error('Fallback HTML fetch failed:', e)
                }
            }

            if (htmlContent) {
                toast('Opening print dialog — use "Save as PDF" to download', { icon: '🖨️', duration: 5000 })
                const printWindow = window.open('', '_blank')
                if (printWindow) {
                    printWindow.document.write(htmlContent)
                    printWindow.document.close()
                    // Add print style
                    const style = printWindow.document.createElement('style')
                    style.textContent = `
                        body { margin: 0; padding: 0; }
                        @page { size: A4; margin: 0; }
                    `
                    printWindow.document.head.appendChild(style)
                    printWindow.onload = () => printWindow.print()
                }
            } else {
                toast.error('Failed to download PDF', { id: toastId })
            }
        }
    }

    // Email receipt
    const handleEmail = async () => {
        if (!studentData?.email) {
            toast.error('Student does not have an email address')
            return
        }

        setEmailSending(true)
        try {
            await api.post(`/receipts/${paymentData.receiptId}/email`)
            toast.success(`Receipt sent to ${studentData.email}`)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send email')
        } finally {
            setEmailSending(false)
        }
    }

    // Copy credentials
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard!')
    }

    if (!isOpen) return null

    const dueAmount = (paymentData?.totalFee || 0) - (paymentData?.amountPaid || 0)
    const isPaidInFull = dueAmount <= 0

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Enrollment Successful! 🎉</h2>
                                <p className="text-emerald-100 text-sm">
                                    Receipt #{paymentData?.receiptId}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'summary'
                            ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <FileText className="w-4 h-4 inline mr-2" />
                        Summary
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'preview'
                            ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Eye className="w-4 h-4 inline mr-2" />
                        Preview Receipt
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {activeTab === 'summary' ? (
                        <div className="space-y-6">
                            {/* Student Info Card */}
                            <div className="bg-gray-50 rounded-xl p-5">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-sm">
                                            {studentData?.name?.charAt(0)}
                                        </span>
                                    </div>
                                    Student Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Name</span>
                                        <p className="font-medium">{studentData?.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Roll Number</span>
                                        <p className="font-medium font-mono">{studentData?.roll}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Class</span>
                                        <p className="font-medium">{studentData?.class} {studentData?.section && `- ${studentData.section}`}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Phone</span>
                                        <p className="font-medium">{studentData?.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="bg-gray-50 rounded-xl p-5">
                                <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Fee</span>
                                        <span className="font-medium">৳{paymentData?.totalFee?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Amount Paid</span>
                                        <span className="font-medium text-emerald-600">
                                            ৳{paymentData?.amountPaid?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between">
                                        <span className="font-semibold">Balance Due</span>
                                        <span className={`font-bold text-lg ${isPaidInFull ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {isPaidInFull ? 'PAID' : `৳${dueAmount.toLocaleString()}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Payment Method</span>
                                        <p className="font-medium capitalize">{paymentData?.paymentMethod || 'Cash'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Payment Date</span>
                                        <p className="font-medium">
                                            {paymentData?.paymentDate
                                                ? format(new Date(paymentData.paymentDate), 'dd MMM yyyy')
                                                : format(new Date(), 'dd MMM yyyy')
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Login Credentials (for new students) */}
                            {showCredentials && (
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
                                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                        Student Portal Login Credentials
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                                            <span className="text-xs text-gray-500 block mb-1">Username (Roll)</span>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-bold text-lg">{studentData?.roll}</span>
                                                <button
                                                    onClick={() => copyToClipboard(studentData?.roll)}
                                                    className="p-1 hover:bg-purple-100 rounded"
                                                >
                                                    <Copy className="w-4 h-4 text-purple-600" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                                            <span className="text-xs text-gray-500 block mb-1">Password</span>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-bold text-lg">{studentData?.phone}</span>
                                                <button
                                                    onClick={() => copyToClipboard(studentData?.phone)}
                                                    className="p-1 hover:bg-purple-100 rounded"
                                                >
                                                    <Copy className="w-4 h-4 text-purple-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-purple-700 mt-3">
                                        💡 Please share these credentials with the student for portal access.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Receipt Preview */
                        <div className="bg-gray-100 rounded-xl p-4">
                            {loadingReceipt ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="spinner"></div>
                                </div>
                            ) : (
                                <div
                                    ref={printRef}
                                    className="bg-white shadow-lg mx-auto"
                                    style={{ width: '210mm', minHeight: '200mm', transform: 'scale(0.6)', transformOrigin: 'top center' }}
                                    dangerouslySetInnerHTML={{ __html: receiptHtml }}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                <div className="border-t bg-gray-50 px-6 py-4">
                    <div className="flex flex-wrap gap-3 justify-between items-center">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Close
                        </button>

                        <div className="flex gap-2">
                            {studentData?.email && (
                                <button
                                    onClick={handleEmail}
                                    disabled={emailSending}
                                    className="btn flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Mail className="w-4 h-4" />
                                    {emailSending ? 'Sending...' : 'Email'}
                                </button>
                            )}
                            <button
                                onClick={handleDownload}
                                className="btn flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <Download className="w-4 h-4" />
                                Download PDF
                            </button>
                            <button
                                onClick={handlePrint}
                                className="btn flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Printer className="w-4 h-4" />
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
