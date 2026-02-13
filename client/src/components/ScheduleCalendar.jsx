/**
 * Schedule Calendar Component
 * Full calendar view for classes and tests with FullCalendar
 */

import { useState, useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { X, Calendar, Clock, MapPin, User, Video, FileText, ExternalLink } from 'lucide-react'
import api from '../lib/api'

export default function ScheduleCalendar({
    classFilter,
    section,
    editable = false,
    onEventDrop,
    showTests = true,
    height = 'auto'
}) {
    const calendarRef = useRef(null)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString(),
        end: new Date(new Date().setMonth(new Date().getMonth() + 1, 0)).toISOString()
    })

    // Fetch classes
    const { data: classEvents, isLoading: classesLoading } = useQuery({
        queryKey: ['calendar-classes', dateRange, classFilter, section],
        queryFn: async () => {
            const params = new URLSearchParams({
                start: dateRange.start,
                end: dateRange.end
            })
            if (classFilter) params.append('class', classFilter)
            if (section) params.append('section', section)

            const response = await api.get(`/classes/calendar?${params}`)
            return response.data.data
        }
    })

    // Fetch tests
    const { data: testEvents, isLoading: testsLoading } = useQuery({
        queryKey: ['calendar-tests', dateRange, classFilter],
        queryFn: async () => {
            if (!showTests) return []

            const params = new URLSearchParams()
            if (classFilter) params.append('class', classFilter)
            params.append('fromDate', dateRange.start)
            params.append('toDate', dateRange.end)

            const response = await api.get(`/tests?${params}`)
            const tests = response.data.data.tests || []

            return tests.map(test => ({
                id: `test-${test._id}`,
                title: test.testName,
                start: test.startTime
                    ? combineDateTime(test.date, test.startTime)
                    : test.date,
                end: test.endTime
                    ? combineDateTime(test.date, test.endTime)
                    : null,
                backgroundColor: getTestStatusColor(test.status),
                borderColor: getTestStatusColor(test.status),
                extendedProps: {
                    type: 'test',
                    testCode: test.testCode,
                    class: test.class,
                    section: test.section,
                    room: test.room,
                    status: test.status,
                    totalMarks: test.totalMaxMarks,
                    subjects: test.subjects
                }
            }))
        },
        enabled: showTests
    })

    // Combine events
    const allEvents = [...(classEvents || []), ...(testEvents || [])]

    const handleDateRangeChange = (arg) => {
        setDateRange({
            start: arg.start.toISOString(),
            end: arg.end.toISOString()
        })
    }

    const handleEventClick = (arg) => {
        setSelectedEvent({
            ...arg.event.extendedProps,
            id: arg.event.id,
            title: arg.event.title,
            start: arg.event.start,
            end: arg.event.end,
            backgroundColor: arg.event.backgroundColor
        })
    }

    const handleEventDrop = (arg) => {
        if (onEventDrop && arg.event.extendedProps.type === 'class') {
            onEventDrop({
                id: arg.event.id,
                oldStart: arg.oldEvent.start,
                newStart: arg.event.start,
                newEnd: arg.event.end
            })
        } else {
            arg.revert()
        }
    }

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    // Handle window resize for responsive calendar view
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            if (calendarRef.current) {
                const calendarApi = calendarRef.current.getApi()
                if (mobile && calendarApi.view.type === 'timeGridWeek') {
                    calendarApi.changeView('timeGridDay')
                } else if (!mobile && calendarApi.view.type === 'timeGridDay') {
                    calendarApi.changeView('timeGridWeek')
                }
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <div className="schedule-calendar h-full">
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView={window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek'}
                headerToolbar={{
                    left: isMobile ? 'prev,next' : 'prev,next today',
                    center: 'title',
                    right: isMobile ? 'timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={allEvents}
                eventClick={handleEventClick}
                eventDrop={editable ? handleEventDrop : undefined}
                editable={editable}
                droppable={editable}
                datesSet={handleDateRangeChange}
                slotMinTime="07:00:00"
                slotMaxTime="21:00:00"
                allDaySlot={false}
                weekends={true}
                nowIndicator={true}
                height="100%"
                expandRows={true}
                stickyHeaderDates={true}
                dayMaxEvents={true}
                eventTimeFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short'
                }}
                slotLabelFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short'
                }}
                loading={(isLoading) => {
                    // Handle loading state
                }}
                eventContent={(arg) => (
                    <div className="p-1 overflow-hidden h-full flex flex-col">
                        <div className="font-bold text-xs truncate leading-tight">{arg.event.title}</div>
                        {arg.event.extendedProps.room && (
                            <div className="text-[10px] opacity-90 truncate mt-0.5">
                                {arg.event.extendedProps.room}
                            </div>
                        )}
                    </div>
                )}
            />

            {/* Event Details Modal */}
            {selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />
            )}

            <style>{`
                .fc .fc-button-primary {
                    background-color: #3b82f6;
                    border-color: #3b82f6;
                }
                .fc .fc-button-primary:hover {
                    background-color: #2563eb;
                    border-color: #2563eb;
                }
                .fc .fc-button-primary:disabled {
                    background-color: #93c5fd;
                    border-color: #93c5fd;
                }
                .fc .fc-button-primary:not(:disabled).fc-button-active {
                    background-color: #1d4ed8;
                    border-color: #1d4ed8;
                }
                .fc-event {
                    cursor: pointer;
                    border-radius: 4px;
                }
                .fc-timegrid-event {
                    border-radius: 4px;
                }
                .fc .fc-timegrid-now-indicator-line {
                    border-color: #ef4444;
                }
                .fc .fc-timegrid-now-indicator-arrow {
                    border-color: #ef4444;
                    border-top-color: transparent;
                    border-bottom-color: transparent;
                }
            `}</style>
        </div>
    )
}

