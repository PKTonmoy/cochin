/**
 * Premium Student Attendance Dashboard
 * 
 * Features:
 * - Quick stats with animated progress ring
 * - Interactive color-coded calendar (present/absent/late/pending/future)
 * - SVG bar chart for monthly attendance trends
 * - SVG donut chart for class vs test breakdown
 * - Filterable attendance list with deduplication (same-day class+test = 1 count)
 * - Auto-absent logic for past dates without admin records
 * - Export as detailed PDF report
 * - Attendance alert banner when below 75%
 * - Fully responsive mobile layout
 */

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import {
    Calendar as CalendarIcon,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    BarChart3,
    TrendingUp,
    TrendingDown,
    Filter,
    ChevronLeft,
    ChevronRight,
    Flame,
    Award,
    Download,
    AlertTriangle,
    BookOpen,
    FileText,
    ChevronDown,
    ChevronUp,
    Target,
    Users,
    PieChart
} from 'lucide-react'
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
    isToday,
    isBefore,
    startOfDay,
    getMonth,
    getYear,
    isAfter,
    endOfDay
} from 'date-fns'
import AttendanceSkeleton from '../../components/skeletons/AttendanceSkeleton'

// ─── Attendance Threshold ───────────────────────────────────────────
const ATTENDANCE_THRESHOLD = 75

// ─── Circular Progress Ring Component ───────────────────────────────
const ProgressRing = ({ percentage, size = 80, strokeWidth = 6, color = 'var(--primary)' }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-gray-100"
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
            />
        </svg>
    )
}

