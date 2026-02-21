/**
 * Premium Student Results Page V2
 * Features: Charts, analytics, filtering, responsive, PDF export
 */

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, parseISO } from 'date-fns'
import {
    LineChart, Line, AreaChart, Area, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
    FileText, Award, TrendingUp, TrendingDown, Trophy, Target, Star,
    ChevronRight, ChevronDown, BarChart3, Users, Medal, Sparkles,
    ArrowUp, ArrowDown, ArrowLeft, Download, Share2, Calendar,
    Clock, BookOpen, AlertCircle, GraduationCap, Zap, Search,
    Filter, X
} from 'lucide-react'
import CountUp from 'react-countup'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import api from '../../lib/api'
import ResultsV2Skeleton from '../../components/skeletons/ResultsV2Skeleton'

// Circular progress component
const CircularProgress = ({ value, size = 120, strokeWidth = 8, color = '#3B82F6' }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" strokeWidth={strokeWidth}
                    className="stroke-gray-200"
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" strokeWidth={strokeWidth} stroke={color}
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">
                    <CountUp end={value} duration={1.5} decimals={1} />%
                </span>
            </div>
        </div>
    )
}

// Performance badge
const PerformanceBadge = ({ percentage }) => {
    const config = percentage >= 90 ? { label: 'Excellent', bg: 'bg-emerald-100', text: 'text-emerald-700' }
        : percentage >= 75 ? { label: 'Good', bg: 'bg-blue-100', text: 'text-blue-700' }
            : percentage >= 60 ? { label: 'Average', bg: 'bg-yellow-100', text: 'text-yellow-700' }
                : { label: 'Needs Work', bg: 'bg-red-100', text: 'text-red-700' }

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    )
}

