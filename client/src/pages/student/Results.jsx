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
    Minus,
    Download,
    Share2
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
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="spinner mb-4"></div>
                    <p className="text-gray-500">Loading your results...</p>
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

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary)] flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={28} />
                        My Results
                    </h1>
                    <p className="text-gray-500">Track your academic performance and achievements</p>
                </div>
                {selectedResult && (
                    <button
                        onClick={() => setSelectedResult(null)}
                        className="btn btn-outline"
                    >
                        ← Back to All Results
                    </button>
                )}
            </div>

            {/* Summary Cards - Only show on main list view */}
            {!selectedResult && testsCount > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        <FileText className="mb-3 opacity-80" size={28} />
                        <p className="text-3xl font-bold">
                            <CountUp end={testsCount} duration={1} />
                        </p>
                        <p className="text-sm opacity-80">Tests Taken</p>
                    </div>
                    <div className="card p-5 bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                        <TrendingUp className="mb-3 opacity-80" size={28} />
                        <p className="text-3xl font-bold">
                            <CountUp end={parseFloat(avgScore)} decimals={1} duration={1.5} />%
                        </p>
                        <p className="text-sm opacity-80">Average Score</p>
                    </div>
                    <div className="card p-5 bg-gradient-to-br from-yellow-500 to-amber-600 text-white">
                        <Award className="mb-3 opacity-80" size={28} />
                        <p className="text-3xl font-bold">
                            <CountUp end={parseFloat(bestScore)} decimals={1} duration={1.5} />%
                        </p>
                        <p className="text-sm opacity-80">Best Score</p>
                    </div>
                    <div className="card p-5 bg-gradient-to-br from-red-500 to-orange-600 text-white">
                        <TrendingDown className="mb-3 opacity-80" size={28} />
                        <p className="text-3xl font-bold">
                            <CountUp end={missedCount} duration={1} />
                        </p>
                        <p className="text-sm opacity-80">Tests Missed</p>
                    </div>
                </div>
            )}

            {/* Detailed Result View */}
            {selectedResult && (
                <div className="space-y-6">
                    {/* Main Score Card */}
                    <div className="card p-0 overflow-hidden">
                        <div className={`bg-gradient-to-br ${getGradeColor(selectedResult.data.grade)} text-white p-8`}>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div>
                                    <p className="text-white/80 text-sm uppercase tracking-wider mb-2">
                                        {new Date(selectedResult.test?.date).toLocaleDateString('en-US', {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                    <h2 className="text-3xl font-bold mb-2">{selectedResult.test?.testName}</h2>
                                    <p className="text-white/80">Class {selectedResult.test?.class}</p>
                                </div>

                                <div className="text-center md:text-right">
                                    <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                                        <p className="text-5xl font-bold mb-1">
                                            <CountUp end={selectedResult.data.totalMarks} duration={1.5} />
                                            <span className="text-2xl opacity-70">/{selectedResult.data.maxMarks}</span>
                                        </p>
                                        <p className="text-lg font-semibold">
                                            <CountUp end={selectedResult.data.percentage} decimals={1} duration={1.5} />%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stars */}
                            <div className="flex items-center gap-1 mt-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={24}
                                        className={i < getPerformanceStars(selectedResult.data.percentage)
                                            ? 'fill-yellow-300 text-yellow-300'
                                            : 'text-white/30'
                                        }
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Rank & Comparison */}
                        {detailedResult && !loadingDetail && (
                            <div className="p-6 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                                    <Medal className="mx-auto text-yellow-500 mb-2" size={32} />
                                    <p className="text-3xl font-bold text-[var(--primary)]">
                                        #{detailedResult.result.rank}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        out of {detailedResult.comparison.totalStudents}
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                                    <Target className="mx-auto text-blue-500 mb-2" size={32} />
                                    <p className="text-3xl font-bold text-blue-600">
                                        {detailedResult.result.percentile}
                                    </p>
                                    <p className="text-sm text-gray-500">Percentile</p>
                                </div>
                                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                                    <Trophy className="mx-auto text-amber-500 mb-2" size={32} />
                                    <p className="text-2xl font-bold text-gray-700">
                                        {detailedResult.comparison.topperScore}/{detailedResult.comparison.topperMaxMarks}
                                    </p>
                                    <p className="text-sm text-gray-500">Topper's Score</p>
                                </div>
                                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                                    <Users className="mx-auto text-purple-500 mb-2" size={32} />
                                    <p className="text-2xl font-bold text-gray-700">
                                        {detailedResult.comparison.averageScore}
                                    </p>
                                    <p className="text-sm text-gray-500">Class Average</p>
                                </div>
                            </div>
                        )}

                        {/* Performance Insight */}
                        {detailedResult && (
                            <div className="p-4 border-t">
                                <div className={`p-4 rounded-lg ${detailedResult.comparison.aboveAverage ? 'bg-green-50' : 'bg-amber-50'}`}>
                                    <div className="flex items-center gap-2">
                                        {detailedResult.comparison.aboveAverage ? (
                                            <>
                                                <ArrowUp className="text-green-600" size={20} />
                                                <span className="font-semibold text-green-700">
                                                    Above Average by {detailedResult.comparison.differenceFromAverage.toFixed(1)} marks!
                                                </span>
                                                <Sparkles className="text-green-500" size={18} />
                                            </>
                                        ) : (
                                            <>
                                                <ArrowDown className="text-amber-600" size={20} />
                                                <span className="font-semibold text-amber-700">
                                                    {Math.abs(detailedResult.comparison.differenceFromAverage).toFixed(1)} marks below average
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {detailedResult.comparison.marksNeededForNextRank > 0 && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            📊 Need {detailedResult.comparison.marksNeededForNextRank} more marks for next rank
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subject-wise Breakdown */}
                    {selectedResult.data.subjectMarks && (
                        <div className="card p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <BarChart3 className="text-[var(--primary)]" size={20} />
                                Subject-wise Breakdown
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(selectedResult.data.subjectMarks).map(([subject, marks]) => {
                                    const maxMarks = selectedResult.test?.subjects?.find(s => s.name === subject)?.maxMarks || 100
                                    const percentage = (marks / maxMarks) * 100

                                    return (
                                        <div key={subject} className="p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium capitalize">{subject.replace('_', ' ')}</span>
                                                <span className="font-bold text-lg">{marks}<span className="text-gray-400 text-sm">/{maxMarks}</span></span>
                                            </div>
                                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${percentage >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                                            percentage >= 60 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                                                percentage >= 40 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                                                    'bg-gradient-to-r from-red-400 to-orange-500'
                                                        }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-end mt-1 gap-1">
                                                {[...Array(getPerformanceStars(percentage))].map((_, i) => (
                                                    <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                                                ))}
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
                            className="btn btn-primary"
                        >
                            <Users size={18} />
                            {showMeritList ? 'Hide' : 'View'} Merit List
                        </button>
                        <button className="btn btn-outline">
                            <Download size={18} />
                            Download Report
                        </button>
                        <button className="btn btn-outline">
                            <Share2 size={18} />
                            Share
                        </button>
                    </div>

                    {/* Merit List Modal/Section */}
                    {showMeritList && (
                        <div className="card p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Trophy className="text-yellow-500" size={20} />
                                Merit List - Top Performers
                            </h3>

                            {loadingMeritList ? (
                                <div className="text-center py-8">
                                    <div className="spinner mx-auto"></div>
                                </div>
                            ) : meritListData?.meritList?.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {meritListData.meritList.slice(0, 20).map((student, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-4 p-3 rounded-lg ${student.studentId?.toString() === (user?.studentId || user?.id)
                                                    ? 'bg-blue-50 border-2 border-blue-200'
                                                    : 'bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${student.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                                                    student.rank === 2 ? 'bg-gray-300 text-gray-700' :
                                                        student.rank === 3 ? 'bg-amber-600 text-white' :
                                                            'bg-gray-200 text-gray-600'
                                                }`}>
                                                {student.rank <= 3 ? <Medal size={20} /> : student.rank}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {student.name}
                                                    {student.studentId?.toString() === (user?.studentId || user?.id) && (
                                                        <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">You</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500">Roll: {student.roll}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">{student.totalMarks}/{student.maxMarks}</p>
                                                <p className="text-sm text-gray-500">{student.percentage}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">Merit list not available</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Results List (Main View) */}
            {!selectedResult && (
                <div className="space-y-4">
                    <h2 className="font-semibold text-lg text-gray-700">All Test Results</h2>

                    {data?.map((item, index) => {
                        const { type, data: result, test, status } = item

                        if (type === 'result') {
                            return (
                                <div
                                    key={index}
                                    onClick={() => setSelectedResult(item)}
                                    className="card p-5 cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-green-500 hover:border-l-[var(--primary)]"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getGradeColor(result.grade)} flex items-center justify-center text-white font-bold text-lg`}>
                                                {result.grade}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{test?.testName || 'Test'}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(test?.date).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-[var(--primary)]">
                                                    {result.totalMarks}<span className="text-gray-400 text-lg">/{result.maxMarks}</span>
                                                </p>
                                                <p className="text-sm text-gray-500">{result.percentage}%</p>
                                            </div>
                                            <ChevronRight className="text-gray-400" size={24} />
                                        </div>
                                    </div>

                                    {/* Rank badge if available */}
                                    {result.rank && (
                                        <div className="mt-3 pt-3 border-t flex items-center gap-2">
                                            <Medal className="text-yellow-500" size={16} />
                                            <span className="text-sm font-medium text-gray-600">
                                                Rank: #{result.rank}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )
                        } else if (status === 'absent') {
                            return (
                                <div key={index} className="card p-5 border-l-4 border-l-red-500 bg-red-50/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center">
                                                <TrendingDown className="text-red-500" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-700">{test?.testName}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(test?.date).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium">
                                            Absent
                                        </div>
                                    </div>
                                </div>
                            )
                        } else {
                            return (
                                <div key={index} className="card p-5 border-l-4 border-l-gray-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                                                <Minus className="text-gray-400" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-700">{test?.testName}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(test?.date).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium">
                                            Result Pending
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    })}

                    {(!data || data.length === 0) && (
                        <div className="card p-12 text-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="text-gray-300" size={48} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Results Yet</h3>
                            <p className="text-gray-500">Your test results will appear here once they're published.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default StudentResults
