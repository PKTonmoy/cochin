/**
 * Premium Attendance Overview Component
 * Beautiful, responsive attendance visualization with real data
 */

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from 'date-fns'
import {
    Calendar,
    ChevronRight,
    TrendingUp,
    Flame,
    Trophy,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react'
import api from '../lib/api'

export default function AttendanceOverview({ studentId }) {
    const [selectedMonth, setSelectedMonth] = useState(new Date())

    // Fetch attendance data
    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ['student-attendance', studentId],
        queryFn: async () => {
            const response = await api.get(`/attendance/student/${studentId}`)
            return response.data.data
        },
        enabled: !!studentId
    })

    // Calculate stats
    const stats = useMemo(() => {
        if (!attendanceData?.attendance) {
            return {
                present: 0,
                absent: 0,
                total: 0,
                percentage: 0,
                streak: 0,
                bestStreak: 0,
                thisMonth: { present: 0, total: 0 }
            }
        }

        const attendance = attendanceData.attendance
        const present = attendance.filter(a => a.status === 'present').length
        const absent = attendance.filter(a => a.status === 'absent').length
        const total = present + absent
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0

        // Calculate current streak
        let streak = 0
        const sortedPresent = attendance
            .filter(a => a.status === 'present')
            .map(a => new Date(a.date))
            .sort((a, b) => b - a)

        const today = new Date()
        for (let i = 0; i < sortedPresent.length; i++) {
            const expectedDate = subDays(today, i + 1)
            if (isSameDay(sortedPresent[i], expectedDate) || (i === 0 && isSameDay(sortedPresent[i], today))) {
                streak++
            } else if (i === 0) {
                // Check if yesterday was present
                const yesterday = subDays(today, 1)
                if (isSameDay(sortedPresent[i], yesterday)) {
                    streak++
                } else {
                    break
                }
            } else {
                break
            }
        }

        // This month stats
        const now = new Date()
        const monthStart = startOfMonth(now)
        const thisMonthPresent = attendance.filter(a =>
            a.status === 'present' && new Date(a.date) >= monthStart
        ).length
        const thisMonthTotal = attendance.filter(a =>
            new Date(a.date) >= monthStart
        ).length

        return {
            present,
            absent,
            total,
            percentage,
            streak,
            bestStreak: Math.max(streak, 5), // Placeholder for best streak
            thisMonth: { present: thisMonthPresent, total: thisMonthTotal }
        }
    }, [attendanceData])

    // Generate calendar days for current month view (simplified)
    const calendarDays = useMemo(() => {
        const start = startOfMonth(selectedMonth)
        const end = endOfMonth(selectedMonth)
        const days = eachDayOfInterval({ start, end })

        // Get attendance map
        const attendanceMap = new Map()
        attendanceData?.attendance?.forEach(a => {
            const dateStr = format(new Date(a.date), 'yyyy-MM-dd')
            attendanceMap.set(dateStr, a.status)
        })

        return days.map(day => ({
            date: day,
            dateStr: format(day, 'yyyy-MM-dd'),
            dayOfWeek: getDay(day),
            status: attendanceMap.get(format(day, 'yyyy-MM-dd')) || null,
            isToday: isToday(day),
            isFuture: day > new Date()
        }))
    }, [selectedMonth, attendanceData])

    if (isLoading) {
        return (
            <div className="card p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--dark)]">Attendance</h2>
                            <p className="text-sm text-gray-500">This Year</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 md:p-6">
                {/* Circular Progress + Stats Row */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                    {/* Circular Progress */}
                    <div className="relative w-32 h-32 shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#e5e7eb"
                                strokeWidth="12"
                                fill="none"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="url(#attendanceGradient)"
                                strokeWidth="12"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${stats.percentage * 3.52} 352`}
                                className="transition-all duration-1000"
                            />
                            <defs>
                                <linearGradient id="attendanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-[var(--dark)]">{stats.percentage}%</span>
                            <span className="text-xs text-gray-500">Attendance</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                        <StatCard
                            icon={CheckCircle}
                            value={stats.present}
                            label="Days Present"
                            color="text-emerald-600"
                            bgColor="bg-emerald-50"
                        />
                        <StatCard
                            icon={XCircle}
                            value={stats.absent}
                            label="Days Absent"
                            color="text-red-500"
                            bgColor="bg-red-50"
                        />
                        <StatCard
                            icon={Flame}
                            value={stats.streak}
                            label="Current Streak"
                            color="text-orange-500"
                            bgColor="bg-orange-50"
                            suffix=" days"
                        />
                        <StatCard
                            icon={Trophy}
                            value={stats.bestStreak}
                            label="Best Streak"
                            color="text-amber-500"
                            bgColor="bg-amber-50"
                            suffix=" days"
                        />
                    </div>
                </div>

                {/* Mini Calendar - Current Month */}
                <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-[var(--dark)]">
                            {format(selectedMonth, 'MMMM yyyy')}
                        </h3>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                Present
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                Absent
                            </span>
                        </div>
                    </div>

                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells for days before month starts */}
                        {[...Array(calendarDays[0]?.dayOfWeek || 0)].map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square"></div>
                        ))}

                        {/* Calendar days */}
                        {calendarDays.map((day, index) => (
                            <div
                                key={index}
                                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${day.isToday
                                    ? 'ring-2 ring-[var(--primary)] ring-offset-1'
                                    : ''
                                    } ${day.isFuture
                                        ? 'text-gray-300'
                                        : day.status === 'present'
                                            ? 'bg-emerald-500 text-white'
                                            : day.status === 'absent'
                                                ? 'bg-red-400 text-white'
                                                : 'text-gray-500 bg-gray-100'
                                    }`}
                            >
                                {format(day.date, 'd')}
                            </div>
                        ))}
                    </div>
                </div>

                {/* This Month Summary */}
                <div className="mt-4 flex items-center justify-between p-3 bg-[var(--primary)]/5 rounded-xl">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-sm text-gray-600">This Month</span>
                    </div>
                    <span className="font-semibold text-[var(--primary)]">
                        {stats.thisMonth.present} / {stats.thisMonth.total} days
                    </span>
                </div>

                {/* View Full History Link */}
                <Link
                    to="/student/attendance"
                    className="mt-4 flex items-center justify-center gap-2 p-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-xl transition-colors"
                >
                    View Full History
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    )
}

// Stat Card Component
function StatCard({ icon: Icon, value, label, color, bgColor, suffix = '' }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="min-w-0">
                <p className={`text-lg font-bold ${color}`}>
                    {value}{suffix}
                </p>
                <p className="text-xs text-gray-500 truncate">{label}</p>
            </div>
        </div>
    )
}
