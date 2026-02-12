/**
 * Student Schedule Page
 * Premium mobile-first calendar view with responsive design
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import {
    Calendar as CalendarIcon,
    List,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    Video,
    BookOpen,
    FileText,
    ExternalLink,
    GraduationCap
} from 'lucide-react'
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday, isSameDay, parseISO } from 'date-fns'
import api from '../../lib/api'
import ScheduleCalendar from '../../components/ScheduleCalendar'
import ScheduleSkeleton from '../../components/skeletons/ScheduleSkeleton'

export default function Schedule() {
    const { user } = useAuth()
    const [viewMode, setViewMode] = useState('agenda') // 'agenda' or 'calendar'
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [showWeekView, setShowWeekView] = useState(false)

    // Get week dates for the week selector
    const getWeekDates = (date) => {
        const start = startOfWeek(date, { weekStartsOn: 0 }) // Sunday
        return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }

    const weekDates = getWeekDates(selectedDate)

    // Navigate weeks
    const goToPreviousWeek = () => setSelectedDate(d => subDays(d, 7))
    const goToNextWeek = () => setSelectedDate(d => addDays(d, 7))
    const goToToday = () => setSelectedDate(new Date())

    // Fetch classes for the selected date range
    const { data: classEvents, isLoading: classesLoading } = useQuery({
        queryKey: ['schedule-classes', selectedDate, user?.class],
        queryFn: async () => {
            const startDate = startOfWeek(selectedDate, { weekStartsOn: 0 })
            const endDate = endOfWeek(selectedDate, { weekStartsOn: 0 })

            const params = new URLSearchParams({
                start: startDate.toISOString(),
                end: endDate.toISOString()
            })
            if (user?.class) params.append('class', user.class)

            const response = await api.get(`/classes/calendar?${params}`)
            return response.data.data || []
        },
        enabled: !!user?.class
    })

    // Fetch tests
    const { data: testEvents, isLoading: testsLoading } = useQuery({
        queryKey: ['schedule-tests', selectedDate, user?.class],
        queryFn: async () => {
            const startDate = startOfWeek(selectedDate, { weekStartsOn: 0 })
            const endDate = endOfWeek(selectedDate, { weekStartsOn: 0 })

            const params = new URLSearchParams()
            if (user?.class) params.append('class', user.class)
            params.append('fromDate', startDate.toISOString())
            params.append('toDate', endDate.toISOString())

            const response = await api.get(`/tests?${params}`)
            const tests = response.data.data?.tests || []

            return tests.map(test => ({
                id: `test-${test._id}`,
                title: test.testName,
                date: test.date,
                startTime: test.startTime,
                endTime: test.endTime,
                type: 'test',
                room: test.room,
                status: test.status,
                subjects: test.subjects,
                totalMarks: test.totalMaxMarks
            }))
        },
        enabled: !!user?.class
    })

    // Filter events for selected date
    const getEventsForDate = (date) => {
        const allEvents = []

        // Add classes
        classEvents?.forEach(cls => {
            const eventDate = new Date(cls.start)
            if (isSameDay(eventDate, date)) {
                allEvents.push({
                    id: cls.id,
                    title: cls.title,
                    startTime: format(new Date(cls.start), 'HH:mm'),
                    endTime: cls.end ? format(new Date(cls.end), 'HH:mm') : null,
                    type: 'class',
                    room: cls.extendedProps?.room,
                    isOnline: cls.extendedProps?.isOnline,
                    meetingLink: cls.extendedProps?.meetingLink,
                    status: cls.extendedProps?.status,
                    subject: cls.extendedProps?.subject
                })
            }
        })

        // Add tests
        testEvents?.forEach(test => {
            const eventDate = new Date(test.date)
            if (isSameDay(eventDate, date)) {
                allEvents.push(test)
            }
        })

        // Sort by start time
        return allEvents.sort((a, b) => {
            const timeA = a.startTime || '00:00'
            const timeB = b.startTime || '00:00'
            return timeA.localeCompare(timeB)
        })
    }

    const selectedDateEvents = getEventsForDate(selectedDate)
    const isLoading = classesLoading || testsLoading

    if (isLoading) {
        return <ScheduleSkeleton />
    }

    return (
        <div className="p-4 md:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--primary)]">My Schedule</h1>
                    <p className="text-sm text-gray-500">Classes & Tests</p>
                </div>

                {/* View Toggle - Hidden on mobile */}
                <div className="hidden md:flex items-center gap-2">
                    <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
                        <button
                            onClick={() => setViewMode('agenda')}
                            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 transition-colors ${viewMode === 'agenda'
                                ? 'bg-[var(--primary)] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <List className="w-4 h-4" />
                            Agenda
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 transition-colors ${viewMode === 'calendar'
                                ? 'bg-[var(--primary)] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Calendar
                        </button>
                    </div>
                </div>
            </div>

            {/* Legend - Compact on mobile */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">Class</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                    <span className="text-gray-600">Test</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Ongoing</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                    <span className="text-gray-600">Done</span>
                </div>
            </div>

            {/* Mobile Agenda View */}
            <div className="md:hidden space-y-4">
                {/* Week Navigation */}
                <div className="card p-3">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={goToPreviousWeek}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="text-center">
                            <p className="font-semibold text-[var(--primary)]">
                                {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d, yyyy')}
                            </p>
                        </div>
                        <button
                            onClick={goToNextWeek}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Week Day Selector */}
                    <div className="grid grid-cols-7 gap-1">
                        {weekDates.map((date, index) => {
                            const isSelected = isSameDay(date, selectedDate)
                            const isTodayDate = isToday(date)
                            const hasEvents = getEventsForDate(date).length > 0

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(date)}
                                    className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${isSelected
                                        ? 'bg-[var(--primary)] text-white'
                                        : isTodayDate
                                            ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                            : 'hover:bg-gray-100'
                                        }`}
                                >
                                    <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-gray-400'
                                        }`}>
                                        {format(date, 'EEE')}
                                    </span>
                                    <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-700'
                                        }`}>
                                        {format(date, 'd')}
                                    </span>
                                    {hasEvents && !isSelected && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-1"></div>
                                    )}
                                    {hasEvents && isSelected && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white mt-1"></div>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Today Button */}
                    {!isToday(selectedDate) && (
                        <button
                            onClick={goToToday}
                            className="w-full mt-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-lg transition-colors"
                        >
                            Go to Today
                        </button>
                    )}
                </div>

                {/* Selected Date Events */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">
                        {isToday(selectedDate)
                            ? "Today's Schedule"
                            : format(selectedDate, 'EEEE, MMMM d')}
                    </h3>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="card p-4 border-l-4 border-l-gray-200">
                                    <div className="flex gap-3">
                                        <div className="w-[50px] flex flex-col items-center">
                                            <div className="h-4 w-10 bg-gray-200 rounded mb-1 animate-pulse" />
                                            <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-16 rounded-full bg-gray-200 animate-pulse" />
                                            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : selectedDateEvents.length === 0 ? (
                        <div className="card p-8 text-center">
                            <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No events scheduled</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Enjoy your free time!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedDateEvents.map((event, index) => (
                                <EventCard key={event.id || index} event={event} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                {viewMode === 'agenda' ? (
                    <DesktopAgendaView
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        weekDates={weekDates}
                        getEventsForDate={getEventsForDate}
                        goToPreviousWeek={goToPreviousWeek}
                        goToNextWeek={goToNextWeek}
                        goToToday={goToToday}
                        isLoading={isLoading}
                    />
                ) : (
                    <div className="card p-4">
                        <ScheduleCalendar
                            classFilter={user?.class}
                            section={user?.section}
                            editable={false}
                            showTests={true}
                            height="calc(100vh - 280px)"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

// Event Card Component
function EventCard({ event }) {
    const isTest = event.type === 'test'
    const isOngoing = event.status === 'ongoing'
    const isCompleted = event.status === 'completed'
    const isCancelled = event.status === 'cancelled'

    const formatTime = (time) => {
        if (!time) return ''
        const [hours, minutes] = time.split(':')
        const h = parseInt(hours)
        const ampm = h >= 12 ? 'PM' : 'AM'
        const h12 = h % 12 || 12
        return `${h12}:${minutes} ${ampm}`
    }

    return (
        <div className={`card p-4 border-l-4 ${isCancelled
            ? 'border-l-red-500 opacity-60'
            : isCompleted
                ? 'border-l-gray-400'
                : isOngoing
                    ? 'border-l-green-500'
                    : isTest
                        ? 'border-l-purple-500'
                        : 'border-l-blue-500'
            }`}>
            <div className="flex items-start gap-3">
                {/* Time */}
                <div className="text-center min-w-[50px]">
                    <p className="text-sm font-bold text-[var(--primary)]">
                        {formatTime(event.startTime)}
                    </p>
                    {event.endTime && (
                        <p className="text-xs text-gray-400">
                            {formatTime(event.endTime)}
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${isTest
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                            }`}>
                            {isTest ? 'TEST' : 'CLASS'}
                        </span>
                        {isOngoing && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700 animate-pulse">
                                LIVE
                            </span>
                        )}
                        {isCancelled && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700">
                                CANCELLED
                            </span>
                        )}
                    </div>

                    <h4 className={`font-semibold ${isCancelled ? 'line-through text-gray-400' : 'text-[var(--dark)]'}`}>
                        {event.title}
                    </h4>

                    {event.subject && (
                        <p className="text-sm text-gray-500 mt-0.5">{event.subject}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        {event.room && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.room}
                            </span>
                        )}
                        {event.isOnline && (
                            <span className="flex items-center gap-1 text-blue-600">
                                <Video className="w-3 h-3" />
                                Online
                            </span>
                        )}
                        {isTest && event.subjects && (
                            <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {event.subjects.length} subjects
                            </span>
                        )}
                        {isTest && event.totalMarks && (
                            <span className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                {event.totalMarks} marks
                            </span>
                        )}
                    </div>
                </div>

                {/* Join Button for Online */}
                {event.isOnline && event.meetingLink && !isCancelled && !isCompleted && (
                    <a
                        href={event.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-3 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                        Join
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>
        </div>
    )
}

// Desktop Agenda View
function DesktopAgendaView({
    selectedDate,
    setSelectedDate,
    weekDates,
    getEventsForDate,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    isLoading
}) {
    return (
        <div className="card p-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPreviousWeek}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={goToNextWeek}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="btn btn-outline text-sm"
                    >
                        Today
                    </button>
                </div>
                <h2 className="text-xl font-bold text-[var(--primary)]">
                    {format(weekDates[0], 'MMMM d')} - {format(weekDates[6], 'd, yyyy')}
                </h2>
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-4">
                {weekDates.map((date, index) => {
                    const events = getEventsForDate(date)
                    const isTodayDate = isToday(date)
                    const isSelected = isSameDay(date, selectedDate)

                    return (
                        <div
                            key={index}
                            onClick={() => setSelectedDate(date)}
                            className={`p-4 rounded-xl cursor-pointer transition-all min-h-[200px] ${isSelected
                                ? 'bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]'
                                : 'hover:bg-gray-50'
                                } ${isTodayDate ? 'border-2 border-[var(--primary)]' : 'border border-gray-200'}`}
                        >
                            <div className="text-center mb-3">
                                <p className="text-xs text-gray-500">{format(date, 'EEE')}</p>
                                <p className={`text-xl font-bold ${isTodayDate ? 'text-[var(--primary)]' : 'text-gray-700'
                                    }`}>
                                    {format(date, 'd')}
                                </p>
                            </div>

                            {isLoading ? (
                                <div className="text-center py-4">
                                    <div className="spinner w-6 h-6 mx-auto"></div>
                                </div>
                            ) : events.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-4">No events</p>
                            ) : (
                                <div className="space-y-2">
                                    {events.slice(0, 3).map((event, i) => (
                                        <div
                                            key={event.id || i}
                                            className={`p-2 rounded-lg text-xs ${event.type === 'test'
                                                ? 'bg-purple-50 text-purple-700'
                                                : 'bg-blue-50 text-blue-700'
                                                }`}
                                        >
                                            <p className="font-medium truncate">{event.title}</p>
                                            {event.startTime && (
                                                <p className="opacity-70">{event.startTime}</p>
                                            )}
                                        </div>
                                    ))}
                                    {events.length > 3 && (
                                        <p className="text-xs text-gray-500 text-center">
                                            +{events.length - 3} more
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
