import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { useSettings } from '../../contexts/SettingsContext'
import { ArrowLeft, Edit, Phone, Mail, User, Calendar, DollarSign, BookOpen, Download, FileText, CheckCircle, XCircle, ClipboardList, BarChart3, TrendingUp, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateAttendanceReport, generateResultsReport, generateOverallProgressReport } from '../../utils/reportGenerator'

const StudentDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { settings } = useSettings()
    const [generatingReport, setGeneratingReport] = useState(null)

    const { data: studentData, isLoading: studentLoading, error: studentError } = useQuery({
        queryKey: ['student', id],
        queryFn: async () => {
            const response = await api.get(`/students/${id}`)
            return response.data.data
        }
    })

    const { data: paymentData, isLoading: paymentsLoading } = useQuery({
        queryKey: ['student-payments', id],
        queryFn: async () => {
            const response = await api.get(`/payments/student/${id}`)
            return response.data.data
        }
    })

    const { data: attendanceData } = useQuery({
        queryKey: ['student-attendance', id],
        queryFn: async () => {
            const response = await api.get(`/attendance/student/${id}?limit=500`)
            return response.data.data
        }
    })

    const { data: resultsData } = useQuery({
        queryKey: ['student-results', id],
        queryFn: async () => {
            const response = await api.get(`/results/student/${id}`)
            return response.data.data
        }
    })

    const handleDownloadReceipt = async (receiptId) => {
        try {
            const token = localStorage.getItem('token')
            const downloadUrl = `${import.meta.env.VITE_API_URL || '/api'}/receipts/${receiptId}/pdf?token=${token}`
            window.open(downloadUrl, '_blank')
        } catch (error) {
            toast.error('Failed to download receipt')
        }
    }

    const handleGenerateReport = async (type) => {
        const student = studentData?.student
        if (!student) return

        setGeneratingReport(type)
        try {
            switch (type) {
                case 'attendance':
                    await generateAttendanceReport(student, attendanceData, settings)
                    toast.success('Attendance report downloaded!')
                    break
                case 'results':
                    await generateResultsReport(student, resultsData, settings)
                    toast.success('Results report downloaded!')
                    break
                case 'overall':
                    await generateOverallProgressReport(student, attendanceData, resultsData, paymentData, settings)
                    toast.success('Overall progress report downloaded!')
                    break
            }
        } catch (error) {
            console.error('Report generation error:', error)
            toast.error('Failed to generate report')
        } finally {
            setGeneratingReport(null)
        }
    }

    if (studentLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner"></div>
            </div>
        )
    }

    if (studentError) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
                <p>Error loading student details.</p>
                <button onClick={() => navigate(-1)} className="btn btn-outline mt-4">Go Back</button>
            </div>
        )
    }

    const student = studentData?.student
    if (!student) return null

    const payments = paymentData?.payments || []

    return (
        <div className="max-w-6xl mx-auto animate-fadeIn space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--primary)]">Student Profile</h1>
                        <p className="text-gray-500">View detailed information</p>
                    </div>
                </div>
                <Link to={`/admin/students/${id}/edit`} className="btn btn-primary">
                    <Edit size={18} />
                    Edit Student
                </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Info Card - Takes up 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Avatar / Profile Pic Placeholder */}
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full gradient-primary flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-lg ring-4 ring-white">
                                    {student.name?.charAt(0)}
                                </div>
                            </div>

                            {/* Basic Details */}
                            <div className="flex-1 w-full space-y-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{student.name}</h2>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="badge badge-primary">Roll: {student.roll}</span>
                                        <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                            {student.status?.toUpperCase().replace('_', ' ')}
                                        </span>
                                        <span className="badge badge-outline">Class {student.class}</span>
                                        {student.section && <span className="badge badge-outline">Section {student.section}</span>}
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <User size={20} className="text-[var(--primary)]" />
                                            Personal Info
                                        </h3>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Father's Name</p>
                                                <p className="font-medium text-gray-900">{student.fatherName || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Date of Birth</p>
                                                <p className="font-medium text-gray-900">
                                                    {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Guardian Phone</p>
                                                <div className="flex items-center gap-2">
                                                    <a href={`tel:${student.guardianPhone}`} className="hover:underline text-[var(--secondary)] font-medium flex items-center gap-1">
                                                        <Phone size={14} />
                                                        {student.guardianPhone || 'N/A'}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <BookOpen size={20} className="text-[var(--primary)]" />
                                            Contact Info
                                        </h3>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                                                <div className="flex items-center gap-2">
                                                    <a href={`tel:${student.phone}`} className="hover:underline text-[var(--secondary)] font-medium flex items-center gap-1">
                                                        <Phone size={14} />
                                                        {student.phone}
                                                    </a>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                                                <div className="flex items-center gap-2">
                                                    {student.email ? (
                                                        <a href={`mailto:${student.email}`} className="hover:underline text-[var(--secondary)] font-medium flex items-center gap-1">
                                                            <Mail size={14} />
                                                            {student.email}
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="card overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <FileText size={20} className="text-[var(--primary)]" />
                                Payment History
                            </h3>
                            {/* <button className="btn btn-sm btn-outline">View All</button> */}
                        </div>

                        {paymentsLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading payments...</div>
                        ) : payments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt ID</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {payments.map(payment => (
                                            <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-900">
                                                        {new Date(payment.paymentDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(payment.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                        {payment.receiptId}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-gray-900">
                                                    ৳{payment.amountPaid?.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 capitalize text-gray-600">
                                                    {payment.paymentMethod?.replace('_', ' ')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {payment.isVerified ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            Verified
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => handleDownloadReceipt(payment.receiptId)}
                                                        className="btn btn-sm btn-ghost text-[var(--primary)] hover:bg-[var(--primary)]/10"
                                                        title="Download Receipt"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <FileText size={48} className="mx-auto text-gray-200 mb-3" />
                                <p className="text-gray-500">No payment records found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats - Takes up 1 column */}
                <div className="space-y-6">
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-[var(--primary)]" />
                            Financial Overview
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Total Fee</p>
                                <p className="text-2xl font-bold text-gray-900">৳{student.totalFee?.toLocaleString() || 0}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                <p className="text-sm text-green-600 mb-1">Paid Amount</p>
                                <p className="text-2xl font-bold text-green-700">৳{student.paidAmount?.toLocaleString() || 0}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                                <p className="text-sm text-red-600 mb-1">Due Amount</p>
                                <p className="text-2xl font-bold text-red-700">৳{student.dueAmount?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Reports Section */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 size={20} className="text-[var(--primary)]" />
                            Progress Reports
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Download detailed PDF reports</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleGenerateReport('attendance')}
                                disabled={generatingReport === 'attendance'}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100 transition-all duration-200 group disabled:opacity-70"
                            >
                                {generatingReport === 'attendance' ? (
                                    <Loader2 size={20} className="text-blue-600 animate-spin" />
                                ) : (
                                    <ClipboardList size={20} className="text-blue-600" />
                                )}
                                <div className="text-left flex-1">
                                    <p className="text-sm font-semibold text-blue-900">Attendance Report</p>
                                    <p className="text-xs text-blue-600">Class & test attendance details</p>
                                </div>
                                <Download size={16} className="text-blue-400 group-hover:text-blue-600 transition-colors" />
                            </button>

                            <button
                                onClick={() => handleGenerateReport('results')}
                                disabled={generatingReport === 'results'}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100 transition-all duration-200 group disabled:opacity-70"
                            >
                                {generatingReport === 'results' ? (
                                    <Loader2 size={20} className="text-purple-600 animate-spin" />
                                ) : (
                                    <BarChart3 size={20} className="text-purple-600" />
                                )}
                                <div className="text-left flex-1">
                                    <p className="text-sm font-semibold text-purple-900">Results Report</p>
                                    <p className="text-xs text-purple-600">Test scores & subject analysis</p>
                                </div>
                                <Download size={16} className="text-purple-400 group-hover:text-purple-600 transition-colors" />
                            </button>

                            <button
                                onClick={() => handleGenerateReport('overall')}
                                disabled={generatingReport === 'overall'}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 transition-all duration-200 group disabled:opacity-70"
                            >
                                {generatingReport === 'overall' ? (
                                    <Loader2 size={20} className="text-emerald-600 animate-spin" />
                                ) : (
                                    <TrendingUp size={20} className="text-emerald-600" />
                                )}
                                <div className="text-left flex-1">
                                    <p className="text-sm font-semibold text-emerald-900">Overall Progress</p>
                                    <p className="text-xs text-emerald-600">Complete student assessment</p>
                                </div>
                                <Download size={16} className="text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentDetails
