/**
 * Modern Student Dashboard
 * Premium, futuristic design with GitHub-style attendance heatmap
 */

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format, subDays, addDays, differenceInDays, parseISO } from 'date-fns'
import {
    Calendar,
    Clock,
    TrendingUp,
    Award,
    BookOpen,
    Target,
    Flame,
    Star,
    ChevronRight,
    MapPin,
    Video,
    FileText,
    Bell,
    Sun,
    Moon,
    Sparkles,
    Trophy,
    Zap,
    GraduationCap,
    BarChart3,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    Play
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import AttendanceOverview from '../../components/AttendanceOverview'
import CountdownTimer from '../../components/CountdownTimer'



export default function StudentDashboard() {
    const { user } = useAuth()
    const [greeting, setGreeting] = useState('')

    // Set greeting based on time of day
    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good morning')
        else if (hour < 17) setGreeting('Good afternoon')
        else setGreeting('Good evening')
    }, [])

    // Fetch dashboard data
    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['student-dashboard-v2'],
        queryFn: async () => {
            const response = await api.get(`/students/${user?.roll}/dashboard`)
            return response.data.data
        }
    })

    // Fetch upcoming classes
    const { data: upcomingClasses } = useQuery({
        queryKey: ['upcoming-classes', user?.class],
        queryFn: async () => {
            const response = await api.get(`/classes/upcoming?class=${user?.class}&limit=5`)
            return response.data.data
        },
        enabled: !!user?.class
    })



    // Calculate academic stats
    const academicStats = useMemo(() => {
        const results = dashboardData?.recentResults || []
        if (results.length === 0) return { avgScore: 0, improvement: 0, rank: '-' }

        const avgScore = results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length
        const lastTwo = results.slice(0, 2)
        const improvement = lastTwo.length === 2
            ? lastTwo[0].percentage - lastTwo[1].percentage
            : 0

        return {
            avgScore: Math.round(avgScore),
            improvement: Math.round(improvement),
            rank: results[0]?.rank || '-'
        }
    }, [dashboardData])

    // Next class info
    const nextClass = upcomingClasses?.[0]
    const nextTest = dashboardData?.upcomingTests?.[0]

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--light)]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading your dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--light)]">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--primary)] via-[var(--primary-light)] to-[var(--secondary)] p-6 md:p-8">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                                <Sparkles className="w-4 h-4" />
                                <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                                {greeting}, {user?.name?.split(' ')[0]}! ✨
                            </h1>
                            <p className="text-white/70">
                                Roll: {user?.roll} • Class: {user?.class}
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-3 flex-wrap">
                            <div className="glass-card px-4 py-3 rounded-2xl text-center min-w-[100px]">
                                <div className="text-2xl font-bold text-white">{academicStats.avgScore}%</div>
                                <div className="text-xs text-white/70">Avg Score</div>
                            </div>
                            <div className="glass-card px-4 py-3 rounded-2xl text-center min-w-[100px]">
                                <div className="text-2xl font-bold text-emerald-300">
                                    {academicStats.improvement >= 0 ? '+' : ''}{academicStats.improvement}%
                                </div>
                                <div className="text-xs text-white/70">Improvement</div>
                            </div>
                            <div className="glass-card px-4 py-3 rounded-2xl text-center min-w-[100px]">
                                <div className="text-2xl font-bold text-yellow-300">#{academicStats.rank}</div>
                                <div className="text-xs text-white/70">Class Rank</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Large Cards */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Attendance Overview */}
                        <AttendanceOverview studentId={user?.id} />

                        {/* Upcoming Classes */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--dark)]">
                                            Upcoming Classes
                                        </h2>
                                        <p className="text-sm text-gray-500">Your schedule for today</p>
                                    </div>
                                </div>
                                <Link to="/student/schedule" className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1">
                                    Full Schedule <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {upcomingClasses?.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingClasses.slice(0, 4).map((cls, index) => (
                                        <div
                                            key={cls._id || index}
                                            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] bg-gray-50 hover:bg-gray-100 border border-gray-200 ${index === 0 ? 'ring-2 ring-[var(--primary)]/30' : ''}`}
                                        >
                                            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${index === 0
                                                ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white'
                                                : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                <span className="text-lg font-bold">{format(new Date(cls.date), 'd')}</span>
                                                <span className="text-xs">{format(new Date(cls.date), 'MMM')}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-[var(--dark)] truncate">
                                                        {cls.title || cls.subject}
                                                    </h3>
                                                    {index === 0 && (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                                                            Next
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {cls.startTime} - {cls.endTime}
                                                    </span>
                                                    {cls.isOnline ? (
                                                        <span className="flex items-center gap-1 text-blue-600">
                                                            <Video className="w-3 h-3" />
                                                            Online
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {cls.room || 'TBA'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {cls.isOnline && cls.meetingLink && (
                                                <a
                                                    href={cls.meetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Join
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No upcoming classes scheduled</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Results */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                        <Trophy className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--dark)]">
                                            Recent Results
                                        </h2>
                                        <p className="text-sm text-gray-500">Your test performance</p>
                                    </div>
                                </div>
                                <Link to="/student/results" className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1">
                                    All Results <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {dashboardData?.recentResults?.length > 0 ? (
                                <div className="space-y-3">
                                    {dashboardData.recentResults.slice(0, 4).map((result, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${result.percentage >= 80 ? 'bg-emerald-100 text-emerald-600' :
                                                    result.percentage >= 60 ? 'bg-blue-100 text-blue-600' :
                                                        result.percentage >= 40 ? 'bg-yellow-100 text-yellow-600' :
                                                            'bg-red-100 text-red-600'
                                                    }`}>
                                                    {result.grade}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-[var(--dark)]">
                                                        {result.testId?.testName || 'Test'}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {result.testId?.date && format(new Date(result.testId.date), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-[var(--dark)]">
                                                    {result.totalMarks}/{result.maxMarks}
                                                </div>
                                                <div className={`text-sm font-medium ${result.percentage >= 80 ? 'text-emerald-600' :
                                                    result.percentage >= 60 ? 'text-blue-600' :
                                                        result.percentage >= 40 ? 'text-yellow-600' :
                                                            'text-red-600'
                                                    }`}>
                                                    {result.percentage?.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No results yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Widgets */}
                    <div className="space-y-6">
                        {/* Next Event Countdown */}
                        {(nextClass || nextTest) && (
                            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]">
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Zap className="w-5 h-5 text-yellow-300" />
                                        <span className="text-sm font-medium text-white/80">
                                            {nextClass ? 'Next Class' : 'Next Test'}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 text-white">
                                        {nextClass?.title || nextClass?.subject || nextTest?.testName}
                                    </h3>

                                    <p className="text-sm text-white/70 mb-4">
                                        {format(new Date(nextClass?.date || nextTest?.date), 'EEEE, MMM d')}
                                        {(nextClass?.startTime || nextTest?.startTime) && ` at ${nextClass?.startTime || nextTest?.startTime}`}
                                    </p>

                                    <CountdownTimer
                                        targetDate={nextClass?.date || nextTest?.date}
                                        targetTime={nextClass?.startTime || nextTest?.startTime}
                                        label="Starting in"
                                    />
                                </div>
                            </div>
                        )}



                        {/* Upcoming Tests */}
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-lg font-bold text-[var(--dark)]">
                                    Upcoming Tests
                                </h2>
                            </div>

                            {dashboardData?.upcomingTests?.length > 0 ? (
                                <div className="space-y-3">
                                    {dashboardData.upcomingTests.slice(0, 3).map((test, index) => {
                                        const daysUntil = differenceInDays(new Date(test.date), new Date())
                                        const isUrgent = daysUntil <= 3

                                        return (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-xl ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-medium text-[var(--dark)]">
                                                        {test.testName}
                                                    </h3>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isUrgent
                                                        ? 'bg-red-100 text-red-600'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {test.subjects?.length} subjects • {test.totalMaxMarks} marks
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-center py-4 text-gray-400">No upcoming tests</p>
                            )}
                        </div>



                        {/* Motivational Quote */}
                        <div className="rounded-2xl p-6 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 border border-[var(--primary)]/20">
                            <div className="text-center">
                                <Sparkles className="w-8 h-8 mx-auto mb-3 text-[var(--primary)]" />
                                <p className="text-lg italic text-[var(--dark)]">
                                    "Education is the most powerful weapon which you can use to change the world."
                                </p>
                                <p className="text-sm text-gray-500 mt-2">— Nelson Mandela</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Styles */}
            <style>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
                    50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.6); }
                }

                .animate-pulse-glow {
                    animation: pulse-glow 2s infinite;
                }
            `}</style>
        </div>
    )
}
