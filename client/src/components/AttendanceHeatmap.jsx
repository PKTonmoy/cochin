/**
 * AttendanceHeatmap Component
 * GitHub-style contribution graph for attendance visualization
 */

import { useState, useMemo } from 'react'
import { format, subDays, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'

export default function AttendanceHeatmap({ attendanceData = [], year = new Date().getFullYear() }) {
    const [hoveredDay, setHoveredDay] = useState(null)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

    // Generate calendar data for the year
    const calendarData = useMemo(() => {
        const today = new Date()
        const startDate = new Date(year, 0, 1)
        const endDate = new Date(year, 11, 31)

        // Find the first Sunday before or on start date
        const firstSunday = startOfWeek(startDate, { weekStartsOn: 0 })

        const weeks = []
        let currentDate = firstSunday
        let currentWeek = []

        while (currentDate <= endDate || currentWeek.length > 0) {
            const dayOfWeek = currentDate.getDay()

            if (dayOfWeek === 0 && currentWeek.length > 0) {
                weeks.push(currentWeek)
                currentWeek = []
            }

            if (currentDate <= endDate) {
                const dateStr = format(currentDate, 'yyyy-MM-dd')
                const attendance = attendanceData.find(a => a.date === dateStr)

                currentWeek.push({
                    date: currentDate,
                    dateStr,
                    isCurrentYear: currentDate >= startDate && currentDate <= endDate,
                    isFuture: currentDate > today,
                    status: attendance?.status || null,
                    level: attendance?.level || 0,
                    notes: attendance?.notes || null
                })
            }

            currentDate = addDays(currentDate, 1)

            if (currentDate > endDate && currentWeek.length === 7) {
                weeks.push(currentWeek)
                break
            }
        }

        if (currentWeek.length > 0 && currentWeek.length < 7) {
            weeks.push(currentWeek)
        }

        return weeks
    }, [year, attendanceData])

    // Calculate stats
    const stats = useMemo(() => {
        const today = new Date()
        const presentDays = attendanceData.filter(a => a.status === 'present').length
        const absentDays = attendanceData.filter(a => a.status === 'absent').length
        const totalDays = presentDays + absentDays
        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

        // Calculate streaks
        let currentStreak = 0
        let longestStreak = 0
        let tempStreak = 0

        const sortedData = [...attendanceData]
            .filter(a => a.status === 'present')
            .map(a => parseISO(a.date))
            .sort((a, b) => b - a)

        for (let i = 0; i < sortedData.length; i++) {
            if (i === 0) {
                const diffFromToday = Math.floor((today - sortedData[i]) / (1000 * 60 * 60 * 24))
                if (diffFromToday <= 1) {
                    currentStreak = 1
                    tempStreak = 1
                }
            } else {
                const diff = Math.floor((sortedData[i - 1] - sortedData[i]) / (1000 * 60 * 60 * 24))
                if (diff === 1) {
                    tempStreak++
                    if (i < 30) currentStreak = tempStreak
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak)
                    tempStreak = 1
                }
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak)

        return { presentDays, absentDays, totalDays, percentage, currentStreak, longestStreak }
    }, [attendanceData])

    const getLevelColor = (level, status, isFuture, isCurrentYear) => {
        if (!isCurrentYear) return 'bg-transparent'
        if (isFuture) return 'bg-gray-800/30'
        if (status === 'absent') return 'bg-red-900/40'
        if (!status) return 'bg-gray-800/50'

        const colors = {
            1: 'bg-emerald-900/60',
            2: 'bg-emerald-700/70',
            3: 'bg-emerald-500/80',
            4: 'bg-emerald-400'
        }
        return colors[level] || 'bg-gray-800/50'
    }

    const handleMouseEnter = (day, e) => {
        if (!day.isCurrentYear || day.isFuture) return
        const rect = e.target.getBoundingClientRect()
        setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 })
        setHoveredDay(day)
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className="attendance-heatmap">
            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
                    <span className="text-sm text-gray-400">
                        <span className="font-bold text-white">{stats.presentDays}</span> days present
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-red-900/60"></div>
                    <span className="text-sm text-gray-400">
                        <span className="font-bold text-white">{stats.absentDays}</span> days absent
                    </span>
                </div>
                <div className="text-sm text-gray-400">
                    <span className="font-bold text-emerald-400">{stats.percentage}%</span> attendance
                </div>
                <div className="text-sm text-gray-400">
                    🔥 <span className="font-bold text-orange-400">{stats.currentStreak}</span> day streak
                </div>
                <div className="text-sm text-gray-400">
                    🏆 Best: <span className="font-bold text-yellow-400">{stats.longestStreak}</span> days
                </div>
            </div>

            {/* Month Labels */}
            <div className="flex mb-2 pl-8">
                {months.map((month, i) => (
                    <div key={month} className="text-xs text-gray-500" style={{ width: `${100 / 12}%` }}>
                        {month}
                    </div>
                ))}
            </div>

            {/* Heatmap Grid */}
            <div className="flex gap-1">
                {/* Day Labels */}
                <div className="flex flex-col gap-[3px] pr-2">
                    {days.map((day, i) => (
                        <div key={day} className="h-[12px] text-[10px] text-gray-500 flex items-center">
                            {i % 2 === 1 ? day.charAt(0) : ''}
                        </div>
                    ))}
                </div>

                {/* Weeks */}
                <div className="flex gap-[3px] overflow-x-auto pb-2">
                    {calendarData.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-[3px]">
                            {week.map((day, dayIndex) => (
                                <div
                                    key={dayIndex}
                                    className={`w-[12px] h-[12px] rounded-sm cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-white/30 ${getLevelColor(day.level, day.status, day.isFuture, day.isCurrentYear)}`}
                                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <span>Less</span>
                <div className="w-[12px] h-[12px] rounded-sm bg-gray-800/50"></div>
                <div className="w-[12px] h-[12px] rounded-sm bg-emerald-900/60"></div>
                <div className="w-[12px] h-[12px] rounded-sm bg-emerald-700/70"></div>
                <div className="w-[12px] h-[12px] rounded-sm bg-emerald-500/80"></div>
                <div className="w-[12px] h-[12px] rounded-sm bg-emerald-400"></div>
                <span>More</span>
            </div>

            {/* Tooltip */}
            {hoveredDay && (
                <div
                    className="fixed z-50 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
                >
                    <div className="font-medium text-white">
                        {format(hoveredDay.date, 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className={`text-xs mt-1 ${hoveredDay.status === 'present' ? 'text-emerald-400' :
                            hoveredDay.status === 'absent' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                        {hoveredDay.status === 'present' ? '✓ Present' :
                            hoveredDay.status === 'absent' ? '✗ Absent' : 'No class'}
                    </div>
                    {hoveredDay.notes && (
                        <div className="text-xs text-gray-400 mt-1">{hoveredDay.notes}</div>
                    )}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                        <div className="border-8 border-transparent border-t-gray-900"></div>
                    </div>
                </div>
            )}
        </div>
    )
}
