import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import CountdownTimer from '../../components/CountdownTimer'
import {
    FileText,
    CreditCard,
    Calendar,
    Clock,
    TrendingUp,
    Award,
    Video,
    MapPin,
    ChevronRight,
    ExternalLink,
    BookOpen,
    CheckCircle2
} from 'lucide-react'

const StudentDashboard = () => {
    const { user } = useAuth()

    const { data, isLoading } = useQuery({
        queryKey: ['student-dashboard'],
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

    if (isLoading) {
        return <StudentDashboardSkeleton />
    }

    // Get next class and test
    const nextClass = upcomingClasses?.[0]
    const nextTest = data?.upcomingTests?.[0]

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Welcome */}
            <div className="gradient-secondary text-white rounded-2xl p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    Welcome, {user?.name}! 👋
                </h1>
                <p className="text-white/80">
                    Roll: {user?.roll} | Class: {user?.class}
                </p>
            </div>

            {/* Next Class & Test Countdown */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Next Class */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <BookOpen className="text-blue-600 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Next Class</h3>
                            <p className="text-sm text-gray-500">Coming up</p>
                        </div>
                    </div>

                    {nextClass ? (
                        <div className="space-y-4">
                            <div>
                                <p className="font-semibold text-lg text-gray-900 dark:text-white">
                                    {nextClass.title || nextClass.subject}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {format(new Date(nextClass.date), 'EEEE, MMMM d')} at {nextClass.startTime}
                                </p>
                            </div>

                            <CountdownTimer
                                targetDate={nextClass.date}
                                targetTime={nextClass.startTime}
                                label="Starts in"
                            />

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                {nextClass.isOnline ? (
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                        <Video className="w-4 h-4" />
                                        <span>Online Class</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <MapPin className="w-4 h-4" />
                                        <span>{nextClass.room || 'TBA'}</span>
                                    </div>
                                )}

                                {nextClass.isOnline && nextClass.meetingLink && (
                                    <a
                                        href={nextClass.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary py-2 px-4 text-sm flex items-center gap-1"
                                    >
                                        Join
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No upcoming classes</p>
                        </div>
                    )}
                </div>

                {/* Next Test */}
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <FileText className="text-purple-600 w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Next Test</h3>
                            <p className="text-sm text-gray-500">Prepare now</p>
                        </div>
                    </div>

                    {nextTest ? (
                        <div className="space-y-4">
                            <div>
                                <p className="font-semibold text-lg text-gray-900 dark:text-white">
                                    {nextTest.testName}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {format(new Date(nextTest.date), 'EEEE, MMMM d')}
                                    {nextTest.startTime && ` at ${nextTest.startTime}`}
                                </p>
                            </div>

                            <CountdownTimer
                                targetDate={nextTest.date}
                                targetTime={nextTest.startTime}
                                label="Time remaining"
                            />

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {nextTest.subjects?.length} subjects • {nextTest.totalMaxMarks} marks
                                </div>
                                <Link
                                    to="/student/schedule"
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    Details
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {/* Syllabus Preview */}
                            {nextTest.syllabus && nextTest.syllabus.length > 0 && (
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mt-2">
                                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Syllabus:</p>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        {nextTest.syllabus.slice(0, 3).map((item, i) => (
                                            <li key={i} className="flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-purple-500" />
                                                {item}
                                            </li>
                                        ))}
                                        {nextTest.syllabus.length > 3 && (
                                            <li className="text-purple-600">+{nextTest.syllabus.length - 3} more...</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No upcoming tests</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <FileText className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[var(--primary)]">
                                {data?.recentResults?.length || 0}
                            </p>
                            <p className="text-sm text-gray-500">Tests Taken</p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">
                                {data?.recentResults?.[0]?.percentage?.toFixed(1) || 0}%
                            </p>
                            <p className="text-sm text-gray-500">Latest Score</p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <CreditCard className="text-yellow-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">
                                ৳{data?.payments?.dueAmount?.toLocaleString() || 0}
                            </p>
                            <p className="text-sm text-gray-500">Due Amount</p>
                        </div>
                    </div>
                </div>

                <div className="card p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Calendar className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-purple-600">
                                {data?.upcomingTests?.length || 0}
                            </p>
                            <p className="text-sm text-gray-500">Upcoming Tests</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Classes List */}
            {upcomingClasses && upcomingClasses.length > 1 && (
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-[var(--primary)]">Upcoming Classes</h3>
                        <Link to="/student/schedule" className="text-sm text-[var(--secondary)] hover:underline flex items-center gap-1">
                            View Schedule
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {upcomingClasses.slice(1, 4).map((cls, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="w-12 h-12 rounded-lg bg-blue-500 text-white flex flex-col items-center justify-center text-sm">
                                    <span className="font-bold">{new Date(cls.date).getDate()}</span>
                                    <span className="text-xs">{format(new Date(cls.date), 'MMM')}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{cls.title || cls.subject}</p>
                                    <p className="text-sm text-gray-500">
                                        {cls.startTime} - {cls.endTime}
                                        {cls.isOnline ? ' (Online)' : cls.room ? ` • ${cls.room}` : ''}
                                    </p>
                                </div>
                                {cls.isOnline && cls.meetingLink && (
                                    <a
                                        href={cls.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <Video className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Results */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-[var(--primary)]">Recent Results</h3>
                        <Link to="/student/results" className="text-sm text-[var(--secondary)] hover:underline">
                            View All
                        </Link>
                    </div>

                    {data?.recentResults?.length > 0 ? (
                        <div className="space-y-3">
                            {data.recentResults.slice(0, 5).map((result, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{result.testId?.testName || 'Test'}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(result.testId?.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">
                                            {result.totalMarks}/{result.maxMarks}
                                        </p>
                                        <p className={`text-sm font-medium ${result.percentage >= 80 ? 'text-green-600' :
                                            result.percentage >= 60 ? 'text-blue-600' :
                                                result.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {result.percentage?.toFixed(1)}% - {result.grade}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No results yet</p>
                    )}
                </div>

                {/* Upcoming Tests */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-[var(--primary)]">All Upcoming Tests</h3>
                        <Clock className="text-gray-400" size={20} />
                    </div>

                    {data?.upcomingTests?.length > 0 ? (
                        <div className="space-y-3">
                            {data.upcomingTests.map((test, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="w-12 h-12 rounded-lg bg-[var(--primary)] text-white flex flex-col items-center justify-center text-sm">
                                        <span className="font-bold">{new Date(test.date).getDate()}</span>
                                        <span className="text-xs">{new Date(test.date).toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{test.testName}</p>
                                        <p className="text-sm text-gray-500">
                                            {test.subjects?.length} subjects • {test.totalMaxMarks} marks
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No upcoming tests</p>
                    )}
                </div>
            </div>

            {/* Payment Info */}
            <div className="card p-6">
                <h3 className="font-bold text-lg text-[var(--primary)] mb-4">Payment Information</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-500">Total Fee</p>
                        <p className="text-xl font-bold">৳{data?.payments?.totalFee?.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-gray-500">Paid</p>
                        <p className="text-xl font-bold text-green-600">৳{data?.payments?.paidAmount?.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-gray-500">Due</p>
                        <p className="text-xl font-bold text-red-600">৳{data?.payments?.dueAmount?.toLocaleString() || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentDashboard
