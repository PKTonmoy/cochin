/**
 * ReceiptView Page
 * View, print, and download payment receipts
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import React, { useState, useEffect, useRef } from 'react'
import {
    Printer,
    Download,
    Mail,
    ArrowLeft,
    FileText,
    Copy,
    ExternalLink,
    CheckCircle
} from 'lucide-react'

const ReceiptView = () => {
    const { receiptId } = useParams()
    const navigate = useNavigate()
    const [scale, setScale] = useState(1)
    const containerRef = useRef(null)
    const iframeRef = useRef(null)

    // Fetch receipt HTML
    const { data: receiptHtml, isLoading } = useQuery({
        queryKey: ['receipt', receiptId],
        queryFn: async () => {
            const response = await api.get(`/receipts/${receiptId}`, {
                responseType: 'text'
            })
            return response.data
        }
    })

    // Email mutation
    const emailMutation = useMutation({
        mutationFn: async () => {
            return api.post(`/receipts/${receiptId}/email`)
        },
        onSuccess: () => {
            toast.success('Receipt emailed successfully!')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send email')
        }
    })

    // Handle responsive scaling
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const parentWidth = containerRef.current.offsetWidth
                // 210mm is approx 794px at 96dpi, adding some padding buffer
                const receiptWidth = 820
                if (parentWidth < receiptWidth) {
                    setScale((parentWidth - 32) / receiptWidth) // 32px for padding
                } else {
                    setScale(1)
                }
            }
        }

        window.addEventListener('resize', handleResize)
        handleResize() // Initial check

        return () => window.removeEventListener('resize', handleResize)
    }, [receiptHtml])

    // Write content to iframe
    useEffect(() => {
        if (iframeRef.current && receiptHtml) {
            const doc = iframeRef.current.contentDocument
            if (doc) {
                doc.open()
                doc.write(receiptHtml)
                doc.close()
                // Inject style to ensure it fits nicely in iframe
                const style = doc.createElement('style')
                style.textContent = `
                    body { margin: 0; padding: 0; overflow: hidden; }
                    .receipt { margin: 0 auto; border: none; }
                `
                doc.head.appendChild(style)
            }
        }
    }, [receiptHtml])

    const handlePrint = () => {
        if (iframeRef.current) {
            iframeRef.current.contentWindow.print()
        }
    }

    const handleDownload = async () => {
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

            // Append to body, click and remove
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
                    const htmlResponse = await api.get(`/receipts/${receiptId}`, { responseType: 'text' })
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

    const handleEmail = () => {
        emailMutation.mutate()
    }

    const copyReceiptId = () => {
        navigator.clipboard.writeText(receiptId)
        toast.success('Receipt ID copied!')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fadeIn p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--primary)]">Receipt Preview</h1>
                        <div className="flex items-center gap-2 text-gray-500">
                            <FileText className="w-4 h-4" />
                            <span className="font-mono text-sm">{receiptId}</span>
                            <button
                                onClick={copyReceiptId}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Copy Receipt ID"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleEmail}
                        disabled={emailMutation.isPending}
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <Mail size={18} />
                        {emailMutation.isPending ? 'Sending...' : 'Email'}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <Download size={18} />
                        Download PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Printer size={18} />
                        Print
                    </button>
                </div>
            </div>

            {/* Receipt Preview Card */}
            <div className="card overflow-hidden bg-gray-100/50 flex justify-center p-4 sm:p-8 min-h-[500px]">
                <div
                    ref={containerRef}
                    className="w-full flex justify-center overflow-hidden"
                >
                    <div
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: 'top center',
                            width: '210mm',
                            height: '297mm',
                            minWidth: '210mm',
                            backgroundColor: 'white',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                    >
                        <iframe
                            ref={iframeRef}
                            title="Receipt Preview"
                            className="w-full h-full border-none"
                            style={{ pointerEvents: 'auto' }}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Info Footer */}
            <div className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Receipt generated successfully</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/receipts')}
                            className="text-[var(--primary)] hover:underline flex items-center gap-1"
                        >
                            View All Receipts
                            <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReceiptView
