/**
 * Schedule Calendar Page
 * Full calendar view with drag-and-drop rescheduling
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ScheduleCalendar from '../../components/ScheduleCalendar'
import api from '../../lib/api'
import { CLASSES } from '../../data/classData'

export default function ScheduleCalendarPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [filters, setFilters] = useState({
        class: '',
        section: ''
    })
    const [showFilters, setShowFilters] = useState(false)
    const [rescheduleConfirm, setRescheduleConfirm] = useState(null)

    // Reschedule mutation
    const rescheduleMutation = useMutation({
        mutationFn: ({ id, date, startTime, endTime }) =>
            api.post(`/classes/${id}/reschedule`, { date, startTime, endTime }),
        onSuccess: () => {
            toast.success('Class rescheduled successfully')
            queryClient.invalidateQueries({ queryKey: ['calendar-classes'] })
            setRescheduleConfirm(null)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to reschedule')
            queryClient.invalidateQueries({ queryKey: ['calendar-classes'] })
        }
    })

    const handleEventDrop = (dropInfo) => {
        // Calculate new times based on drop
        const newStart = dropInfo.newStart
        const duration = dropInfo.newEnd ? (dropInfo.newEnd - dropInfo.newStart) / (1000 * 60) : 60

        const startTime = `${String(newStart.getHours()).padStart(2, '0')}:${String(newStart.getMinutes()).padStart(2, '0')}`
        const endDate = new Date(newStart.getTime() + duration * 60 * 1000)
        const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

        setRescheduleConfirm({
            id: dropInfo.id,
            oldStart: dropInfo.oldStart,
            newStart: newStart,
            date: newStart.toISOString().split('T')[0],
            startTime,
            endTime
        })
    }

    return (
        <div className="space-y-6 h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/classes')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule Calendar</h1>
                        <p className="text-gray-500 dark:text-gray-400">View and reschedule classes</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                >
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={filters.class}
                            onChange={(e) => setFilters(f => ({ ...f, class: e.target.value }))}
                            className="input"
                        >
                            <option value="">All Classes</option>
                            {CLASSES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Section"
                            value={filters.section}
                            onChange={(e) => setFilters(f => ({ ...f, section: e.target.value }))}
                            className="input"
                        />
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Scheduled Class</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Ongoing</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Test</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <ScheduleCalendar
                    classFilter={filters.class}
                    section={filters.section}
                    editable={true}
                    onEventDrop={handleEventDrop}
                    height="calc(100vh - 350px)"
                />
            </div>

            {/* Reschedule Confirmation Modal */}
            {rescheduleConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Confirm Reschedule</h3>
                        <div className="space-y-2 text-sm mb-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">From:</span>{' '}
                                {rescheduleConfirm.oldStart.toLocaleString()}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">To:</span>{' '}
                                {rescheduleConfirm.newStart.toLocaleString()}
                            </p>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Students will be notified of this change.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setRescheduleConfirm(null)
                                    queryClient.invalidateQueries({ queryKey: ['calendar-classes'] })
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => rescheduleMutation.mutate(rescheduleConfirm)}
                                disabled={rescheduleMutation.isPending}
                                className="btn-primary"
                            >
                                {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
