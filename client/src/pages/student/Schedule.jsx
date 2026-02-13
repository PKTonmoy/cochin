/**
 * Student Schedule Page
 * Premium timeline view with responsive design
 */

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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
    GraduationCap,
    Sparkles,
    CalendarClock,
    ArrowRight,
    MoreHorizontal
} from 'lucide-react'
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday, isSameDay, parseISO, isAfter, isBefore } from 'date-fns'
import api from '../../lib/api'
import ScheduleCalendar from '../../components/ScheduleCalendar'
import ScheduleSkeleton from '../../components/skeletons/ScheduleSkeleton'

export default function Schedule() {
    const { user } = useAuth()
    const [viewMode, setViewMode] = useState('agenda') // 'agenda' or 'calendar'
    const [selectedDate, setSelectedDate] = useState(new Date())
    const scrollRef = useRef(null)

    // Scroll to today/selected date on load
    useEffect(() => {
        if (scrollRef.current) {
            const selectedElement = scrollRef.current.querySelector('.selected-date')
            if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            }
        }
    }, [selectedDate])

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

    // Fetch tests for calendar
    const { data: testEvents, isLoading: testsLoading } = useQuery({
        queryKey: ['schedule-tests', selectedDate, user?.class],
        queryFn: async () => {
            const startDate = startOfWeek(selectedDate, { weekStartsOn: 0 })
            const endDate = endOfWeek(selectedDate, { weekStartsOn: 0 })

            const params = new URLSearchParams()
            if (user?.class) params.append('class', user.class)
            params.append('fromDate', startDate.toISOString())
            params.append('toDate', endDate.toISOString())
            params.append('isPublished', 'true') // Only published tests for students

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

    // Fetch upcoming classes (Next 3)
    const { data: upcomingClasses } = useQuery({
        queryKey: ['upcoming-classes', user?.class],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: 5 })
            if (user?.class) params.append('class', user.class)
            if (user?.section) params.append('section', user.section)

            const response = await api.get(`/classes/upcoming?${params}`)
            return response.data.data || []
        },
        enabled: !!user?.class
    })

    // Combine and sort upcoming events
    const upcomingEvents = upcomingClasses?.map(c => ({
        ...c,
        type: 'class',
        eventDate: new Date(c.date)
    })) || []


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
                    subject: cls.extendedProps?.subject,
                    start: cls.start
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
        <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto md:px-6 lg:px-8 overflow-x-hidden">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {format(selectedDate, 'MMMM yyyy')}
                    </h1>
                    <p className="text-gray-500 flex items-center gap-2">
                        <CalendarClock size={16} />
                        {isToday(selectedDate) ? "Today's Schedule" : format(selectedDate, 'EEEE, MMM do')}
                    </p>
                </div>

                {/* View Controls */}
                <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3 bg-white/50 backdrop-blur-sm p-1.5 rounded-xl border border-gray-100 shadow-sm">
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-xs md:text-sm font-medium text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                    >
                        Today
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-px h-4 bg-gray-200"></div>
                        <div className="flex bg-gray-100/50 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('agenda')}
                                className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium flex items-center gap-1.5 transition-all ${viewMode === 'agenda'
                                    ? 'bg-white text-[var(--primary)] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <List size={14} className="md:w-4 md:h-4" />
                                <span className="inline">Timeline</span>
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium flex items-center gap-1.5 transition-all ${viewMode === 'calendar'
                                    ? 'bg-white text-[var(--primary)] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <CalendarIcon size={14} className="md:w-4 md:h-4" />
                                <span className="inline">Calendar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {viewMode === 'agenda' ? (
                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Left Column: Timeline & Week Selector (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Premium Week Selector */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={goToPreviousWeek}
                                    className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-500"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm font-medium text-gray-500">
                                    Week of {format(weekDates[0], 'MMM d')}
                                </span>
                                <button
                                    onClick={goToNextWeek}
                                    className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-500"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {/* Week Day Selector - Scrollable Horizontal List */}
                            <div
                                className="flex justify-between items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x"
                                ref={scrollRef}
                            >
                                {weekDates.map((date, index) => {
                                    const isSelected = isSameDay(date, selectedDate)
                                    const isTodayDate = isToday(date)
                                    const hasEvents = getEventsForDate(date).length > 0

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedDate(date)}
                                            className={`snap-center flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-xl transition-all min-w-[50px] ${isSelected
                                                ? 'bg-[var(--primary)] text-white shadow-md shadow-blue-200'
                                                : isTodayDate
                                                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-blue-100'
                                                    : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                                                }`}
                                        >
                                            <span className={`text-[10px] font-medium mb-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                                {format(date, 'EEE')}
                                            </span>
                                            <span className={`text-lg font-bold leading-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                {format(date, 'd')}
                                            </span>

                                            {/* Event Dot Indicator */}
                                            {hasEvents && !isSelected && (
                                                <div className="mt-1 w-1 h-1 rounded-full bg-[var(--primary)] align-middle inline-block"></div>
                                            )}
                                            {hasEvents && isSelected && (
                                                <div className="mt-1 w-1 h-1 rounded-full bg-white align-middle inline-block"></div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Timeline Events */}
                        <div className="space-y-4">
                            {selectedDateEvents.length > 0 ? (
                                selectedDateEvents.map((event, index) => (
                                    <TimelineEventCard key={index} event={event} />
                                ))
                            ) : (
                                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                                        <CoffeeIcon />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No events scheduled</h3>
                                    <p className="text-gray-500">Enjoy your free time or prepare for upcoming classes!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Upcoming & Summary (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Upcoming Classes Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-3 md:p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                                    <Sparkles size={16} className="text-[var(--secondary)]" />
                                    Upcoming Classes
                                </h3>
                                <Link to="/student" className="text-xs font-medium text-[var(--primary)] hover:underline">View All</Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {upcomingEvents.length > 0 ? (
                                    upcomingEvents.slice(0, 4).map((event, idx) => (
                                        <div key={idx} className="p-3 md:p-4 hover:bg-gray-50 transition-colors group">
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex flex-col items-center justify-center text-xs font-bold leading-none shrink-0 group-hover:bg-blue-100 transition-colors">
                                                    <span>{format(new Date(event.date), 'd')}</span>
                                                    <span className="text-[10px] font-medium opacity-70">{format(new Date(event.date), 'MMM')}</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-gray-900 truncate text-sm md:text-base">{event.title || event.subject}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                        <Clock size={12} />
                                                        {formatTime(event.startTime)}
                                                        {event.isOnline && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-blue-500 font-medium">Online</span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-sm text-gray-500">No upcoming classes found</div>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-4 md:p-6 text-white shadow-lg shadow-indigo-200">
                            <h3 className="font-semibold mb-4 opacity-90">Weekly Summary</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                                    <p className="text-2xl font-bold">{classEvents?.length || 0}</p>
                                    <p className="text-xs opacity-70">Classes this week</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                                    <p className="text-2xl font-bold">{testEvents?.length || 0}</p>
                                    <p className="text-xs opacity-70">Tests scheduled</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Calendar View */
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 md:p-4 overflow-hidden h-[calc(100vh-200px)]">
                    <ScheduleCalendar
                        classFilter={user?.class}
                        section={user?.section}
                        editable={false}
                        showTests={true}
                        height="100%"
                    />
                </div>
            )}
        </div>
    )
}

// Timeline Event Card Component
function TimelineEventCard({ event }) {
    const isTest = event.type === 'test'
    const isOnline = event.isOnline
    const isLive = event.status === 'ongoing'

    // Determine colors based on type
    const colorClass = isTest
        ? 'border-l-purple-500 bg-purple-50/30'
        : isOnline
            ? 'border-l-blue-500 bg-blue-50/30'
            : 'border-l-indigo-500 bg-indigo-50/30'

    const iconBg = isTest ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
    const Icon = isTest ? FileText : BookOpen

    return (
        <div className="flex gap-2 md:gap-4 group">
            {/* Time Column - Compact on mobile */}
            <div className="flex flex-col items-end min-w-[45px] md:min-w-[60px] pt-1">
                <span className="text-xs md:text-sm font-bold text-gray-900">{formatTime(event.startTime)}</span>
                <span className="text-[10px] md:text-xs text-gray-400">{event.endTime ? formatTime(event.endTime) : '...'}</span>
            </div>

            {/* Timeline Line & Dot */}
            <div className="relative flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${isLive ? 'bg-green-500 animate-pulse' : isTest ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                <div className="w-0.5 bg-gray-100 h-full absolute top-3 -bottom-6 group-last:hidden"></div>
            </div>

            {/* Card Content */}
            <div className={`flex-1 rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-4 ${colorClass}`}>
                <div className="flex justify-between items-start gap-2 md:gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${isTest ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {isTest ? 'Test' : 'Class'}
                            </span>
                            {isLive && (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-green-100 text-green-700">
                                    Live
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base md:text-lg truncate block leading-tight mb-0.5">{event.title}</h3>
                        <p className="text-xs md:text-sm text-gray-500 truncate">{event.subject}</p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                            {event.room && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={12} />
                                    <span>{event.room}</span>
                                </div>
                            )}
                            {isOnline && (
                                <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                                    <Video size={12} />
                                    <span>Online</span>
                                </div>
                            )}
                            {isTest && event.totalMarks && (
                                <div className="flex items-center gap-1.5">
                                    <GraduationCap size={12} />
                                    <span>{event.totalMarks} Marks</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    {isOnline && event.meetingLink && (
                        <a
                            href={event.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all text-xs"
                            title="Join Class"
                        >
                            <Video size={16} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}

// Helpers
const formatTime = (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
}

function CoffeeIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
            <line x1="6" y1="2" x2="6" y2="4"></line>
            <line x1="10" y1="2" x2="10" y2="4"></line>
            <line x1="14" y1="2" x2="14" y2="4"></line>
        </svg>
    )
}