function EventDetailsModal({ event, onClose }) {
    const isClass = event.type === 'class'

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="p-4 rounded-t-lg text-white"
                    style={{ backgroundColor: event.backgroundColor }}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${isClass ? 'bg-white/20' : 'bg-white/20'
                                }`}>
                                {isClass ? 'Class' : 'Test'}
                            </span>
                            <h3 className="text-lg font-semibold">{event.title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {format(new Date(event.start), 'EEEE, MMMM d, yyyy')}
                            </p>
                            {event.end && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Room/Location */}
                    {event.room && (
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">{event.room}</span>
                        </div>
                    )}

                    {/* Online meeting link */}
                    {event.isOnline && event.meetingLink && (
                        <div className="flex items-center gap-3">
                            <Video className="w-5 h-5 text-gray-400" />
                            <a
                                href={event.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                Join Meeting
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    )}

                    {/* Class/Section */}
                    <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                            {event.class}{event.section ? ` - ${event.section}` : ''}
                        </span>
                    </div>

                    {/* Subject (for classes) */}
                    {isClass && event.subject && (
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">{event.subject}</span>
                        </div>
                    )}

                    {/* Test-specific info */}
                    {!isClass && event.totalMarks && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total Marks: <span className="font-semibold text-gray-900 dark:text-white">{event.totalMarks}</span>
                            </p>
                            {event.subjects && event.subjects.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subjects:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {event.subjects.map((subj, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs"
                                            >
                                                {subj.name} ({subj.maxMarks})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            event.status === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                event.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' :
                                    event.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                            {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper functions
function combineDateTime(date, timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const combined = new Date(date)
    combined.setHours(hours, minutes, 0, 0)
    return combined.toISOString()
}

function getTestStatusColor(status) {
    const colors = {
        scheduled: '#8b5cf6',
        ongoing: '#10b981',
        completed: '#6b7280',
        cancelled: '#ef4444'
    }
    return colors[status] || '#8b5cf6'
}