// ─── SVG Mini Bar Chart (Monthly Trends) ────────────────────────────
const MonthlyTrendChart = ({ monthlyData }) => {
    const [hoveredBar, setHoveredBar] = useState(null)
    const maxVal = Math.max(...monthlyData.map(m => m.percentage), 1)
    const barWidth = 32
    const chartHeight = 140
    const gap = 8

    return (
        <div className="relative overflow-x-auto pb-2">
            <svg
                width={Math.max(monthlyData.length * (barWidth + gap), 200)}
                height={chartHeight + 40}
                className="mx-auto block"
                role="img"
                aria-label="Monthly attendance trend chart"
            >
                {monthlyData.map((month, i) => {
                    const barHeight = (month.percentage / 100) * chartHeight
                    const x = i * (barWidth + gap) + gap
                    const y = chartHeight - barHeight
                    const isHovered = hoveredBar === i

                    return (
                        <g key={month.label}
                            onMouseEnter={() => setHoveredBar(i)}
                            onMouseLeave={() => setHoveredBar(null)}
                            className="cursor-pointer"
                        >
                            {/* Background bar */}
                            <rect
                                x={x}
                                y={0}
                                width={barWidth}
                                height={chartHeight}
                                rx={6}
                                fill="#f1f5f9"
                            />
                            {/* Value bar */}
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                rx={6}
                                fill={month.percentage >= ATTENDANCE_THRESHOLD
                                    ? (isHovered ? 'var(--primary-dark)' : 'var(--primary)')
                                    : (isHovered ? '#dc2626' : '#ef4444')
                                }
                                className="transition-all duration-300"
                                opacity={isHovered ? 1 : 0.85}
                            />
                            {/* Percentage label on hover */}
                            {isHovered && (
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 8}
                                    textAnchor="middle"
                                    className="text-xs font-bold fill-gray-700"
                                    fontSize="11"
                                >
                                    {month.percentage}%
                                </text>
                            )}
                            {/* Month label */}
                            <text
                                x={x + barWidth / 2}
                                y={chartHeight + 18}
                                textAnchor="middle"
                                className="fill-gray-400"
                                fontSize="11"
                                fontWeight="500"
                            >
                                {month.label}
                            </text>
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}

// ─── SVG Donut Chart (Class vs Test breakdown) ──────────────────────
const DonutChart = ({ classCount, testCount }) => {
    const total = classCount + testCount
    if (total === 0) return null

    const classPerc = (classCount / total) * 100
    const testPerc = (testCount / total) * 100
    const radius = 50
    const circumference = 2 * Math.PI * radius
    const classOffset = circumference - (classPerc / 100) * circumference
    const testArcLength = (testPerc / 100) * circumference

    return (
        <div className="flex items-center justify-center gap-6">
            <div className="relative">
                <svg width={120} height={120} className="transform -rotate-90">
                    {/* Class arc */}
                    <circle
                        cx={60} cy={60} r={radius}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth={12}
                        strokeDasharray={circumference}
                        strokeDashoffset={classOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                    />
                    {/* Test arc */}
                    <circle
                        cx={60} cy={60} r={radius}
                        fill="none"
                        stroke="var(--secondary)"
                        strokeWidth={12}
                        strokeDasharray={`${testArcLength} ${circumference - testArcLength}`}
                        strokeDashoffset={-((classPerc / 100) * circumference)}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-800">{total}</span>
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--primary)]" />
                    <span className="text-sm text-gray-600">Classes</span>
                    <span className="text-sm font-bold text-gray-800 ml-auto">{classCount}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--secondary)]" />
                    <span className="text-sm text-gray-600">Tests</span>
                    <span className="text-sm font-bold text-gray-800 ml-auto">{testCount}</span>
                </div>
            </div>
        </div>
    )
}

// ─── Main Dashboard Component ───────────────────────────────────────
const AttendanceHistory = () => {
    const { user } = useAuth()
    const { settings } = useSettings()
    const siteName = settings?.siteInfo?.name || 'Institute'
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [filter, setFilter] = useState('all')
    const [selectedDay, setSelectedDay] = useState(null)
    const [expandedRecord, setExpandedRecord] = useState(null)

    // Fetch attendance data
    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ['student-attendance-history', user?.id],
        queryFn: async () => {
            const response = await api.get(`/attendance/student/${user?.id}?limit=500`)
            return response.data.data.attendance || []
        },
        enabled: !!user?.id,
        refetchOnMount: 'always'
    })

    // ─── Core Attendance Logic ──────────────────────────────────────
    // Deduplication: class + test on same date = 1 attendance entry
    // Auto-absent: past dates with no record shown as pending
    const {
        stats,
        calendarDays,
        streaks,
        monthlyTrend,
        typeBreakdown,
        effectiveRecords
    } = useMemo(() => {
        if (!attendanceData) return {
            stats: null, calendarDays: [], streaks: { current: 0, best: 0 },
            monthlyTrend: [], typeBreakdown: { classes: 0, tests: 0 }, effectiveRecords: []
        }

        // ── Step 1: Group records by date for deduplication ──
        // If a class AND test occur on the same date, count as 1 attendance entry
        const dateMap = new Map()
        attendanceData.forEach(record => {
            const dateKey = format(parseISO(record.date), 'yyyy-MM-dd')
            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, {
                    date: dateKey,
                    records: [],
                    types: new Set(),
                    // For the effective entry, use the "worst" status across events
                    // absent > late > present
                    effectiveStatus: 'present',
                    autoMarked: false
                })
            }
            const entry = dateMap.get(dateKey)
            entry.records.push(record)
            entry.types.add(record.type)

            // Determine effective status (worst status wins)
            if (record.status === 'absent') {
                entry.effectiveStatus = 'absent'
            } else if (record.status === 'late' && entry.effectiveStatus !== 'absent') {
                entry.effectiveStatus = 'late'
            }
        })

        // Build effective records (deduplicated by date)
        const effective = Array.from(dateMap.values()).sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        )

        // ── Step 2: Calculate Stats ──
        const totalEffective = effective.length
        const presentDays = effective.filter(
            e => e.effectiveStatus === 'present' || e.effectiveStatus === 'late'
        ).length
        const absentDays = effective.filter(e => e.effectiveStatus === 'absent').length
        const lateDays = effective.filter(e => e.effectiveStatus === 'late').length
        const percentage = totalEffective > 0
            ? Math.round((presentDays / totalEffective) * 100)
            : 0

        // ── Step 3: Calculate Streaks ──
        let currentStreak = 0
        let bestStreak = 0
        let tempStreak = 0

        for (const entry of effective) {
            if (entry.effectiveStatus === 'present' || entry.effectiveStatus === 'late') {
                currentStreak++
            } else {
                break
            }
        }

        for (const entry of effective) {
            if (entry.effectiveStatus === 'present' || entry.effectiveStatus === 'late') {
                tempStreak++
            } else {
                bestStreak = Math.max(bestStreak, tempStreak)
                tempStreak = 0
            }
        }
        bestStreak = Math.max(bestStreak, tempStreak)

        // ── Step 4: Calendar days for selected month ──
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
        const today = startOfDay(new Date())

        const days = daysInMonth.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd')
            const entry = dateMap.get(dateKey)
            const isFuture = isAfter(startOfDay(date), today)
            const isPast = isBefore(startOfDay(date), today)

            let status = null
            let records = []

            if (entry) {
                status = entry.effectiveStatus
                records = entry.records
            } else if (isPast && !isFuture) {
                // Auto-absent: past date with no record = pending
                // (admin hasn't updated yet)
                status = 'pending'
            }

            return {
                date,
                dateKey,
                status,
                records,
                isFuture,
                types: entry?.types || new Set()
            }
        })

        // ── Step 5: Monthly Trend (last 6 months) ──
        const trend = []
        for (let i = 5; i >= 0; i--) {
            const m = subMonths(new Date(), i)
            const mMonth = getMonth(m)
            const mYear = getYear(m)
            const monthEntries = effective.filter(e => {
                const d = new Date(e.date)
                return getMonth(d) === mMonth && getYear(d) === mYear
            })
            const monthPresent = monthEntries.filter(
                e => e.effectiveStatus === 'present' || e.effectiveStatus === 'late'
            ).length
            const monthTotal = monthEntries.length

            trend.push({
                label: format(m, 'MMM'),
                month: mMonth,
                year: mYear,
                present: monthPresent,
                total: monthTotal,
                percentage: monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 0
            })
        }

        // ── Step 6: Type Breakdown ──
        const classRecords = attendanceData.filter(r => r.type === 'class')
        const testRecords = attendanceData.filter(r => r.type === 'test')

        return {
            stats: {
                total: totalEffective,
                present: presentDays,
                absent: absentDays,
                late: lateDays,
                percentage,
                rawTotal: attendanceData.length
            },
            calendarDays: days,
            streaks: { current: currentStreak, best: bestStreak },
            monthlyTrend: trend,
            typeBreakdown: { classes: classRecords.length, tests: testRecords.length },
            effectiveRecords: effective
        }
    }, [attendanceData, currentMonth])

    // ─── Filtered History ───────────────────────────────────────────
    const filteredHistory = useMemo(() => {
        if (!effectiveRecords) return []
        return effectiveRecords.filter(item => {
            if (filter === 'all') return true
            return item.effectiveStatus === filter
        })
    }, [effectiveRecords, filter])

    // ─── Navigation ─────────────────────────────────────────────────
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    // ─── PDF Export ──────────────────────────────────────────────────
    const handleExport = useCallback(() => {
        if (!attendanceData?.length || !stats) return

        const doc = new jsPDF('p', 'mm', 'a4')
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 16
        const centerX = pageWidth / 2
        let y = 0

        // ── Colors ──
        const primary = [37, 99, 235]
        const darkText = [15, 23, 42]
        const bodyText = [51, 65, 85]
        const mutedText = [100, 116, 139]
        const lightBg = [248, 250, 252]
        const greenBg = [220, 252, 231]
        const greenText = [21, 128, 61]
        const redBg = [254, 226, 226]
        const redText = [185, 28, 28]
        const amberBg = [254, 243, 199]
        const amberText = [180, 83, 9]

        // ── Compact Header Banner ──
        doc.setFillColor(...primary)
        doc.rect(0, 0, pageWidth, 40, 'F')

        // Institution name — centered
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text(siteName, centerX, 12, { align: 'center' })

        // Subtitle — centered
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('Attendance Report', centerX, 20, { align: 'center' })

        // Student name — centered
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`${user?.name || 'Student'}`, centerX, 29, { align: 'center' })

        // Roll & class — centered
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(220, 225, 240)
        const studentMeta = `Roll: ${user?.roll || 'N/A'}  |  Class: ${user?.class || 'N/A'}${user?.section ? ` (${user.section})` : ''}`
        doc.text(studentMeta, centerX, 36, { align: 'center' })

        // Generated date — below header
        doc.setFontSize(8)
        doc.setTextColor(...mutedText)
        doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, centerX, 48, { align: 'center' })

        y = 54

        // ── Summary Statistics Box ──
        const boxWidth = pageWidth - 2 * margin
        doc.setDrawColor(220, 225, 235)
        doc.setFillColor(...lightBg)
        doc.roundedRect(margin, y, boxWidth, 28, 3, 3, 'FD')

        const statCount = 4
        const statBoxW = boxWidth / statCount
        const summaryStats = [
            { label: 'TOTAL SESSIONS', value: String(stats.total) },
            { label: 'PRESENT', value: String(stats.present) },
            { label: 'ABSENT', value: String(stats.absent) },
            { label: 'ATTENDANCE', value: `${stats.percentage}%` }
        ]

        summaryStats.forEach((stat, i) => {
            const x = margin + i * statBoxW + statBoxW / 2

            doc.setTextColor(...darkText)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text(stat.value, x, y + 12, { align: 'center' })

            doc.setTextColor(...mutedText)
            doc.setFontSize(6.5)
            doc.setFont('helvetica', 'normal')
            doc.text(stat.label, x, y + 20, { align: 'center' })

            // Vertical divider between stats (not after last)
            if (i < statCount - 1) {
                doc.setDrawColor(210, 215, 225)
                doc.setLineWidth(0.3)
                doc.line(margin + (i + 1) * statBoxW, y + 5, margin + (i + 1) * statBoxW, y + 23)
            }
        })

        y += 36

        // ── Attendance Alert ──
        if (stats.percentage < ATTENDANCE_THRESHOLD) {
            doc.setFillColor(254, 242, 242)
            doc.setDrawColor(252, 165, 165)
            doc.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, 'FD')
            doc.setTextColor(...redText)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bold')
            doc.text(`Warning: Attendance is below ${ATTENDANCE_THRESHOLD}% threshold (currently ${stats.percentage}%)`, margin + 4, y + 6.5)
            y += 16
        }

        // ── Calendar-Style Helper Functions ──
        const PAGE_W = pageWidth
        const CONTENT_W = PAGE_W - 2 * margin
        const CELL_W = CONTENT_W / 7
        const CELL_H = 14
        const DAY_HDRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December']

        const checkPgBreak = (curY, needed = 40) => {
            const ph = doc.internal.pageSize.getHeight()
            if (curY + needed > ph - 25) { doc.addPage(); return 20 }
            return curY
        }

        const drawCalMonth = (yr, mo, attMap, startY) => {
            const firstD = new Date(yr, mo, 1)
            const dimMonth = new Date(yr, mo + 1, 0).getDate()
            const startDow = firstD.getDay()
            const todayD = new Date(); todayD.setHours(0, 0, 0, 0)
            const totalRows = Math.ceil((startDow + dimMonth) / 7)
            const calH = 10 + 8 + (totalRows * CELL_H) + 4

            let cy = checkPgBreak(startY, calH)

            // Month title bar
            doc.setFillColor(...primary)
            doc.roundedRect(margin, cy, CONTENT_W, 9, 1.5, 1.5, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.text(`${MONTH_NAMES[mo]} ${yr}`, margin + 4, cy + 6.5)

            // Month stats
            let mP = 0, mA = 0, mL = 0
            for (let d = 1; d <= dimMonth; d++) {
                const k = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const s = attMap[k]
                if (s === 'present') mP++
                else if (s === 'absent') mA++
                else if (s === 'late') mL++
            }
            const mT = mP + mA + mL
            const mR = mT > 0 ? Math.round((mP / mT) * 100) : 0
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.text(`P:${mP}  A:${mA}  L:${mL}  Rate:${mR}%`, PAGE_W - margin - 4, cy + 6.5, { align: 'right' })
            cy += 11

            // Day headers
            doc.setFillColor(...lightBg)
            doc.rect(margin, cy, CONTENT_W, 7, 'F')
            doc.setFontSize(6.5)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...mutedText)
            DAY_HDRS.forEach((dh, i) => {
                doc.text(dh, margin + (i * CELL_W) + CELL_W / 2, cy + 5, { align: 'center' })
            })
            cy += 8

            // Day cells
            let dn = 1
            for (let row = 0; row < totalRows; row++) {
                for (let col = 0; col < 7; col++) {
                    const cx = margin + col * CELL_W
                    const cellY = cy + row * CELL_H

                    doc.setDrawColor(230, 233, 240)
                    doc.setLineWidth(0.2)
                    doc.rect(cx, cellY, CELL_W, CELL_H, 'S')

                    if ((row === 0 && col < startDow) || dn > dimMonth) {
                        doc.setFillColor(250, 250, 250)
                        doc.rect(cx + 0.3, cellY + 0.3, CELL_W - 0.6, CELL_H - 0.6, 'F')
                        continue
                    }

                    const dk = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(dn).padStart(2, '0')}`
                    const cd = new Date(yr, mo, dn); cd.setHours(0, 0, 0, 0)
                    const isFut = cd > todayD
                    const st = attMap[dk]

                    // Cell fill
                    if (st === 'present') doc.setFillColor(...greenBg)
                    else if (st === 'absent') doc.setFillColor(...redBg)
                    else if (st === 'late') doc.setFillColor(...amberBg)
                    else if (isFut) doc.setFillColor(248, 249, 250)
                    else doc.setFillColor(255, 255, 255)
                    doc.rect(cx + 0.3, cellY + 0.3, CELL_W - 0.6, CELL_H - 0.6, 'F')

                    // Day number
                    doc.setFontSize(7)
                    doc.setFont('helvetica', 'bold')
                    if (st === 'present') doc.setTextColor(...greenText)
                    else if (st === 'absent') doc.setTextColor(...redText)
                    else if (st === 'late') doc.setTextColor(...amberText)
                    else if (isFut) doc.setTextColor(200, 200, 200)
                    else doc.setTextColor(...mutedText)
                    doc.text(String(dn), cx + 3, cellY + 5.5)

                    // Status symbol
                    if (st) {
                        doc.setFontSize(8)
                        doc.setFont('helvetica', 'bold')
                        let sym = ''
                        if (st === 'present') { sym = '✓'; doc.setTextColor(...greenText) }
                        else if (st === 'absent') { sym = '✗'; doc.setTextColor(...redText) }
                        else if (st === 'late') { sym = '~'; doc.setTextColor(...amberText) }
                        doc.text(sym, cx + CELL_W / 2, cellY + CELL_H - 3, { align: 'center' })
                    }

                    dn++
                }
            }

            return cy + totalRows * CELL_H + 6
        }

        // ── Build date→status map ──
        const attMap = {}
        const sortedRecords = [...attendanceData].sort((a, b) => new Date(b.date) - new Date(a.date))
        sortedRecords.forEach(r => {
            const d = parseISO(r.date)
            const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            const ex = attMap[k]
            if (!ex) attMap[k] = r.status
            else if (r.status === 'absent') attMap[k] = 'absent'
            else if (r.status === 'late' && ex !== 'absent') attMap[k] = 'late'
        })

        // ── Section Title ──
        doc.setFillColor(...primary)
        doc.rect(margin, y, 3, 10, 'F')
        doc.setTextColor(...darkText)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Calendar Attendance View', margin + 7, y + 7)
        y += 14

        // ── Color Legend ──
        const legendItems = [
            { label: 'Present', bg: greenBg, text: greenText },
            { label: 'Absent', bg: redBg, text: redText },
            { label: 'Late', bg: amberBg, text: amberText },
            { label: 'No Record', bg: [255, 255, 255], text: mutedText },
        ]
        const legendStartX = margin + (CONTENT_W - legendItems.length * 42) / 2
        legendItems.forEach((item, i) => {
            const lx = legendStartX + i * 42
            doc.setFillColor(...item.bg)
            doc.setDrawColor(230, 233, 240)
            doc.setLineWidth(0.2)
            doc.roundedRect(lx, y, 8, 5, 1, 1, 'FD')
            doc.setFontSize(6.5)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...item.text)
            doc.text(item.label, lx + 10, y + 3.8)
        })
        y += 10

        // ── Determine month range and draw calendars ──
        const allDates = attendanceData.map(r => new Date(r.date))
        const minDate = new Date(Math.min(...allDates))
        const maxDate = new Date(Math.max(...allDates))

        const monthsList = []
        let curM = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
        const endM = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
        while (curM >= endM) {
            monthsList.push({ year: curM.getFullYear(), month: curM.getMonth() })
            curM = new Date(curM.getFullYear(), curM.getMonth() - 1, 1)
        }

        for (const m of monthsList) {
            y = drawCalMonth(m.year, m.month, attMap, y)
        }

        // ── Footer on every page ──
        const totalPages = doc.internal.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i)
            const pH = doc.internal.pageSize.getHeight()

            // Footer separator line
            doc.setDrawColor(220, 225, 235)
            doc.line(margin, pH - 16, pageWidth - margin, pH - 16)

            // Footer text
            doc.setFontSize(7)
            doc.setTextColor(...mutedText)
            doc.setFont('helvetica', 'italic')
            doc.text(`${siteName}  •  Attendance Report  •  Confidential`, margin, pH - 9)
            doc.setFont('helvetica', 'normal')
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pH - 9, { align: 'right' })
        }

        // ── Save ──
        doc.save(`Attendance_${user?.name?.replace(/\s+/g, '_') || 'Student'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    }, [attendanceData, user, stats])

    // ─── Status Helpers ─────────────────────────────────────────────
    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-700' }
            case 'late': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', pill: 'bg-amber-100 text-amber-700' }
            case 'absent': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', pill: 'bg-red-100 text-red-700' }
            case 'pending': return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-400', pill: 'bg-yellow-100 text-yellow-700' }
            default: return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-300', pill: 'bg-gray-100 text-gray-500' }
        }
    }

    const getStatusIcon = (status, size = 16) => {
        switch (status) {
            case 'present': return <CheckCircle size={size} />
            case 'late': return <Clock size={size} />
            case 'absent': return <XCircle size={size} />
            case 'pending': return <AlertCircle size={size} />
            default: return null
        }
    }

    if (isLoading) {
        return <AttendanceSkeleton />
    }

    const belowThreshold = stats?.percentage < ATTENDANCE_THRESHOLD

    return (
        <div className="max-w-7xl mx-auto space-y-5 md:space-y-6 animate-fadeIn px-3 sm:px-4 md:px-0 py-4 md:py-6">

            {/* ─── Premium Header ────────────────────────────────── */}
            <div className="relative mb-2">
                <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-2xl p-6 text-white overflow-hidden relative">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
                    <div className="absolute bottom-0 left-20 w-24 h-24 bg-white/5 rounded-full translate-y-8" />
                    <div className="absolute top-6 right-28 w-16 h-16 bg-white/5 rounded-full hidden md:block" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                <CalendarIcon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Attendance Dashboard</h1>
                                <p className="text-white/70 text-sm mt-0.5">
                                    {stats ? (
                                        <>
                                            <span className="text-white/90 font-medium">{stats.percentage}%</span> overall attendance
                                            {streaks.current > 0 && (
                                                <span className="ml-2">
                                                    • <Flame className="w-3.5 h-3.5 inline text-amber-300" /> {streaks.current} day streak
                                                </span>
                                            )}
                                        </>
                                    ) : 'Track your attendance records & trends'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {stats && (
                                <div className="hidden sm:flex items-center gap-3">
                                    <div className="glass-stat px-3 py-2 rounded-xl text-center">
                                        <div className="text-lg font-bold text-white">{stats.present}</div>
                                        <div className="text-[10px] text-white/60 uppercase tracking-wider">Present</div>
                                    </div>
                                    <div className="glass-stat px-3 py-2 rounded-xl text-center">
                                        <div className="text-lg font-bold text-white">{stats.absent}</div>
                                        <div className="text-[10px] text-white/60 uppercase tracking-wider">Absent</div>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-medium transition-all duration-200"
                            >
                                <Download size={16} />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .glass-stat {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                }
            `}</style>

            {/* ─── Attendance Alert Banner ────────────────────────── */}
            {belowThreshold && stats && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 animate-fadeIn">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={20} className="text-red-500" />
                    </div>
                    <div>
                        <p className="font-semibold text-red-800 text-sm">Attendance Below {ATTENDANCE_THRESHOLD}%</p>
                        <p className="text-xs text-red-600 mt-0.5">
                            Your attendance is at <span className="font-bold">{stats.percentage}%</span>.
                            You need at least {ATTENDANCE_THRESHOLD}% to maintain good standing.
                            Attend {Math.max(0, Math.ceil((ATTENDANCE_THRESHOLD * stats.total / 100) - stats.present))} more sessions to reach the threshold.
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Quick Stats Cards ─────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {/* Overall Percentage */}
                <div className="card p-4 md:p-5 relative overflow-hidden group hover:shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Attendance</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                                {stats?.percentage || 0}%
                            </p>
                            <p className="text-[11px] md:text-xs text-gray-500 mt-1">
                                {stats?.present || 0}/{stats?.total || 0} days
                            </p>
                        </div>
                        <div className="relative">
                            <ProgressRing
                                percentage={stats?.percentage || 0}
                                size={64}
                                strokeWidth={5}
                                color={belowThreshold ? '#ef4444' : 'var(--primary)'}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Target size={18} className={belowThreshold ? 'text-red-500' : 'text-[var(--primary)]'} />
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-[var(--primary)]/5 group-hover:bg-[var(--primary)]/10 transition-colors" />
                </div>

                {/* Present */}
                <div className="card p-4 md:p-5 relative overflow-hidden group hover:shadow-lg">
                    <div>
                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Present</p>
                        <p className="text-2xl md:text-3xl font-bold text-emerald-600 mt-1">{stats?.present || 0}</p>
                        <p className="text-[11px] md:text-xs text-gray-500 mt-1">
                            {stats?.late || 0} late included
                        </p>
                    </div>
                    <CheckCircle className="absolute right-4 bottom-4 text-emerald-100 w-10 h-10 group-hover:text-emerald-200 transition-colors" />
                </div>

                {/* Absent */}
                <div className="card p-4 md:p-5 relative overflow-hidden group hover:shadow-lg">
                    <div>
                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Absent</p>
                        <p className="text-2xl md:text-3xl font-bold text-red-500 mt-1">{stats?.absent || 0}</p>
                        <p className="text-[11px] md:text-xs text-gray-500 mt-1">
                            out of {stats?.total || 0} sessions
                        </p>
                    </div>
                    <XCircle className="absolute right-4 bottom-4 text-red-100 w-10 h-10 group-hover:text-red-200 transition-colors" />
                </div>

                {/* Streak */}
                <div className="card p-4 md:p-5 relative overflow-hidden group hover:shadow-lg border-l-4 border-l-orange-400">
                    <div>
                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Streak</p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-2xl md:text-3xl font-bold text-gray-900">{streaks.current}</span>
                            <span className="text-xs text-gray-400">days</span>
                        </div>
                        <p className="text-[11px] md:text-xs text-orange-600 mt-1">
                            Best: {streaks.best} days
                        </p>
                    </div>
                    <Flame className="absolute right-4 bottom-4 text-orange-100 w-10 h-10 group-hover:text-orange-200 transition-colors" />
                </div>
            </div>

            {/* ─── Main Content Grid ─────────────────────────────── */}
            <div className="grid lg:grid-cols-3 gap-4 md:gap-6">

                {/* ─── Left Column: Calendar + Charts ────────────── */}
                <div className="lg:col-span-1 space-y-4 md:space-y-5">

                    {/* Calendar */}
                    <div className="card p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm md:text-base font-bold text-gray-900">
                                {format(currentMonth, 'MMMM yyyy')}
                            </h3>
                            <div className="flex gap-1">
                                <button
                                    onClick={prevMonth}
                                    className="p-2 hover:bg-gray-100 rounded-xl active:bg-gray-200 transition-colors"
                                    aria-label="Previous month"
                                >
                                    <ChevronLeft size={18} className="text-gray-500" />
                                </button>
                                <button
                                    onClick={nextMonth}
                                    className="p-2 hover:bg-gray-100 rounded-xl active:bg-gray-200 transition-colors"
                                    aria-label="Next month"
                                >
                                    <ChevronRight size={18} className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-1.5">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-center text-[10px] md:text-xs font-semibold text-gray-400 py-1" aria-hidden="true">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for start of month */}
                            {[...Array(startOfMonth(currentMonth).getDay())].map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {calendarDays.map((day, i) => {
                                const colors = getStatusColor(day.status)
                                const isSelected = selectedDay && isSameDay(day.date, selectedDay)
                                const todayClass = isToday(day.date) ? 'ring-2 ring-[var(--primary)] ring-offset-1' : ''
                                const futureClass = day.isFuture ? 'text-gray-300' : ''

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDay(isSelected ? null : day.date)}
                                        className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs md:text-sm font-medium transition-all cursor-pointer
                                            ${day.status ? colors.bg : 'hover:bg-gray-50'}
                                            ${day.status ? colors.text : futureClass || 'text-gray-700'}
                                            ${todayClass}
                                            ${isSelected ? 'ring-2 ring-[var(--primary)] shadow-md scale-105' : ''}
                                            active:scale-95
                                        `}
                                        aria-label={`${format(day.date, 'MMMM d')}: ${day.status || 'no record'}`}
                                    >
                                        <span>{format(day.date, 'd')}</span>
                                        {day.records.length > 0 && (
                                            <div className="flex gap-0.5 mt-0.5">
                                                {day.records.slice(0, 3).map((r, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`w-1 h-1 rounded-full ${getStatusColor(r.status).dot}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {day.status === 'pending' && !day.records.length && (
                                            <div className="w-1 h-1 rounded-full bg-yellow-400 mt-0.5" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-3 mt-4 text-[10px] md:text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Absent
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Pending
                            </div>
                        </div>

                        {/* Selected Day Details */}
                        {selectedDay && (() => {
                            const dayData = calendarDays.find(d => isSameDay(d.date, selectedDay))
                            if (!dayData) return null

                            return (
                                <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
                                    <p className="text-sm font-semibold text-gray-800 mb-2">
                                        {format(selectedDay, 'EEEE, MMM d, yyyy')}
                                    </p>
                                    {dayData.records.length > 0 ? (
                                        <div className="space-y-2">
                                            {dayData.records.map((r, idx) => {
                                                const sc = getStatusColor(r.status)
                                                return (
                                                    <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg ${sc.bg}`}>
                                                        <div className={`${sc.text}`}>{getStatusIcon(r.status, 14)}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-gray-700 truncate">
                                                                {r.type === 'class'
                                                                    ? `Class ${r.class || ''}`
                                                                    : (r.testId?.testName || 'Test')}
                                                            </p>
                                                        </div>
                                                        <span className={`text-[10px] font-bold capitalize px-2 py-0.5 rounded-full ${sc.pill}`}>
                                                            {r.status}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : dayData.status === 'pending' ? (
                                        <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded-lg">
                                            ⏳ No attendance record — pending admin update
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400">No records for this day</p>
                                    )}
                                </div>
                            )
                        })()}
                    </div>

                    {/* Type Breakdown (Donut) */}
                    <div className="card p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <PieChart size={16} className="text-[var(--primary)]" />
                            Attendance Breakdown
                        </h3>
                        {typeBreakdown.classes + typeBreakdown.tests > 0 ? (
                            <DonutChart classCount={typeBreakdown.classes} testCount={typeBreakdown.tests} />
                        ) : (
                            <div className="text-center py-6 text-sm text-gray-400">No data available</div>
                        )}
                    </div>
                </div>

                {/* ─── Right Column: Trend + History ─────────────── */}
                <div className="lg:col-span-2 space-y-4 md:space-y-5">

                    {/* Monthly Trend Chart */}
                    <div className="card p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-2">
                                <BarChart3 size={16} className="text-[var(--primary)]" />
                                Monthly Trends
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-[var(--primary)]" /> ≥{ATTENDANCE_THRESHOLD}%
                                <div className="w-2 h-2 rounded-full bg-red-400 ml-2" /> &lt;{ATTENDANCE_THRESHOLD}%
                            </div>
                        </div>
                        {monthlyTrend.some(m => m.total > 0) ? (
                            <MonthlyTrendChart monthlyData={monthlyTrend} />
                        ) : (
                            <div className="text-center py-8 text-sm text-gray-400">
                                No trend data available yet
                            </div>
                        )}
                    </div>

                    {/* Attendance History List */}
                    <div className="card shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 sticky top-0 bg-white rounded-t-xl z-20">
                            <h3 className="font-bold text-sm md:text-base text-gray-900 flex items-center gap-2">
                                <Clock size={16} className="text-[var(--primary)]" />
                                Attendance Records
                                {filteredHistory.length > 0 && (
                                    <span className="text-xs font-normal text-gray-400 ml-1">
                                        ({filteredHistory.length})
                                    </span>
                                )}
                            </h3>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="text-xs md:text-sm border border-gray-200 rounded-xl focus:ring-[var(--primary)] focus:border-[var(--primary)] py-2 pl-3 pr-8 bg-white shadow-sm"
                                aria-label="Filter attendance by status"
                            >
                                <option value="all">All Records</option>
                                <option value="present">Present Only</option>
                                <option value="late">Late Only</option>
                                <option value="absent">Absent Only</option>
                            </select>
                        </div>

                        <div className="divide-y max-h-[450px] md:max-h-[550px] overflow-y-auto">
                            {filteredHistory.length === 0 ? (
                                <div className="p-8 md:p-12 text-center text-gray-400">
                                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <Filter size={22} className="text-gray-300" />
                                    </div>
                                    <p className="text-sm font-medium">No records found</p>
                                    <p className="text-xs mt-1">Try adjusting your filter</p>
                                </div>
                            ) : (
                                filteredHistory.map((entry, idx) => {
                                    const colors = getStatusColor(entry.effectiveStatus)
                                    const isExpanded = expandedRecord === idx
                                    const hasMultipleRecords = entry.records.length > 1
                                    const typeLabel = entry.types.has('class') && entry.types.has('test')
                                        ? 'Class + Test'
                                        : entry.types.has('test')
                                            ? 'Test'
                                            : 'Class'

                                    return (
                                        <div key={entry.date} className="group">
                                            <div
                                                className={`p-3.5 md:p-4 hover:bg-gray-50 active:bg-gray-50 transition-colors flex items-start gap-3 md:gap-4 ${hasMultipleRecords ? 'cursor-pointer' : ''}`}
                                                onClick={() => hasMultipleRecords && setExpandedRecord(isExpanded ? null : idx)}
                                                role={hasMultipleRecords ? 'button' : undefined}
                                                aria-expanded={hasMultipleRecords ? isExpanded : undefined}
                                            >
                                                {/* Status Icon */}
                                                <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                                                    {getStatusIcon(entry.effectiveStatus, 18)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-semibold text-sm md:text-base text-gray-900">
                                                                {entry.records.length > 0
                                                                    ? (entry.records[0].type === 'class'
                                                                        ? `Class ${entry.records[0].class || ''}`
                                                                        : (entry.records[0].testId?.testName || 'Test'))
                                                                    : 'Session'
                                                                }
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <p className="text-xs text-gray-500">
                                                                    {format(new Date(entry.date), 'EEE, MMM d, yyyy')}
                                                                </p>
                                                                {entry.types.size > 0 && (
                                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
                                                                        {typeLabel}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold capitalize whitespace-nowrap ${colors.pill}`}>
                                                                {entry.effectiveStatus}
                                                            </span>
                                                            {hasMultipleRecords && (
                                                                isExpanded
                                                                    ? <ChevronUp size={14} className="text-gray-400" />
                                                                    : <ChevronDown size={14} className="text-gray-400" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Notes from first record */}
                                                    {entry.records[0]?.notes && !isExpanded && (
                                                        <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 truncate">
                                                            {entry.records[0].notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {isExpanded && hasMultipleRecords && (
                                                <div className="px-4 pb-4 pl-[4.25rem] animate-fadeIn space-y-2">
                                                    {entry.records.map((r, ridx) => {
                                                        const rc = getStatusColor(r.status)
                                                        return (
                                                            <div key={ridx} className={`flex items-center gap-3 p-3 rounded-xl ${rc.bg} border ${rc.border}`}>
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rc.text}`}>
                                                                    {r.type === 'class'
                                                                        ? <BookOpen size={14} />
                                                                        : <FileText size={14} />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-medium text-gray-700">
                                                                        {r.type === 'class'
                                                                            ? `Class ${r.class || ''}`
                                                                            : (r.testId?.testName || 'Test')}
                                                                    </p>
                                                                    {r.notes && <p className="text-[10px] text-gray-500 mt-0.5">{r.notes}</p>}
                                                                </div>
                                                                <span className={`text-[10px] font-bold capitalize px-2 py-0.5 rounded-full ${rc.pill}`}>
                                                                    {r.status}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                    <p className="text-[10px] text-gray-400 italic mt-1">
                                                        * Multiple events on same date count as 1 attendance entry
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AttendanceHistory
