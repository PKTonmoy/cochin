/**
 * Student Notices Page
 * Premium notice board with glassmorphism, animations,
 * unread highlighting, mark-as-read, filters, and expandable notices
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Bell, Check, CheckCheck, Clock, Calendar, FileText, AlertCircle,
    Filter, ChevronDown, ChevronUp, Megaphone, Loader2, X,
    Sparkles, BellRing, ChevronLeft, ChevronRight
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import api from '../../lib/api'

const BROADCAST_READ_KEY = 'read-broadcast-notices'

function getLocalReadIds() {
    try {
        return new Set(JSON.parse(localStorage.getItem(BROADCAST_READ_KEY) || '[]'))
    } catch { return new Set() }
}

function saveLocalReadIds(ids) {
    localStorage.setItem(BROADCAST_READ_KEY, JSON.stringify([...ids]))
}

export default function Notices() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [priorityFilter, setPriorityFilter] = useState('')
    const [unreadOnly, setUnreadOnly] = useState(false)
    const [expandedId, setExpandedId] = useState(null)
    const [showFilters, setShowFilters] = useState(false)
    const [localReadIds, setLocalReadIds] = useState(getLocalReadIds)

    // Fetch student notices
    const { data, isLoading } = useQuery({
        queryKey: ['student-notices', page, priorityFilter, unreadOnly],
        queryFn: async () => {
            const params = new URLSearchParams({ page, limit: 20 })
            if (priorityFilter) params.append('priority', priorityFilter)
            if (unreadOnly) params.append('unreadOnly', 'true')
            const response = await api.get(`/notifications/student-notices?${params}`)
            return response.data.data
        },
        refetchInterval: 60000
    })

    // Mutations
    const markAsReadMutation = useMutation({
        mutationFn: (id) => api.put(`/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-notices'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })

    const markAllAsReadMutation = useMutation({
        mutationFn: () => api.put('/notifications/mark-all-read'),
        onSuccess: () => {
            // Mark all current broadcast/class notices as read locally
            const updated = new Set(localReadIds)
            rawNotices?.forEach(n => {
                if (['all', 'class'].includes(n.recipientType)) {
                    updated.add(n._id)
                }
            })
            setLocalReadIds(updated)
            saveLocalReadIds(updated)
            queryClient.invalidateQueries({ queryKey: ['student-notices'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })



    const rawNotices = data?.notifications || []
    const pagination = data?.pagination || {}

    // Merge backend isRead with local read tracking for broadcast/class notices
    const isSharedNotice = (n) => ['all', 'class'].includes(n.recipientType)
    const notices = rawNotices.map(n => ({
        ...n,
        isRead: isSharedNotice(n) ? localReadIds.has(n._id) : n.isRead
    }))
    const unreadCount = notices.filter(n => !n.isRead).length

    const handleNoticeClick = (notice) => {
        setExpandedId(expandedId === notice._id ? null : notice._id)
        if (!notice.isRead) {
            if (isSharedNotice(notice)) {
                // Track broadcast/class read state locally
                const updated = new Set(localReadIds)
                updated.add(notice._id)
                setLocalReadIds(updated)
                saveLocalReadIds(updated)
            }
            markAsReadMutation.mutate(notice._id)
        }
    }

    const getNoticeIcon = (type) => {
        const iconMap = {
            class_scheduled: { icon: Calendar, gradient: 'from-blue-500 to-cyan-500' },
            class_cancelled: { icon: Calendar, gradient: 'from-red-400 to-rose-500' },
            class_rescheduled: { icon: Calendar, gradient: 'from-amber-400 to-orange-500' },
            class_reminder: { icon: BellRing, gradient: 'from-blue-400 to-blue-600' },
            test_scheduled: { icon: FileText, gradient: 'from-violet-500 to-purple-600' },
            test_cancelled: { icon: FileText, gradient: 'from-red-400 to-rose-500' },
            test_rescheduled: { icon: FileText, gradient: 'from-amber-400 to-orange-500' },
            test_reminder: { icon: BellRing, gradient: 'from-violet-400 to-purple-500' },
            result_published: { icon: CheckCheck, gradient: 'from-emerald-400 to-green-600' },
            payment_received: { icon: Sparkles, gradient: 'from-green-400 to-emerald-600' },
            payment_reminder: { icon: AlertCircle, gradient: 'from-orange-400 to-red-500' },
        }
        const config = iconMap[type] || { icon: Megaphone, gradient: 'from-indigo-500 to-purple-600' }
        const IconComp = config.icon
        return (
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                <IconComp className="w-5 h-5 text-white" />
            </div>
        )
    }

    const getPriorityAccent = (priority) => {
        switch (priority) {
            case 'urgent': return 'border-l-4 border-l-red-500'
            case 'high': return 'border-l-4 border-l-orange-400'
            default: return 'border-l-4 border-l-transparent'
        }
    }

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'urgent':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-600 ring-1 ring-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Urgent
                    </span>
                )
            case 'high':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20">
                        High
                    </span>
                )
            default:
                return null
        }
    }

    const getTypeLabel = (type) => {
        const labels = {
            class_scheduled: 'Class',
            class_cancelled: 'Class Cancelled',
            class_rescheduled: 'Class Updated',
            class_reminder: 'Reminder',
            test_scheduled: 'Test',
            test_cancelled: 'Test Cancelled',
            test_rescheduled: 'Test Updated',
            test_reminder: 'Reminder',
            result_published: 'Results',
            payment_received: 'Payment',
            payment_reminder: 'Payment',
            general: 'Notice'
        }
        return labels[type] || 'Notice'
    }

    return (
        <div className="min-h-[60vh] pb-24 px-3 sm:px-4 pt-4">
            {/* Premium Header */}
            <div className="relative mb-6">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-6 text-white overflow-hidden relative">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
                    <div className="absolute bottom-0 left-20 w-24 h-24 bg-white/5 rounded-full translate-y-8" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                <Bell className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
                                <p className="text-white/70 text-sm mt-0.5">
                                    {unreadCount > 0
                                        ? <span className="text-white/90 font-medium">{unreadCount} new {unreadCount === 1 ? 'notice' : 'notices'}</span>
                                        : 'All caught up!'
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsReadMutation.mutate()}
                                    disabled={markAllAsReadMutation.isPending}
                                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-medium transition-all duration-200"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2.5 rounded-xl transition-all duration-200 ${showFilters
                                    ? 'bg-white/25 border border-white/30'
                                    : 'bg-white/10 hover:bg-white/20 border border-white/10'
                                    }`}
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile mark all button */}
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                            className="sm:hidden mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-medium transition-all duration-200"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            {/* Content area - constrained width */}
            <div className="max-w-3xl mx-auto">

                {/* Filters panel */}
                {showFilters && (
                    <div className="mb-4 flex flex-wrap items-center gap-2 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Filters</span>
                        <select
                            value={priorityFilter}
                            onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Priorities</option>
                            <option value="urgent">🔴 Urgent</option>
                            <option value="high">🟠 High</option>
                            <option value="normal">⚪ Normal</option>
                        </select>
                        <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm cursor-pointer hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={unreadOnly}
                                onChange={e => { setUnreadOnly(e.target.checked); setPage(1) }}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            Unread only
                        </label>
                        {(priorityFilter || unreadOnly) && (
                            <button
                                onClick={() => { setPriorityFilter(''); setUnreadOnly(false); setPage(1) }}
                                className="px-3 py-2 text-sm text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 flex items-center gap-1 transition-all"
                            >
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                        <p className="text-gray-400 font-medium">Loading notices...</p>
                    </div>
                ) : notices.length === 0 ? (
                    /* Beautiful empty state */
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                        <div className="relative mb-6">
                            <div className="w-28 h-28 bg-gradient-to-br from-indigo-50 to-purple-100 rounded-3xl flex items-center justify-center rotate-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-2xl flex items-center justify-center -rotate-12">
                                    <Bell className="w-12 h-12 text-indigo-400" />
                                </div>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No notices yet</h3>
                        <p className="text-gray-400 text-center max-w-xs leading-relaxed">
                            When your coaching center posts notices, schedules classes, or publishes results — they'll appear here.
                        </p>
                        <div className="mt-8 flex items-center gap-6 text-center">
                            {[
                                { icon: Calendar, label: 'Classes', color: 'text-blue-500', bg: 'bg-blue-50' },
                                { icon: FileText, label: 'Tests', color: 'text-purple-500', bg: 'bg-purple-50' },
                                { icon: Megaphone, label: 'Notices', color: 'text-indigo-500', bg: 'bg-indigo-50' },
                            ].map(item => (
                                <div key={item.label} className="flex flex-col items-center gap-2">
                                    <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center`}>
                                        <item.icon className={`w-6 h-6 ${item.color}`} />
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Notices list */
                    <div className="space-y-3">
                        {notices.map((notice, index) => {
                            const isExpanded = expandedId === notice._id
                            return (
                                <div
                                    key={notice._id}
                                    className={`
                                    bg-white rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer
                                    ${getPriorityAccent(notice.priority)}
                                    ${!notice.isRead
                                            ? 'shadow-md shadow-indigo-100 ring-1 ring-indigo-100'
                                            : 'shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200'
                                        }
                                    ${isExpanded ? 'shadow-lg ring-1 ring-indigo-200' : ''}
                                `}
                                    onClick={() => handleNoticeClick(notice)}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Notice header */}
                                    <div className="flex items-start gap-3.5 p-4">
                                        {getNoticeIcon(notice.type)}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`text-[15px] leading-snug ${!notice.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                                                        }`}>
                                                        {notice.title}
                                                    </h3>
                                                    {!isExpanded && (
                                                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                                                            {notice.message}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                    {getPriorityBadge(notice.priority)}
                                                    {!notice.isRead && (
                                                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-lg shadow-indigo-300 animate-pulse" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-500">
                                                    {getTypeLabel(notice.type)}
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="w-5 h-5 text-gray-300" />
                                        </div>
                                    </div>

                                    {/* Expanded content */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4">
                                            <div className="ml-[52px] pt-3 border-t border-gray-100">
                                                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                                    {notice.message}
                                                </p>
                                                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50">
                                                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {format(new Date(notice.createdAt), 'dd MMMM yyyy, hh:mm a')}
                                                    </span>
                                                    {notice.isRead && notice.readAt && (
                                                        <span className="text-xs text-emerald-500 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                            <Check className="w-3 h-3" />
                                                            Read
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Premium Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-6">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 disabled:opacity-30 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                                const pageNum = i + 1
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${page === pageNum
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'text-gray-500 hover:bg-gray-100'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                            disabled={page >= pagination.pages}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 disabled:opacity-30 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
