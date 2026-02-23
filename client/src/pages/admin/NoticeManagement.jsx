/**
 * Admin Notice Management Page
 * Send multi-channel notices (Push + SMS + Portal) with targeting and scheduling
 * View sent notices history with delivery status
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Bell, Send, Clock, Users, Search, Filter, ChevronDown, ChevronUp,
    CheckCircle2, XCircle, AlertCircle, Calendar, Megaphone,
    Smartphone, MessageSquare, Monitor, Loader2, RefreshCw, Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function NoticeManagement() {
    const [activeTab, setActiveTab] = useState('compose') // 'compose' | 'history'
    const queryClient = useQueryClient()

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Megaphone className="w-7 h-7 text-indigo-600" />
                        Notice Management
                    </h1>
                    <p className="text-gray-500 mt-1">Send notices via Push, SMS, and Portal</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('compose')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'compose'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Send className="w-4 h-4 inline mr-2" />
                    Send Notice
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Clock className="w-4 h-4 inline mr-2" />
                    Sent History
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'compose' ? <ComposeNotice /> : <NoticeHistory />}
        </div>
    )
}

// ─── Compose Notice Tab ──────────────────────────────────────────

function ComposeNotice() {
    const queryClient = useQueryClient()
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [priority, setPriority] = useState('normal')
    const [targetType, setTargetType] = useState('all')
    const [targetClass, setTargetClass] = useState('')
    const [targetSection, setTargetSection] = useState('')
    const [selectedStudents, setSelectedStudents] = useState([])
    const [studentSearch, setStudentSearch] = useState('')
    const [channels, setChannels] = useState({ portal: true, push: true, sms: false })
    const [isScheduled, setIsScheduled] = useState(false)
    const [scheduledAt, setScheduledAt] = useState('')
    const [showStudentDropdown, setShowStudentDropdown] = useState(false)

    // Fetch classes for the dropdown
    const { data: classesData } = useQuery({
        queryKey: ['classes-list'],
        queryFn: async () => {
            const res = await api.get('/students/classes-list')
            return res.data.data
        },
        staleTime: 30000
    })

    // Fetch sections for the dropdown
    const { data: sectionsData } = useQuery({
        queryKey: ['sections-list'],
        queryFn: async () => {
            const res = await api.get('/students?limit=500&fields=section')
            const students = res.data?.data?.students || res.data?.data || []
            return [...new Set(students.map(s => s.section).filter(Boolean))].sort()
        },
        staleTime: 30000
    })

    // Search students
    const { data: searchResults } = useQuery({
        queryKey: ['student-search', studentSearch],
        queryFn: async () => {
            if (!studentSearch || studentSearch.length < 2) return []
            const response = await api.get(`/students?search=${studentSearch}&limit=10`)
            return response.data?.data?.students || response.data?.data || []
        },
        enabled: studentSearch.length >= 2
    })

    // Send notice mutation
    const sendNoticeMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/notifications/send-notice', data)
            return response.data
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Notice sent successfully!')
            queryClient.invalidateQueries({ queryKey: ['notice-history'] })
            // Reset form
            setTitle('')
            setMessage('')
            setPriority('normal')
            setTargetType('all')
            setTargetClass('')
            setTargetSection('')
            setSelectedStudents([])
            setChannels({ portal: true, push: true, sms: false })
            setIsScheduled(false)
            setScheduledAt('')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to send notice')
        }
    })

    const handleSend = () => {
        if (!title.trim() || !message.trim()) {
            toast.error('Title and message are required')
            return
        }
        if (targetType === 'class' && !targetClass) {
            toast.error('Please select a class')
            return
        }
        if (targetType === 'students' && selectedStudents.length === 0) {
            toast.error('Please select at least one student')
            return
        }

        const payload = {
            title: title.trim(),
            message: message.trim(),
            priority,
            targetType,
            channels,
            type: 'general'
        }

        if (targetType === 'class') {
            payload.targetClass = targetClass
            payload.targetSection = targetSection || undefined
        }

        if (targetType === 'students') {
            payload.studentIds = selectedStudents.map(s => s._id)
        }

        if (isScheduled && scheduledAt) {
            payload.scheduledAt = scheduledAt
        }

        sendNoticeMutation.mutate(payload)
    }

    const addStudent = (student) => {
        if (!selectedStudents.find(s => s._id === student._id)) {
            setSelectedStudents(prev => [...prev, student])
        }
        setStudentSearch('')
        setShowStudentDropdown(false)
    }

    const removeStudent = (studentId) => {
        setSelectedStudents(prev => prev.filter(s => s._id !== studentId))
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notice Title *</label>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter notice title..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    maxLength={200}
                />
            </div>

            {/* Message */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Write your notice message..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-y"
                    maxLength={2000}
                />
                <p className="text-xs text-gray-400 mt-1">{message.length}/2000 characters</p>
            </div>

            {/* Priority */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="flex gap-3">
                    {[
                        { value: 'normal', label: 'Normal', color: 'bg-gray-100 text-gray-700 border-gray-200' },
                        { value: 'high', label: 'High', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                        { value: 'urgent', label: 'Urgent', color: 'bg-red-50 text-red-700 border-red-200' }
                    ].map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPriority(p.value)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${priority === p.value
                                ? p.color + ' ring-2 ring-offset-1 ring-indigo-400'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Target Audience */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <div className="flex gap-3 mb-4">
                    {[
                        { value: 'all', label: 'All Students', icon: Users },
                        { value: 'class', label: 'Specific Class', icon: Calendar },
                        { value: 'students', label: 'Specific Students', icon: Search }
                    ].map(t => (
                        <button
                            key={t.value}
                            onClick={() => setTargetType(t.value)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${targetType === t.value
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-offset-1 ring-indigo-400'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Class selector */}
                {targetType === 'class' && (
                    <div className="flex gap-3 pl-4 border-l-4 border-indigo-200">
                        <select
                            value={targetClass}
                            onChange={e => setTargetClass(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select Class</option>
                            {classesData?.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <select
                            value={targetSection}
                            onChange={e => setTargetSection(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Sections</option>
                            {sectionsData?.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Student selector */}
                {targetType === 'students' && (
                    <div className="pl-4 border-l-4 border-indigo-200 space-y-3">
                        {/* Search input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={studentSearch}
                                onChange={e => {
                                    setStudentSearch(e.target.value)
                                    setShowStudentDropdown(true)
                                }}
                                onFocus={() => setShowStudentDropdown(true)}
                                placeholder="Search by name, roll, or phone..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                            />
                            {/* Search results dropdown */}
                            {showStudentDropdown && searchResults?.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                    {searchResults.map(student => (
                                        <button
                                            key={student._id}
                                            onClick={() => addStudent(student)}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-indigo-50 flex items-center justify-between"
                                        >
                                            <span>
                                                <strong>{student.name}</strong>
                                                <span className="text-gray-400 ml-2">Roll: {student.roll} | {student.class}</span>
                                            </span>
                                            {selectedStudents.find(s => s._id === student._id) && (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected students */}
                        {selectedStudents.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedStudents.map(student => (
                                    <span
                                        key={student._id}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                                    >
                                        {student.name} ({student.roll})
                                        <button
                                            onClick={() => removeStudent(student._id)}
                                            className="ml-1 text-indigo-400 hover:text-red-600"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delivery Channels */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Channels</label>
                <div className="flex flex-wrap gap-4">
                    {[
                        { key: 'portal', label: 'In-Portal Notice', icon: Monitor, description: 'Shows in student dashboard' },
                        { key: 'push', label: 'PWA Push Notification', icon: Smartphone, description: 'Device push notification' },
                        { key: 'sms', label: 'SMS', icon: MessageSquare, description: 'Via Bulk SMS to guardian' }
                    ].map(ch => (
                        <label
                            key={ch.key}
                            className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 min-w-[200px] ${channels[ch.key]
                                ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={channels[ch.key]}
                                onChange={e => setChannels(prev => ({ ...prev, [ch.key]: e.target.checked }))}
                                className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <ch.icon className="w-4 h-4 text-indigo-500" />
                                    <span className="text-sm font-medium text-gray-900">{ch.label}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{ch.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Schedule */}
            <div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={e => setIsScheduled(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Schedule for later</span>
                </label>
                {isScheduled && (
                    <div className="mt-3 pl-8">
                        <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={e => setScheduledAt(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                )}
            </div>

            {/* Send Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                    {targetType === 'all' && 'Sending to all students'}
                    {targetType === 'class' && targetClass && `Sending to Class ${targetClass}${targetSection ? ` Section ${targetSection}` : ''}`}
                    {targetType === 'students' && `Sending to ${selectedStudents.length} student(s)`}
                </p>
                <button
                    onClick={handleSend}
                    disabled={sendNoticeMutation.isPending || !title.trim() || !message.trim()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    {sendNoticeMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isScheduled ? (
                        <Clock className="w-5 h-5" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                    {isScheduled ? 'Schedule Notice' : 'Send Notice'}
                </button>
            </div>
        </div>
    )
}

// ─── Notice History Tab ──────────────────────────────────────────

function NoticeHistory() {
    const [page, setPage] = useState(1)
    const [typeFilter, setTypeFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [expandedId, setExpandedId] = useState(null)

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['notice-history', page, typeFilter, priorityFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ page, limit: 20 })
            if (typeFilter) params.append('type', typeFilter)
            if (priorityFilter) params.append('priority', priorityFilter)
            const response = await api.get(`/notifications/all?${params}`)
            return response.data.data
        }
    })

    const notifications = data?.notifications || []
    const pagination = data?.pagination || {}

    const getPriorityBadge = (priority) => {
        const styles = {
            urgent: 'bg-red-100 text-red-700',
            high: 'bg-orange-100 text-orange-700',
            normal: 'bg-gray-100 text-gray-600',
            low: 'bg-blue-100 text-blue-600'
        }
        return styles[priority] || styles.normal
    }

    const getTargetLabel = (notification) => {
        if (notification.recipientType === 'all') return 'All Students'
        if (notification.recipientType === 'class') {
            return `Class ${notification.recipientClass || ''}${notification.recipientSection ? ` (${notification.recipientSection})` : ''}`
        }
        if (notification.recipientType === 'student') return 'Specific Student'
        return notification.recipientType
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <select
                    value={priorityFilter}
                    onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                </select>
                <select
                    value={typeFilter}
                    onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="">All Types</option>
                    <option value="general">General Notice</option>
                    <option value="class_scheduled">Class Scheduled</option>
                    <option value="test_scheduled">Test Scheduled</option>
                    <option value="result_published">Result Published</option>
                </select>
                <button
                    onClick={() => refetch()}
                    className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400 ml-auto">
                    {pagination.total || 0} total notices
                </span>
            </div>

            {/* Notices Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading notices...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium">No notices yet</p>
                        <p className="text-sm">Start by sending your first notice</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map(notification => (
                            <div key={notification._id} className="hover:bg-gray-50 transition-colors">
                                <div
                                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                                    onClick={() => setExpandedId(expandedId === notification._id ? null : notification._id)}
                                >
                                    {/* Priority indicator */}
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${notification.priority === 'urgent' ? 'bg-red-500' :
                                        notification.priority === 'high' ? 'bg-orange-500' :
                                            'bg-gray-300'
                                        }`} />

                                    {/* Title & details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {notification.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(notification.priority)}`}>
                                                {notification.priority}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {getTargetLabel(notification)}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status badges */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {notification.isScheduled && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
                                                <Clock className="w-3 h-3" /> Scheduled
                                            </span>
                                        )}
                                    </div>

                                    {/* Expand icon */}
                                    {expandedId === notification._id
                                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                                    }
                                </div>

                                {/* Expanded details */}
                                {expandedId === notification._id && (
                                    <div className="px-5 pb-4 pt-0 border-t border-gray-100 bg-gray-50/50">
                                        <div className="pl-6 space-y-2">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{notification.message}</p>
                                            {notification.createdBy && (
                                                <p className="text-xs text-gray-400">
                                                    Sent by: {notification.createdBy?.name || 'System'}
                                                </p>
                                            )}
                                            {notification.metadata?.channels && (
                                                <div className="flex gap-2 mt-2">
                                                    {notification.metadata.channels.portal && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                                                            <Monitor className="w-3 h-3" /> Portal
                                                        </span>
                                                    )}
                                                    {notification.metadata.channels.push && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">
                                                            <Smartphone className="w-3 h-3" /> Push
                                                        </span>
                                                    )}
                                                    {notification.metadata.channels.sms && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">
                                                            <MessageSquare className="w-3 h-3" /> SMS
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {page} of {pagination.pages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        disabled={page >= pagination.pages}
                        className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