// Grade badge with gradient
const GradeBadge = ({ grade }) => {
    const colors = {
        'A+': 'from-emerald-500 to-green-600',
        'A': 'from-green-500 to-emerald-600',
        'A-': 'from-blue-500 to-indigo-600',
        'B+': 'from-blue-400 to-blue-600',
        'B': 'from-yellow-500 to-amber-600',
        'C': 'from-orange-500 to-amber-600',
        'D': 'from-red-400 to-orange-500',
        'F': 'from-red-500 to-red-700'
    }
    return (
        <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${colors[grade] || 'from-gray-400 to-gray-600'} text-white font-bold text-lg shadow-lg`}>
            {grade}
        </span>
    )
}

export default function StudentResultsV2() {
    const { user } = useAuth()
    const { settings } = useSettings()
    const siteName = settings?.siteInfo?.name || 'Institute'
    const [selectedResult, setSelectedResult] = useState(null)
    const [showMeritList, setShowMeritList] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filters, setFilters] = useState({ subject: '', performance: '', dateRange: 'all' })
    const [showFilters, setShowFilters] = useState(false)

    // Fetch results
    const { data, isLoading } = useQuery({
        queryKey: ['student-results-v2'],
        queryFn: async () => {
            const response = await api.get(`/results/student/${user?.studentId || user?.id}`)
            return response.data.data
        },
        enabled: !!user
    })

    // Fetch detailed result
    const { data: detailedResult, isLoading: loadingDetail } = useQuery({
        queryKey: ['student-result-detail-v2', selectedResult?.testId],
        queryFn: async () => {
            const response = await api.get(`/results/student/${user?.studentId || user?.id}/test/${selectedResult.testId}`)
            return response.data.data
        },
        enabled: !!selectedResult?.testId
    })

    // Calculated stats
    const stats = useMemo(() => {
        const results = data?.filter(i => i.type === 'result') || []
        const count = results.length
        const avg = count > 0 ? results.reduce((sum, r) => sum + (r.data.percentage || 0), 0) / count : 0
        const best = count > 0 ? Math.max(...results.map(r => r.data.percentage || 0)) : 0
        const subjects = {}
        results.forEach(r => {
            if (r.data.subjectMarks) {
                Object.entries(r.data.subjectMarks).forEach(([subj, marks]) => {
                    if (!subjects[subj]) subjects[subj] = { total: 0, count: 0 }
                    subjects[subj].total += marks
                    subjects[subj].count++
                })
            }
        })
        const bestSubject = Object.entries(subjects).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0]?.[0]
        const worstSubject = Object.entries(subjects).sort((a, b) => (a[1].total / a[1].count) - (b[1].total / b[1].count))[0]?.[0]

        return { count, avg, best, bestSubject, worstSubject, results }
    }, [data])

    // Trend data for chart
    const trendData = useMemo(() => {
        return stats.results.slice().reverse().slice(0, 10).map((r, i) => ({
            name: `Test ${i + 1}`,
            score: r.data.percentage,
            date: new Date(r.test?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
    }, [stats.results])

    // Subject radar data
    const subjectData = useMemo(() => {
        const subjects = {}
        stats.results.forEach(r => {
            if (r.data.subjectMarks) {
                Object.entries(r.data.subjectMarks).forEach(([subj, marks]) => {
                    const maxMarks = r.test?.subjects?.find(s => s.name === subj)?.maxMarks || 100
                    if (!subjects[subj]) subjects[subj] = { total: 0, count: 0 }
                    subjects[subj].total += (marks / maxMarks) * 100
                    subjects[subj].count++
                })
            }
        })
        return Object.entries(subjects).map(([subject, data]) => ({
            subject: subject.charAt(0).toUpperCase() + subject.slice(1).replace('_', ' '),
            value: Math.round(data.total / data.count),
            fullMark: 100
        }))
    }, [stats.results])

    // Filtered results
    const filteredResults = useMemo(() => {
        let items = data || []
        if (searchQuery) {
            items = items.filter(i => i.test?.testName?.toLowerCase().includes(searchQuery.toLowerCase()))
        }
        if (filters.performance) {
            items = items.filter(i => {
                if (i.type !== 'result') return false
                const pct = i.data.percentage
                if (filters.performance === 'excellent') return pct >= 90
                if (filters.performance === 'good') return pct >= 75 && pct < 90
                if (filters.performance === 'average') return pct >= 60 && pct < 75
                if (filters.performance === 'poor') return pct < 60
                return true
            })
        }
        return items
    }, [data, searchQuery, filters])

    // ─── PDF Export ──────────────────────────────────────────────────
    const handleExportPDF = useCallback(() => {
        if (!stats?.results?.length) return

        const doc = new jsPDF('p', 'mm', 'a4')
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 16
        const centerX = pageWidth / 2
        let y = 0

        // Color palette
        const primary = [37, 99, 235]         // Rich blue
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
        const blueBg = [219, 234, 254]
        const blueText = [29, 78, 216]

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
        doc.text('Academic Results Report', centerX, 20, { align: 'center' })

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
            { label: 'TESTS TAKEN', value: String(stats.count) },
            { label: 'AVERAGE', value: `${stats.avg.toFixed(1)}%` },
            { label: 'BEST SCORE', value: `${stats.best.toFixed(1)}%` },
            { label: 'BEST SUBJECT', value: (stats.bestSubject?.replace('_', ' ') || '—').toUpperCase() }
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

        // ── Section Title ──
        doc.setFillColor(...primary)
        doc.rect(margin, y, 3, 10, 'F')
        doc.setTextColor(...darkText)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Detailed Test Results', margin + 7, y + 7)
        y += 14

        // ── Results Table ──
        const sortedResults = stats.results.slice().sort((a, b) => new Date(b.test?.date) - new Date(a.test?.date))
        const tableBody = sortedResults.map(item => {
            const r = item.data
            const t = item.test
            const testDate = t?.date ? format(new Date(t.date), 'dd MMM yyyy') : '-'
            const subjects = r.subjectMarks
                ? Object.entries(r.subjectMarks).map(([s, m]) => `${s}: ${m}`).join(', ')
                : '-'
            return [
                testDate,
                t?.testName || '-',
                r.grade || '-',
                `${r.totalMarks || 0}/${r.maxMarks || 0}`,
                `${r.percentage || 0}%`,
                subjects
            ]
        })

        autoTable(doc, {
            startY: y,
            head: [['Date', 'Test Name', 'Grade', 'Marks', '%', 'Subject Breakdown']],
            body: tableBody,
            margin: { left: margin, right: margin },
            styles: {
                fontSize: 7.5,
                cellPadding: 4,
                lineColor: [226, 232, 240],
                lineWidth: 0.3,
                textColor: bodyText,
                font: 'helvetica',
                overflow: 'linebreak'
            },
            headStyles: {
                fillColor: primary,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 5
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { cellWidth: 24 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 22, halign: 'center' },
                3: { cellWidth: 22, halign: 'center' },
                4: { cellWidth: 18, halign: 'center' },
                5: { cellWidth: 'auto', fontSize: 7 }
            },
            // Color-code Grade and Percentage cells
            didParseCell: function (data) {
                if (data.section !== 'body') return
                // Grade column
                if (data.column.index === 2) {
                    const g = data.cell.raw
                    if (g === 'A+' || g === 'A') {
                        data.cell.styles.fillColor = greenBg
                        data.cell.styles.textColor = greenText
                        data.cell.styles.fontStyle = 'bold'
                    } else if (g === 'A-' || g === 'B+' || g === 'B') {
                        data.cell.styles.fillColor = blueBg
                        data.cell.styles.textColor = blueText
                        data.cell.styles.fontStyle = 'bold'
                    } else if (g === 'C' || g === 'D') {
                        data.cell.styles.fillColor = amberBg
                        data.cell.styles.textColor = amberText
                        data.cell.styles.fontStyle = 'bold'
                    } else if (g === 'F') {
                        data.cell.styles.fillColor = redBg
                        data.cell.styles.textColor = redText
                        data.cell.styles.fontStyle = 'bold'
                    }
                }
                // Percentage column
                if (data.column.index === 4) {
                    const pct = parseFloat(data.cell.raw)
                    if (pct >= 90) {
                        data.cell.styles.textColor = greenText
                        data.cell.styles.fontStyle = 'bold'
                    } else if (pct < 60) {
                        data.cell.styles.textColor = redText
                        data.cell.styles.fontStyle = 'bold'
                    }
                }
            }
        })

        // ── Premium Footer on every page ──
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
            doc.text(`${siteName}  •  Academic Results Report  •  Confidential`, margin, pH - 9)
            doc.setFont('helvetica', 'normal')
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pH - 9, { align: 'right' })
        }

        doc.save(`Results_${user?.name?.replace(/\s+/g, '_') || 'Student'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    }, [stats, user, siteName])

    const containerClass = 'bg-gray-50 min-h-screen'

    if (isLoading) {
        return <ResultsV2Skeleton />
    }

    return (
        <div className={containerClass}>
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Results</h1>
                        <p className="text-gray-500 mt-1">Track your academic progress</p>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all shadow-sm active:scale-[0.97]"
                        aria-label="Export results report as PDF"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Export Report</span>
                        <span className="sm:hidden">Export</span>
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <FileText className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900"><CountUp end={stats.count} /></p>
                                <p className="text-sm text-gray-500">Tests Taken</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <TrendingUp className="text-emerald-600" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900"><CountUp end={stats.avg} decimals={1} />%</p>
                                <p className="text-sm text-gray-500">Average Score</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Trophy className="text-amber-600" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900"><CountUp end={stats.best} decimals={1} />%</p>
                                <p className="text-sm text-gray-500">Best Score</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Star className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900 capitalize">{stats.bestSubject?.replace('_', ' ') || '-'}</p>
                                <p className="text-sm text-gray-500">Best Subject</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                {stats.count > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Trend Chart */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-500" />
                                Performance Trend
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                                        <YAxis stroke="#6B7280" fontSize={12} domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#FFF',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="score" stroke="#3B82F6" fill="url(#colorScore)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Subject Radar */}
                        {subjectData.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Target size={20} className="text-purple-500" />
                                    Subject Analysis
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={subjectData}>
                                            <PolarGrid stroke="#E5E7EB" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 11 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} />
                                            <Radar name="Score" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} strokeWidth={2} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Search & Filters */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tests..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filters.performance}
                            onChange={(e) => setFilters(p => ({ ...p, performance: e.target.value }))}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900"
                        >
                            <option value="">All Performance</option>
                            <option value="excellent">Excellent (90%+)</option>
                            <option value="good">Good (75-89%)</option>
                            <option value="average">Average (60-74%)</option>
                            <option value="poor">Needs Work (&lt;60%)</option>
                        </select>
                    </div>
                </div>

                {/* Results List */}
                <div className="space-y-4">
                    {filteredResults.map((item, idx) => {
                        if (item.type === 'result') {
                            const { data: result, test } = item
                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedResult(item)}
                                    className="group bg-white rounded-2xl p-5 cursor-pointer shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <GradeBadge grade={result.grade} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{test?.testName}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(test?.date).toLocaleDateString()}
                                                </span>
                                                <PerformanceBadge percentage={result.percentage} />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900">
                                                {result.totalMarks}<span className="text-gray-400 text-base">/{result.maxMarks}</span>
                                            </p>
                                            <p className="text-sm text-gray-500">{result.percentage}%</p>
                                        </div>
                                        <ChevronRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            )
                        }
                        return null
                    })}
                </div>

                {/* Empty State */}
                {filteredResults.length === 0 && (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                        <p className="text-gray-500">Your test results will appear here.</p>
                    </div>
                )}

            </div>
        </div>
    )
}
