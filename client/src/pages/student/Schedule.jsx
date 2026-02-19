/**
 * Student Schedule Dashboard
 * Calendar strip with day cards + upcoming tests/classes panels
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    BookOpen,
    FileText,
    GraduationCap,
    CalendarClock,
    Sparkles,
    ArrowDown
} from 'lucide-react'
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday, isSameDay } from 'date-fns'
import api from '../../lib/api'
import ScheduleSkeleton from '../../components/skeletons/ScheduleSkeleton'

export default function Schedule() {
    const { user } = useAuth()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const scrollRef = useRef(null)

    // Scroll to selected date on mobile
    useEffect(() => {
        if (scrollRef.current) {
            const el = scrollRef.current.querySelector('.selected-date')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
    }, [selectedDate])

    // Week dates
    const getWeekDates = (date) => {
        const start = startOfWeek(date, { weekStartsOn: 0 })
        return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }
    const weekDates = getWeekDates(selectedDate)

    const goToPreviousWeek = () => setSelectedDate(d => subDays(d, 7))
    const goToNextWeek = () => setSelectedDate(d => addDays(d, 7))
    const goToToday = () => setSelectedDate(new Date())

    // Fetch classes for selected week
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
        enabled: !!user?.class,
        staleTime: 1000 * 60 * 5, // 5 minutes (override global 24h)
    })

    // Fetch tests for selected week
    const { data: testEvents, isLoading: testsLoading } = useQuery({
        queryKey: ['schedule-tests', selectedDate, user?.class],
        queryFn: async () => {
            const startDate = startOfWeek(selectedDate, { weekStartsOn: 0 })
            const endDate = endOfWeek(selectedDate, { weekStartsOn: 0 })
            const params = new URLSearchParams()
            if (user?.class) params.append('class', user.class)
            params.append('fromDate', startDate.toISOString())
            params.append('toDate', endDate.toISOString())
            params.append('isPublished', 'true')
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
        enabled: !!user?.class,
        staleTime: 1000 * 60 * 5, // 5 minutes (override global 24h)
    })

    // Fetch upcoming classes (next 3)
    const { data: upcomingClasses } = useQuery({
        queryKey: ['upcoming-classes', user?.class],
        queryFn: async () => {
            const params = new URLSearchParams({ limit: 3 })
            if (user?.class) params.append('class', user.class)
            if (user?.section) params.append('section', user.section)
            const response = await api.get(`/classes/upcoming?${params}`)
            return response.data.data || []
        },
        enabled: !!user?.class,
        staleTime: 1000 * 60 * 2, // 2 minutes (override global 24h)
        refetchOnMount: 'always', // always refetch when page is visited
    })

    // Fetch upcoming tests (next 3)
    const { data: upcomingTests } = useQuery({
        queryKey: ['upcoming-tests-panel', user?.class],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (user?.class) params.append('class', user.class)
            params.append('isPublished', 'true')
            params.append('limit', '3')
            params.append('fromDate', new Date().toISOString())
            const response = await api.get(`/tests?${params}`)
            const tests = response.data.data?.tests || []
            return tests.map(test => ({
                id: test._id,
                title: test.testName,
                date: test.date,
                startTime: test.startTime,
                endTime: test.endTime,
                type: 'test',
                room: test.room,
                subjects: test.subjects,
                totalMarks: test.totalMaxMarks
            }))
        },
        enabled: !!user?.class,
        staleTime: 1000 * 60 * 2, // 2 minutes (override global 24h)
        refetchOnMount: 'always', // always refetch when page is visited
    })

    // Check what events exist on each day
    const getDayLabels = (date) => {
        const labels = []
        const hasClass = classEvents?.some(cls => isSameDay(new Date(cls.start), date))
        const hasTest = testEvents?.some(test => isSameDay(new Date(test.date), date))
        if (hasClass) labels.push('class')
        if (hasTest) labels.push('test')
        return labels
    }

    const isLoading = classesLoading || testsLoading
    if (isLoading) return <ScheduleSkeleton />

    return (
        <div className="space-y-5 md:space-y-6 max-w-7xl mx-auto overflow-x-hidden px-1 md:px-0">
            {/* ===== PREMIUM PAGE HEADER ===== */}
            <div className="relative overflow-hidden rounded-2xl px-5 py-5 md:px-7 md:py-6 mt-3 md:mt-4"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5f8d 40%, #4a7ba7 100%)' }}
            >
                {/* Decorative Elements */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/[0.03]" />
                <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/[0.04] hidden md:block" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                <CalendarClock size={18} className="text-white/90" />
                            </div>
                            <span className="text-white/50 text-[11px] font-semibold uppercase tracking-widest">
                                My Schedule
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold font-display text-white tracking-tight">
                            {format(selectedDate, 'MMMM yyyy')}
                        </h1>
                        <p className="text-white/50 text-xs md:text-sm mt-1 flex items-center gap-1.5">
                            <Sparkles size={12} className="text-orange-300/70" />
                            {isToday(selectedDate) ? "Today's Schedule" : format(selectedDate, 'EEEE, MMM do')}
                        </p>
                    </div>

                    {/* Quick Action */}
                    {!isToday(selectedDate) && (
                        <button
                            onClick={goToToday}
                            className="self-start md:self-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 flex items-center gap-1.5"
                        >
                            <CalendarIcon size={13} />
                            Go to Today
                        </button>
                    )}
                </div>
            </div>

            {/* ===== CALENDAR SECTION ===== */}
            <div className="relative">
                {/* Calendar Card */}
                <div
                    className="rounded-2xl overflow-hidden shadow-lg"
                    style={{
                        background: 'linear-gradient(135deg, #2c5f8d 0%, #4a7ba7 50%, #5a8ab8 100%)'
                    }}
                >
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between px-4 md:px-5 pt-4 md:pt-5 pb-2 md:pb-3">
                        <div>
                            <h2 className="text-white font-display text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
                                <CalendarIcon size={18} className="opacity-80" />
                                calander
                            </h2>
                            <p className="text-white/60 text-[11px] md:text-xs mt-0.5">
                                {format(weekDates[0], 'MMM d')} – {format(weekDates[6], 'MMM d, yyyy')}
                            </p>
                        </div>
                        <div className="flex items-center gap-0.5 md:gap-1">
                            <button
                                onClick={goToToday}
                                className="px-2.5 md:px-3 py-1.5 text-[11px] md:text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            >
                                Today
                            </button>
                            <button
                                onClick={goToPreviousWeek}
                                className="p-1.5 md:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={goToNextWeek}
                                className="p-1.5 md:p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* ── MOBILE: Compact Apple-style Strip ── */}
                    <div className="md:hidden px-3 pb-4">
                        <div className="grid grid-cols-7 gap-1">
                            {weekDates.map((date, index) => {
                                const isSelected = isSameDay(date, selectedDate)
                                const isTodayDate = isToday(date)
                                const labels = getDayLabels(date)

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(date)}
                                        className="flex flex-col items-center py-2 rounded-xl transition-all duration-200 relative min-h-[70px]"
                                    >
                                        {/* Day abbreviation */}
                                        <span className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${isSelected ? 'text-white' : 'text-white/50'}`}>
                                            {format(date, 'EEE')}
                                        </span>

                                        {/* Circular date */}
                                        <div className={`
                                            w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200
                                            ${isSelected
                                                ? 'bg-white text-[#2c5f8d] shadow-lg shadow-white/20 scale-110'
                                                : isTodayDate
                                                    ? 'bg-white/25 text-white ring-1 ring-white/40'
                                                    : 'text-white/80 hover:bg-white/10'
                                            }
                                        `}>
                                            {format(date, 'd')}
                                        </div>

                                        {/* Event dots */}
                                        <div className="flex gap-1 mt-1.5 h-2">
                                            {labels.includes('class') && (
                                                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-blue-300/70'}`} title="Class" />
                                            )}
                                            {labels.includes('test') && (
                                                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-purple-300' : 'bg-purple-300/70'}`} title="Test" />
                                            )}
                                        </div>

                                        {/* Today ring indicator */}
                                        {isTodayDate && !isSelected && (
                                            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Mobile legend */}
                        <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-white/10">
                            <span className="flex items-center gap-1.5 text-[10px] text-white/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-300/70" />
                                Class
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] text-white/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-300/70" />
                                Test
                            </span>
                        </div>
                    </div>

                    {/* ── DESKTOP: Rich Day Cards ── */}
                    <div
                        ref={scrollRef}
                        className="hidden md:flex gap-3 px-5 pb-5"
                    >
                        {weekDates.map((date, index) => {
                            const isSelected = isSameDay(date, selectedDate)
                            const isTodayDate = isToday(date)
                            const labels = getDayLabels(date)

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(date)}
                                    className={`
                                        ${isSelected ? 'selected-date' : ''}
                                        flex-1 flex flex-col items-center
                                        rounded-xl transition-all duration-300
                                        p-3 cursor-pointer group relative
                                        ${isSelected
                                            ? 'bg-white shadow-xl scale-[1.03]'
                                            : isTodayDate
                                                ? 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                                                : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
                                        }
                                    `}
                                >
                                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-[#2c5f8d]' : 'text-white/60'}`}>
                                        {format(date, 'EEE')}
                                    </span>
                                    <span className={`text-2xl font-bold leading-none mb-2 font-display ${isSelected ? 'text-[#2c5f8d]' : 'text-white'}`}>
                                        {format(date, 'd')}
                                    </span>
                                    <span className={`text-[9px] font-medium uppercase tracking-wider mb-2 ${isSelected ? 'text-[#4a7ba7]' : 'text-white/50'}`}>
                                        {format(date, 'MMM')}
                                    </span>
                                    <div className="flex flex-col gap-1 w-full">
                                        {labels.includes('class') && (
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-center ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-white/20 text-white/90'}`}>
                                                class
                                            </span>
                                        )}
                                        {labels.includes('test') && (
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-center ${isSelected ? 'bg-purple-100 text-purple-700' : 'bg-white/20 text-white/90'}`}>
                                                test
                                            </span>
                                        )}
                                        {labels.length === 0 && (
                                            <span className={`text-[9px] px-2 py-0.5 rounded-md text-center ${isSelected ? 'text-gray-400' : 'text-white/30'}`}>—</span>
                                        )}
                                    </div>
                                    {isTodayDate && !isSelected && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-full ring-2 ring-[#2c5f8d] animate-pulse" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Connection Lines */}
                <div className="hidden md:flex justify-center gap-32 py-2">
                    <div className="flex flex-col items-center">
                        <div className="w-px h-6 bg-gradient-to-b from-[#5a8ab8] to-purple-400 opacity-40" />
                        <ArrowDown size={14} className="text-purple-400/50 -mt-1" />
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-px h-6 bg-gradient-to-b from-[#5a8ab8] to-blue-400 opacity-40" />
                        <ArrowDown size={14} className="text-blue-400/50 -mt-1" />
                    </div>
                </div>
            </div>

            {/* ===== BOTTOM PANELS ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* LEFT: Upcoming Tests */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2.5"
                        style={{ background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(168, 85, 247, 0.08) 100%)' }}
                    >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FileText size={16} className="text-purple-600" />
                        </div>
                        <h3 className="font-display font-bold text-gray-900 text-base">
                            upcomming test
                        </h3>
                        <div className="ml-auto px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold">
                            {upcomingTests?.length || 0}
                        </div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {upcomingTests && upcomingTests.length > 0 ? (
                            upcomingTests.slice(0, 3).map((test, idx) => (
                                <TestCard key={test.id || idx} test={test} index={idx} />
                            ))
                        ) : (
                            <EmptyState icon={<FileText size={24} />} message="No upcoming tests" />
                        )}
                    </div>
                </div>

                {/* RIGHT: Upcoming Classes */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2.5"
                        style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(96, 165, 250, 0.08) 100%)' }}
                    >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <BookOpen size={16} className="text-blue-600" />
                        </div>
                        <h3 className="font-display font-bold text-gray-900 text-base">
                            upcomming classes
                        </h3>
                        <div className="ml-auto px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
                            {upcomingClasses?.length || 0}
                        </div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {upcomingClasses && upcomingClasses.length > 0 ? (
                            upcomingClasses.slice(0, 3).map((cls, idx) => (
                                <ClassCard key={cls._id || idx} cls={cls} index={idx} />
                            ))
                        ) : (
                            <EmptyState icon={<BookOpen size={24} />} message="No upcoming classes" />
                        )}
                    </div>
                </div>
            </div>

            {/* ===== WEEKLY SUMMARY ===== */}
            <div
                className="rounded-2xl p-5 md:p-6 text-white shadow-lg"
                style={{
                    background: 'linear-gradient(135deg, #2c5f8d 0%, #4a7ba7 60%, #5a8ab8 100%)'
                }}
            >
                <h3 className="font-display font-bold mb-4 text-white/90 flex items-center gap-2">
                    <Sparkles size={18} className="text-orange-300" />
                    Weekly Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <SummaryCard label="Classes this week" value={classEvents?.length || 0} />
                    <SummaryCard label="Tests scheduled" value={testEvents?.length || 0} />
                    <SummaryCard label="Upcoming classes" value={upcomingClasses?.length || 0} />
                    <SummaryCard label="Upcoming tests" value={upcomingTests?.length || 0} />
                </div>
            </div>
        </div>
    )
}

// ─── Test Card ───────────────────────────────────────────────
function TestCard({ test, index }) {
    const isFirst = index === 0
    return (
        <div className={`p-4 hover:bg-purple-50/30 transition-all duration-200 group cursor-pointer ${isFirst ? 'bg-purple-50/20' : ''}`}>
            <div className="flex gap-3 items-start">
                {/* Date Badge */}
                <div className={`
                    w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold leading-none shrink-0
                    transition-all duration-200 group-hover:scale-105
                    ${isFirst
                        ? 'bg-purple-500 text-white shadow-md shadow-purple-200'
                        : 'bg-purple-50 text-purple-600 group-hover:bg-purple-100'
                    }
                `}>
                    <span className="text-lg font-bold">{test.date ? format(new Date(test.date), 'd') : '—'}</span>
                    <span className={`text-[10px] font-medium ${isFirst ? 'text-white/70' : 'opacity-60'}`}>
                        {test.date ? format(new Date(test.date), 'MMM') : ''}
                    </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-purple-700 transition-colors">
                        {test.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                        {test.startTime && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={11} />
                                {formatTime(test.startTime)}
                            </span>
                        )}
                        {test.room && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={11} />
                                {test.room}
                            </span>
                        )}
                        {test.totalMarks && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <GraduationCap size={11} />
                                {test.totalMarks} marks
                            </span>
                        )}
                    </div>
                    {test.subjects && test.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {test.subjects.slice(0, 2).map((sub, i) => (
                                <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-medium rounded-md">
                                    {typeof sub === 'string' ? sub : sub.subject}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Next indicator */}
                {isFirst && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[9px] font-bold uppercase tracking-wider shrink-0 self-start">
                        Next
                    </span>
                )}
            </div>
        </div>
    )
}

// ─── Class Card ──────────────────────────────────────────────
function ClassCard({ cls, index }) {
    const isFirst = index === 0
    return (
        <div className={`p-4 hover:bg-blue-50/30 transition-all duration-200 group cursor-pointer ${isFirst ? 'bg-blue-50/20' : ''}`}>
            <div className="flex gap-3 items-start">
                {/* Date Badge */}
                <div className={`
                    w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold leading-none shrink-0
                    transition-all duration-200 group-hover:scale-105
                    ${isFirst
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                        : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                    }
                `}>
                    <span className="text-lg font-bold">{cls.date ? format(new Date(cls.date), 'd') : '—'}</span>
                    <span className={`text-[10px] font-medium ${isFirst ? 'text-white/70' : 'opacity-60'}`}>
                        {cls.date ? format(new Date(cls.date), 'MMM') : ''}
                    </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                        {cls.title || cls.subject}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                        {cls.startTime && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={11} />
                                {formatTime(cls.startTime)}
                            </span>
                        )}
                        {cls.room && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={11} />
                                {cls.room}
                            </span>
                        )}
                        {cls.isOnline && (
                            <span className="text-xs text-blue-500 font-medium">
                                Online
                            </span>
                        )}
                    </div>
                    {cls.subject && (
                        <div className="mt-1.5">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded-md">
                                {cls.subject}
                            </span>
                        </div>
                    )}
                </div>

                {/* Next indicator */}
                {isFirst && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider shrink-0 self-start">
                        Next
                    </span>
                )}
            </div>
        </div>
    )
}

// ─── Summary Card ────────────────────────────────────────────
function SummaryCard({ label, value }) {
    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/15 transition-colors">
            <p className="text-2xl font-bold font-display">{value}</p>
            <p className="text-[11px] text-white/60 mt-0.5">{label}</p>
        </div>
    )
}

// ─── Empty State ─────────────────────────────────────────────
function EmptyState({ icon, message }) {
    return (
        <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-3">
                {icon}
            </div>
            <p className="text-sm text-gray-400">{message}</p>
        </div>
    )
}

// ─── Helpers ─────────────────────────────────────────────────
const formatTime = (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
}
