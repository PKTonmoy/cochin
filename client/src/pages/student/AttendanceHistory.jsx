import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import {
    Calendar as CalendarIcon,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    BarChart3,
    TrendingUp,
    Filter,
    ChevronLeft,
    ChevronRight,
    Flame,
    Award
} from 'lucide-react'
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
    isToday,
    differenceInDays
} from 'date-fns'
import AttendanceSkeleton from '../../components/skeletons/AttendanceSkeleton'

const AttendanceHistory = () => {
    const { user } = useAuth()
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [filter, setFilter] = useState('all') // 'all', 'present', 'absent', 'late'

    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ['student-attendance-history', user?.id],
        queryFn: async () => {
            const response = await api.get(`/attendance/student/${user?.id}?limit=500`)
            return response.data.data.attendance || []
        },
        enabled: !!user?.id
    })

    // Calculate stats and processed data
    const { stats, calendarDays, streaks } = useMemo(() => {
        if (!attendanceData) return { stats: null, calendarDays: [], streaks: { current: 0, best: 0 } }

        // Sort by date mostly for streak calculation
        const sortedData = [...attendanceData].sort((a, b) => new Date(b.date) - new Date(a.date))

        // Calculate Stats
        const total = sortedData.length
        const present = sortedData.filter(r => r.status === 'present').length
        const late = sortedData.filter(r => r.status === 'late').length
        const absent = sortedData.filter(r => r.status === 'absent').length
        const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0

        // Calculate Streaks
        let currentStreak = 0
        let bestStreak = 0
        let tempStreak = 0

        // For current streak, check from today backwards
        // This is a simplified streak calculation assuming contiguous days matter or just sequential sessions
        // Let's do sequential sessions for simplicity in this context
        for (const record of sortedData) {
            if (record.status === 'present' || record.status === 'late') {
                currentStreak++
            } else {
                break
            }
        }

        // Best streak scan
        for (const record of sortedData) {
            if (record.status === 'present' || record.status === 'late') {
                tempStreak++
            } else {
                bestStreak = Math.max(bestStreak, tempStreak)
                tempStreak = 0
            }
        }
        bestStreak = Math.max(bestStreak, tempStreak)


        // Calendar Days for the selected month
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

        const days = daysInMonth.map(date => {
            const dayRecords = attendanceData.filter(r => isSameDay(parseISO(r.date), date))
            // Prioritize status: absent > late > present (if multiple records per day, e.g. multiple classes)
            // Or just show dot indicators
            const status = dayRecords.length > 0
                ? (dayRecords.find(r => r.status === 'absent')?.status ||
                    dayRecords.find(r => r.status === 'late')?.status ||
                    'present')
                : null

            return { date, status, records: dayRecords }
        })

        return {
            stats: { total, present, late, absent, percentage },
            calendarDays: days,
            streaks: { current: currentStreak, best: bestStreak }
        }
    }, [attendanceData, currentMonth])

    const filteredHistory = useMemo(() => {
        if (!attendanceData) return []
        return attendanceData.filter(item => {
            if (filter === 'all') return true
            return item.status === filter
        }).sort((a, b) => new Date(b.date) - new Date(a.date))
    }, [attendanceData, filter])

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    if (isLoading) {
        return <AttendanceSkeleton />
    }

    return (
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 animate-fadeIn px-1 sm:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Attendance History</h1>
                    <p className="text-sm md:text-base text-gray-500">Track your attendance records and statistics</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left Column: Stats & Calendar */}
                <div className="lg:col-span-1 space-y-4 md:space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="card p-3.5 md:p-4 border-l-4 border-l-green-500 relative overflow-hidden shadow-sm">
                            <div className="relative z-10">
                                <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1">Overall Rate</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl md:text-2xl font-bold text-gray-900">{stats?.percentage}%</span>
                                </div>
                                <p className="text-[11px] md:text-xs text-green-600 mt-1">
                                    {stats?.present + stats?.late}/{stats?.total} sessions
                                </p>
                            </div>
                            <Award className="absolute right-2 bottom-2 text-green-100 w-8 h-8 md:w-12 md:h-12" />
                        </div>

                        <div className="card p-3.5 md:p-4 border-l-4 border-l-orange-500 relative overflow-hidden shadow-sm">
                            <div className="relative z-10">
                                <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1">Current Streak</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl md:text-2xl font-bold text-gray-900">{streaks.current}</span>
                                    <span className="text-xs md:text-xs text-gray-500">days</span>
                                </div>
                                <p className="text-[11px] md:text-xs text-orange-600 mt-1">Best: {streaks.best} days</p>
                            </div>
                            <Flame className="absolute right-2 bottom-2 text-orange-100 w-8 h-8 md:w-12 md:h-12" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        <div className="card p-3 md:p-3 text-center bg-gray-50 shadow-sm">
                            <p className="text-[10px] md:text-xs text-gray-500 mb-0.5 md:mb-1 font-medium">Present</p>
                            <p className="text-lg md:text-xl font-bold text-green-600">{stats?.present}</p>
                        </div>
                        <div className="card p-3 md:p-3 text-center bg-gray-50 shadow-sm">
                            <p className="text-[10px] md:text-xs text-gray-500 mb-0.5 md:mb-1 font-medium">Late</p>
                            <p className="text-lg md:text-xl font-bold text-amber-600">{stats?.late}</p>
                        </div>
                        <div className="card p-3 md:p-3 text-center bg-gray-50 shadow-sm">
                            <p className="text-[10px] md:text-xs text-gray-500 mb-0.5 md:mb-1 font-medium">Absent</p>
                            <p className="text-lg md:text-xl font-bold text-red-600">{stats?.absent}</p>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="card p-3.5 md:p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                            <h3 className="text-base md:text-base font-bold text-gray-900">
                                {format(currentMonth, 'MMMM yyyy')}
                            </h3>
                            <div className="flex gap-1">
                                <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors">
                                    <ChevronLeft size={18} className="text-gray-500 md:w-5 md:h-5" />
                                </button>
                                <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors">
                                    <ChevronRight size={18} className="text-gray-500 md:w-5 md:h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-1.5">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-center text-[11px] md:text-xs font-semibold text-gray-400 py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for start of month */}
                            {[...Array(startOfMonth(currentMonth).getDay())].map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square"></div>
                            ))}

                            {calendarDays.map((day, i) => {
                                let bgColor = 'bg-transparent'
                                let textColor = 'text-gray-700'
                                let ringColor = ''

                                if (day.status === 'present') {
                                    bgColor = 'bg-green-100'
                                    textColor = 'text-green-700'
                                } else if (day.status === 'late') {
                                    bgColor = 'bg-amber-100'
                                    textColor = 'text-amber-700'
                                } else if (day.status === 'absent') {
                                    bgColor = 'bg-red-200'
                                    textColor = 'text-red-800 font-bold'
                                }

                                if (isToday(day.date)) {
                                    ringColor = 'ring-2 ring-[var(--primary)] ring-offset-1'
                                }

                                return (
                                    <div
                                        key={i}
                                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs md:text-sm font-medium transition-all cursor-default ${bgColor} ${textColor} ${ringColor} hover:opacity-80`}
                                        title={day.status ? `${format(day.date, 'MMM d')}: ${day.status}` : format(day.date, 'MMM d')}
                                    >
                                        <span>{format(day.date, 'd')}</span>
                                        {day.records.length > 0 && (
                                            <div className="flex gap-0.5 mt-0.5">
                                                {day.records.map((r, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`w-1 h-1 md:w-1 md:h-1 rounded-full ${r.status === 'present' ? 'bg-green-500' :
                                                            r.status === 'late' ? 'bg-amber-500' : 'bg-red-500'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex justify-center gap-4 md:gap-4 mt-3 md:mt-4 text-[11px] md:text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 md:w-2 md:h-2 rounded-full bg-green-500"></div> Present
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 md:w-2 md:h-2 rounded-full bg-amber-500"></div> Late
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 md:w-2 md:h-2 rounded-full bg-red-500"></div> Absent
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed History List */}
                <div className="lg:col-span-2">
                    <div className="card shadow-sm">
                        <div className="p-3.5 md:p-4 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-xl z-20">
                            <h3 className="font-bold text-sm md:text-base text-gray-900 flex items-center gap-2">
                                <Clock size={16} className="md:w-[18px] md:h-[18px]" />
                                Recent Activity
                            </h3>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="text-xs md:text-sm border-gray-200 rounded-lg focus:ring-[var(--primary)] focus:border-[var(--primary)] py-1.5 pl-2 pr-7 md:pr-8 h-8 md:h-auto"
                            >
                                <option value="all">All Records</option>
                                <option value="present">Present Only</option>
                                <option value="late">Late Only</option>
                                <option value="absent">Absent Only</option>
                            </select>
                        </div>

                        <div className="divide-y max-h-[400px] md:max-h-[600px] overflow-y-auto">
                            {filteredHistory.length === 0 ? (
                                <div className="p-6 md:p-8 text-center text-gray-500">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Filter size={18} className="text-gray-400 md:w-5 md:h-5" />
                                    </div>
                                    <p className="text-sm md:text-base">No attendance records found</p>
                                </div>
                            ) : (
                                filteredHistory.map((record) => (
                                    <div key={record._id} className="p-3.5 md:p-4 hover:bg-gray-50 active:bg-gray-50 transition-colors flex items-start gap-3 md:gap-4">
                                        <div className={`mt-0.5 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${record.status === 'present' ? 'bg-green-100 text-green-600' :
                                            record.status === 'late' ? 'bg-amber-100 text-amber-600' :
                                                'bg-red-100 text-red-600'
                                            }`}>
                                            {record.status === 'present' ? <CheckCircle size={16} className="md:w-5 md:h-5" /> :
                                                record.status === 'late' ? <Clock size={16} className="md:w-5 md:h-5" /> :
                                                    <XCircle size={16} className="md:w-5 md:h-5" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-bold text-sm md:text-base text-gray-900">
                                                        {record.type === 'class'
                                                            ? `Class ${record.class || 'Unknown'}`
                                                            : (record.testId?.testName || 'Test Attendance')}
                                                    </p>
                                                    <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                                                        {format(parseISO(record.date), 'EEE, MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold capitalize whitespace-nowrap ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                                                    record.status === 'late' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </div>

                                            {record.notes && (
                                                <p className="mt-2 text-xs md:text-sm text-gray-600 bg-gray-50 p-2 md:p-2 rounded-lg border border-gray-100">
                                                    {record.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AttendanceHistory
