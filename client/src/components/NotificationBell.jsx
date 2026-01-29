/**
 * Notification Bell Component
 * Real-time notification indicator with dropdown
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck, X, Clock, Calendar, FileText, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '../lib/api'
import { onNotification } from '../lib/socket'

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)
    const queryClient = useQueryClient()

    // Fetch notifications
    const { data, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await api.get('/notifications?limit=10')
            return response.data.data
        },
        refetchInterval: 60000 // Refetch every minute
    })

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: (id) => api.put(`/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: () => api.put('/notifications/mark-all-read'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })

    // Subscribe to real-time notifications
    useEffect(() => {
        const unsubscribe = onNotification((notification) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        })

        return unsubscribe
    }, [queryClient])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const notifications = data?.notifications || []
    const unreadCount = data?.unreadCount || 0

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'class_scheduled':
            case 'class_cancelled':
            case 'class_rescheduled':
            case 'class_reminder':
                return <Calendar className="w-4 h-4 text-blue-500" />
            case 'test_scheduled':
            case 'test_cancelled':
            case 'test_rescheduled':
            case 'test_reminder':
                return <FileText className="w-4 h-4 text-purple-500" />
            case 'result_published':
                return <CheckCheck className="w-4 h-4 text-green-500" />
            case 'payment_received':
            case 'payment_reminder':
                return <AlertCircle className="w-4 h-4 text-orange-500" />
            default:
                return <Bell className="w-4 h-4 text-gray-500" />
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'border-l-4 border-red-500'
            case 'high':
                return 'border-l-4 border-orange-500'
            default:
                return ''
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[70vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsReadMutation.mutate()}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                                disabled={markAllAsReadMutation.isPending}
                            >
                                <CheckCheck className="w-4 h-4" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="p-4 text-center text-gray-500">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        } ${getPriorityColor(notification.priority)}`}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            markAsReadMutation.mutate(notification._id)
                                        }
                                        if (notification.actionUrl) {
                                            window.location.href = notification.actionUrl
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''} text-gray-900 dark:text-white truncate`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
                            <a
                                href="/student/notifications"
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                                View all notifications
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
