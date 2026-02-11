/**
 * Student Results Page - Premium Design
 * Features: Glassmorphism, gradients, animations, decorative elements
 * Fully responsive and matching website theme
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import {
    FileText,
    Award,
    TrendingUp,
    TrendingDown,
    Trophy,
    Target,
    Star,
    ChevronRight,
    BarChart3,
    Users,
    Medal,
    Sparkles,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    Download,
    Share2,
    Calendar,
    Clock,
    BookOpen,
    AlertCircle,
    GraduationCap,
    Zap
} from 'lucide-react'
import CountUp from 'react-countup'

const StudentResults = () => {
    const { user } = useAuth()
    const [selectedResult, setSelectedResult] = useState(null)
    const [showMeritList, setShowMeritList] = useState(false)

    // Fetch student results
    const { data, isLoading } = useQuery({
        queryKey: ['student-results'],
        queryFn: async () => {
            const response = await api.get(`/results/student/${user?.studentId || user?.id}`)
            return response.data.data
        },
        enabled: !!user
    })

    // Fetch detailed result with comparison when a result is selected
    const { data: detailedResult, isLoading: loadingDetail } = useQuery({
        queryKey: ['student-result-detail', selectedResult?.testId],
        queryFn: async () => {
            const response = await api.get(`/results/student/${user?.studentId || user?.id}/test/${selectedResult.testId}`)
            return response.data.data
        },
        enabled: !!selectedResult?.testId
    })

    // Fetch merit list when requested
    const { data: meritListData, isLoading: loadingMeritList } = useQuery({
        queryKey: ['merit-list', selectedResult?.testId],
        queryFn: async () => {
            const response = await api.get(`/results/public/merit-list/${selectedResult.testId}`)
            return response.data.data
        },
        enabled: !!selectedResult?.testId && showMeritList
    })

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-[var(--primary)]"></div>
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--primary)]" size={24} />
                    </div>
                    <p className="text-gray-500 mt-4 font-medium">Loading your results...</p>
                </div>
            </div>
        )
    }

    const getGradeColor = (grade) => {
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
        return colors[grade] || 'from-gray-400 to-gray-600'
    }

    const getGradeBorderColor = (grade) => {
        const colors = {
            'A+': 'border-emerald-500',
            'A': 'border-green-500',
            'A-': 'border-blue-500',
            'B+': 'border-blue-400',
            'B': 'border-yellow-500',
            'C': 'border-orange-500',
            'D': 'border-red-400',
            'F': 'border-red-500'
        }
        return colors[grade] || 'border-gray-400'
    }

    const getPerformanceStars = (percentage) => {
        if (percentage >= 90) return 5
        if (percentage >= 80) return 4
        if (percentage >= 70) return 3
        if (percentage >= 60) return 2
        if (percentage >= 50) return 1
        return 0
    }

    const results = data?.filter(i => i.type === 'result') || []
    const testsCount = results.length
    const avgScore = testsCount > 0
        ? (results.reduce((sum, r) => sum + (r.data.percentage || 0), 0) / testsCount).toFixed(1)
        : 0
    const bestScore = testsCount > 0
        ? Math.max(...results.map(r => r.data.percentage || 0)).toFixed(1)
        : 0
    const missedCount = data?.filter(i => i.type === 'no_result' && i.status === 'absent').length || 0
    const pendingCount = data?.filter(i => i.type === 'no_result' && i.status !== 'absent').length || 0

    return (
        <div className="min-h-screen pb-8">
            {/* Premium Header with Pattern Background */}
            <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-[var(--primary)] via-blue-500 to-[var(--secondary)] p-6 md:p-8 lg:p-10 text-white mb-6 shadow-2xl shadow-blue-500/25">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}></div>
                </div>

                {/* Floating Orbs */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-orange-500/30 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-white/20 shadow-lg">
                            <Trophy size={16} className="text-yellow-300" />
                            <span>Academic Performance</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 drop-shadow-lg">My Results</h1>
                        <p className="text-white/80 text-base md:text-lg max-w-md">Track your academic journey and celebrate your achievements</p>
                    </div>

                    {selectedResult && (
                        <button
                            onClick={() => { setSelectedResult(null); setShowMeritList(false) }}
                            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-3 rounded-xl font-semibold transition-all self-start border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            <ArrowLeft size={18} />
                            Back to All Results
                        </button>
                    )}
                </div>

                {/* Quick Stats in Header (only when there are results) */}
                {!selectedResult && testsCount > 0 && (
                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold"><CountUp end={testsCount} duration={1} /></p>
                                    <p className="text-xs text-white/70">Tests Taken</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold"><CountUp end={parseFloat(avgScore)} decimals={1} duration={1.5} />%</p>
                                    <p className="text-xs text-white/70">Average</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold"><CountUp end={parseFloat(bestScore)} decimals={1} duration={1.5} />%</p>
                                    <p className="text-xs text-white/70">Best Score</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{missedCount}</p>
                                    <p className="text-xs text-white/70">Missed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Result View */}
            {selectedResult && (
                <div className="space-y-6">
                    {/* Main Score Card */}
                    <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        <div className={`bg-gradient-to-br ${getGradeColor(selectedResult.data.grade)} text-white p-6 md:p-8 relative overflow-hidden`}>
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-xl"></div>

                            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
                                        <Calendar size={14} />
                                        <span>
                                            {new Date(selectedResult.test?.date).toLocaleDateString('en-US', {
                                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{selectedResult.test?.testName}</h2>
                                    <p className="text-white/80 flex items-center gap-2">
                                        <GraduationCap size={16} />
                                        Class {selectedResult.test?.class}
                                    </p>
                                </div>

                                <div className="text-center md:text-right">
                                    <div className="inline-block bg-white/20 backdrop-blur-md rounded-2xl lg:rounded-3xl p-6 md:p-8 border border-white/20">
                                        <p className="text-4xl md:text-5xl lg:text-6xl font-bold mb-1">
                                            <CountUp end={selectedResult.data.totalMarks} duration={1.5} />
                                            <span className="text-xl md:text-2xl opacity-70">/{selectedResult.data.maxMarks}</span>
                                        </p>
                                        <p className="text-lg md:text-xl font-semibold">
                                            <CountUp end={selectedResult.data.percentage} decimals={1} duration={1.5} />%
                                        </p>
                                        {/* Stars */}
                                        <div className="flex items-center justify-center gap-1 mt-3">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={18}
                                                    className={i < getPerformanceStars(selectedResult.data.percentage)
                                                        ? 'fill-yellow-300 text-yellow-300'
                                                        : 'text-white/30'
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rank & Comparison */}
                        {detailedResult && !loadingDetail && (
                            <div className="p-6 bg-gradient-to-br from-gray-50 to-white grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="text-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-yellow-200 transition-all group">
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Medal className="text-yellow-600" size={28} />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">#{detailedResult.result.rank}</p>
                                    <p className="text-sm text-gray-500">out of {detailedResult.comparison.totalStudents}</p>
                                </div>
                                <div className="text-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group">
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Target className="text-blue-600" size={28} />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">{detailedResult.result.percentile}</p>
                                    <p className="text-sm text-gray-500">Percentile</p>
                                </div>
                                <div className="text-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all group">
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Trophy className="text-amber-600" size={28} />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{detailedResult.comparison.topperScore}/{detailedResult.comparison.topperMaxMarks}</p>
                                    <p className="text-sm text-gray-500">Topper's Score</p>
                                </div>
                                <div className="text-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all group">
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Users className="text-purple-600" size={28} />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{detailedResult.comparison.averageScore}</p>
                                    <p className="text-sm text-gray-500">Class Average</p>
                                </div>
                            </div>
                        )}

                        {/* Performance Insight */}
                        {detailedResult && (
                            <div className="p-6 border-t border-gray-100">
                                <div className={`p-5 rounded-2xl flex items-center gap-4 ${detailedResult.comparison.aboveAverage
                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100'
                                    : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100'
                                    }`}>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${detailedResult.comparison.aboveAverage ? 'bg-green-100' : 'bg-amber-100'}`}>
                                        {detailedResult.comparison.aboveAverage
                                            ? <ArrowUp className="text-green-600" size={24} />
                                            : <ArrowDown className="text-amber-600" size={24} />
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-bold text-lg ${detailedResult.comparison.aboveAverage ? 'text-green-700' : 'text-amber-700'}`}>
                                            {detailedResult.comparison.aboveAverage
                                                ? `Above Average by ${detailedResult.comparison.differenceFromAverage.toFixed(1)} marks!`
                                                : `${Math.abs(detailedResult.comparison.differenceFromAverage).toFixed(1)} marks below average`
                                            }
                                        </p>
                                        {detailedResult.comparison.marksNeededForNextRank > 0 && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                📊 Need {detailedResult.comparison.marksNeededForNextRank} more marks for next rank
                                            </p>
                                        )}
                                    </div>
                                    {detailedResult.comparison.aboveAverage && <Sparkles className="text-green-500" size={24} />}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subject-wise Breakdown */}
                    {selectedResult.data.subjectMarks && (
                        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
                            <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shadow-lg shadow-blue-500/25">
                                    <BarChart3 className="text-white" size={20} />
                                </div>
                                Subject-wise Breakdown
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(selectedResult.data.subjectMarks).map(([subject, marks]) => {
                                    const maxMarks = selectedResult.test?.subjects?.find(s => s.name === subject)?.maxMarks || 100
                                    const percentage = (marks / maxMarks) * 100

                                    return (
                                        <div key={subject} className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-[var(--primary)] hover:shadow-lg transition-all group">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-semibold capitalize text-gray-800">{subject.replace('_', ' ')}</span>
                                                <span className="font-bold text-xl">{marks}<span className="text-gray-400 text-sm font-normal">/{maxMarks}</span></span>
                                            </div>
                                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${percentage >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                                        percentage >= 60 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                                            percentage >= 40 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                                                'bg-gradient-to-r from-red-400 to-orange-500'
                                                        }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm font-medium text-gray-500">{percentage.toFixed(0)}%</span>
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(getPerformanceStars(percentage))].map((_, i) => (
                                                        <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowMeritList(!showMeritList)}
                            className="btn btn-primary shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
                        >
                            <Users size={18} />
                            {showMeritList ? 'Hide' : 'View'} Merit List
                        </button>
                        <button className="btn btn-outline hover:shadow-lg transition-all">
                            <Download size={18} />
                            Download Report
                        </button>
                        <button className="btn btn-outline hover:shadow-lg transition-all">
                            <Share2 size={18} />
                            Share
                        </button>
                    </div>

                    {/* Merit List */}
                    {showMeritList && (
                        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
                            <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                                    <Trophy className="text-white" size={20} />
                                </div>
                                Merit List - Top Performers
                            </h3>

                            {loadingMeritList ? (
                                <div className="text-center py-12">
                                    <div className="spinner mx-auto"></div>
                                </div>
                            ) : meritListData?.meritList?.length > 0 ? (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                    {meritListData.meritList.slice(0, 20).map((student, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${student.studentId?.toString() === (user?.studentId || user?.id)
                                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md'
                                                : 'bg-gray-50 border border-gray-100 hover:border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${student.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-500/30' :
                                                    student.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                                                        student.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-orange-600 text-white' :
                                                            'bg-gray-200 text-gray-600'
                                                }`}>
                                                {student.rank <= 3 ? <Medal size={20} /> : student.rank}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {student.name}
                                                    {student.studentId?.toString() === (user?.studentId || user?.id) && (
                                                        <span className="ml-2 text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-0.5 rounded-full">You</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500">Roll: {student.roll}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-lg text-gray-900">{student.totalMarks}/{student.maxMarks}</p>
                                                <p className="text-sm text-gray-500">{student.percentage}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Merit list not available</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Results List (Main View) */}
            {!selectedResult && (
                <div className="space-y-6">
                    {/* Section Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <BookOpen className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-xl text-gray-900">All Test Results</h2>
                                <p className="text-sm text-gray-500">{data?.length || 0} tests in your academic record</p>
                            </div>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="space-y-4">
                        {data?.map((item, index) => {
                            const { type, data: result, test, status } = item

                            if (type === 'result') {
                                return (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedResult(item)}
                                        className={`group bg-white rounded-2xl p-5 md:p-6 cursor-pointer border-l-4 ${getGradeBorderColor(result.grade)} hover:shadow-xl shadow-md transition-all hover:-translate-y-1 border border-gray-100`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${getGradeColor(result.grade)} flex items-center justify-center text-white font-bold text-lg md:text-xl shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                                                    {result.grade}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-lg md:text-xl text-gray-900 truncate group-hover:text-[var(--primary)] transition-colors">{test?.testName || 'Test'}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                                                            <Calendar size={12} />
                                                            {new Date(test?.date).toLocaleDateString('en-US', {
                                                                month: 'short', day: 'numeric', year: 'numeric'
                                                            })}
                                                        </span>
                                                        {result.rank && (
                                                            <span className="inline-flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                                                                <Medal size={12} />
                                                                Rank #{result.rank}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="text-right">
                                                    <p className="text-2xl md:text-3xl font-bold text-gray-900">
                                                        {result.totalMarks}<span className="text-gray-400 text-base md:text-lg font-normal">/{result.maxMarks}</span>
                                                    </p>
                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                                        <span className="text-sm font-medium text-gray-500">{result.percentage}%</span>
                                                        <div className="flex items-center gap-0.5 ml-1">
                                                            {[...Array(Math.min(getPerformanceStars(result.percentage), 3))].map((_, i) => (
                                                                <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                                                    <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            } else if (status === 'absent') {
                                return (
                                    <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-5 md:p-6 border-l-4 border-red-400 border border-red-100 shadow-md">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center shrink-0 border border-red-200">
                                                    <AlertCircle className="text-red-500" size={28} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-lg md:text-xl text-gray-800 truncate">{test?.testName}</h3>
                                                    <span className="inline-flex items-center gap-1 text-sm text-gray-500 bg-white/80 px-2 py-0.5 rounded-lg mt-1">
                                                        <Calendar size={12} />
                                                        {new Date(test?.date).toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric', year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-red-500/25 shrink-0">
                                                Absent
                                            </div>
                                        </div>
                                    </div>
                                )
                            } else {
                                return (
                                    <div key={index} className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-5 md:p-6 border-l-4 border-gray-300 border border-gray-200 shadow-md">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center shrink-0 border border-gray-200">
                                                    <Clock className="text-gray-400" size={28} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-lg md:text-xl text-gray-700 truncate">{test?.testName}</h3>
                                                    <span className="inline-flex items-center gap-1 text-sm text-gray-500 bg-white px-2 py-0.5 rounded-lg mt-1">
                                                        <Calendar size={12} />
                                                        {new Date(test?.date).toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric', year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm shrink-0 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                                Pending
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        })}
                    </div>

                    {/* Premium Empty State */}
                    {(!data || data.length === 0) && (
                        <div className="relative bg-white rounded-3xl p-12 md:p-16 text-center shadow-xl border border-gray-100 overflow-hidden">
                            {/* Background Decorations */}
                            <div className="absolute inset-0 opacity-30">
                                <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-36 -mt-36"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-orange-100 to-transparent rounded-full -ml-32 -mb-32"></div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute top-10 left-10 w-8 h-8 bg-blue-100 rounded-lg rotate-12 animate-pulse"></div>
                            <div className="absolute top-20 right-16 w-6 h-6 bg-orange-100 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="absolute bottom-16 right-10 w-10 h-10 bg-green-100 rounded-lg -rotate-12 animate-pulse" style={{ animationDelay: '0.4s' }}></div>

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className="w-32 h-32 mx-auto mb-8 relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-orange-100 rounded-3xl rotate-6"></div>
                                    <div className="absolute inset-0 bg-white rounded-3xl shadow-lg flex items-center justify-center border border-gray-100">
                                        <div className="relative">
                                            <FileText className="text-gray-300" size={48} />
                                            <Sparkles className="absolute -top-2 -right-2 text-[var(--secondary)]" size={20} />
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-2xl md:text-3xl font-bold mb-3">
                                    <span className="gradient-text">No Results Yet</span>
                                </h3>
                                <p className="text-gray-500 max-w-md mx-auto text-lg mb-8">
                                    Your test results will appear here once they're published. Keep up the great work! 🌟
                                </p>

                                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-orange-50 px-6 py-4 rounded-2xl border border-blue-100">
                                    <Zap className="text-[var(--secondary)]" size={24} />
                                    <span className="text-gray-700 font-medium">Stay prepared for upcoming tests</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Only absent/pending - show encouraging message */}
                    {data && data.length > 0 && testsCount === 0 && (
                        <div className="bg-gradient-to-r from-blue-50 via-white to-orange-50 rounded-2xl p-8 border border-blue-100 shadow-lg mt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shadow-lg">
                                    <Zap className="text-white" size={32} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-xl text-gray-900 mb-1">Keep Going! You've Got This! 💪</h4>
                                    <p className="text-gray-600">Results for your participated tests will be published soon. Stay positive and keep preparing!</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default StudentResults
