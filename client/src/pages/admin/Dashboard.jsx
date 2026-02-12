import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import {
    Users,
    CreditCard,
    FileText,
    TrendingUp,
    AlertCircle,
    ArrowRight,
    Clock
} from 'lucide-react'

import Skeleton from '../../components/Skeleton'

const Dashboard = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/dashboard/stats')
            return response.data.data
        }
    })

    const { data: activity } = useQuery({
        queryKey: ['recent-activity'],
        queryFn: async () => {
            const response = await api.get('/dashboard/recent-activity?limit=10')
            return response.data.data
        }
    })

    if (isLoading) {
        return (
            <div className="space-y-6 animate-fadeIn">
                {/* Header Skeleton */}
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8">
                    <Skeleton className="h-8 w-64 mb-4" />
                    <Skeleton className="h-4 w-48" />
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card p-5">
                            <div className="flex justify-between">
                                <div>
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                                <Skeleton className="h-12 w-12 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts/Activity Skeleton */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="card p-6 h-[400px]">
                        <Skeleton className="h-6 w-48 mb-6" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-2 flex-1 mx-4 rounded-full" />
                                    <Skeleton className="h-4 w-12" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card p-6 h-[400px]">
                        <div className="flex justify-between mb-6">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const statCards = [
        {
            title: 'Total Students',
            value: stats?.students?.total || 0,
            icon: Users,
            color: 'bg-blue-500',
            link: '/admin/students'
        },
        {
            title: 'Active Students',
            value: stats?.students?.active || 0,
            icon: Users,
            color: 'bg-green-500',
            link: '/admin/students?status=active'
        },
        {
            title: 'Pending Payments',
            value: stats?.students?.pending || 0,
            icon: AlertCircle,
            color: 'bg-yellow-500',
            link: '/admin/students?status=pending_payment'
        },
        {
            title: 'Total Dues',
            value: `৳${(stats?.payments?.totalDues || 0).toLocaleString()}`,
            icon: CreditCard,
            color: 'bg-red-500',
            link: '/admin/payments'
        }
    ]

    const formatAction = (action) => {
        const actionMap = {
            'user_login': 'logged in',
            'student_created': 'created a new student',
            'payment_created': 'recorded a payment',
            'payment_verified': 'verified a payment',
            'results_imported': 'imported results',
            'test_created': 'created a test',
        }
        return actionMap[action] || action.replace(/_/g, ' ')
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Welcome message */}
            {/* Welcome message */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">Welcome to PARAGON Admin</h1>
                <p className="text-gray-500">Manage your coaching center from this dashboard.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <Link
                        key={index}
                        to={stat.link}
                        className="card p-5 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{stat.title}</p>
                                <p className="text-2xl font-bold text-[var(--primary)] mt-1">{stat.value}</p>
                            </div>
                            <div className={`${stat.color} text-white p-3 rounded-xl`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Class Distribution */}
                <div className="card p-6">
                    <h3 className="font-bold text-lg text-[var(--primary)] mb-4">Students by Class</h3>
                    <div className="space-y-3">
                        {(stats?.classDistribution || []).map((item, index) => {
                            const total = stats?.students?.active || 1
                            const percentage = Math.round((item.count / total) * 100)
                            return (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">Class {item.class}</span>
                                        <span className="text-gray-500">{item.count} students ({percentage}%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full gradient-primary rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                        {(!stats?.classDistribution || stats.classDistribution.length === 0) && (
                            <p className="text-gray-500 text-center py-4">No students enrolled yet</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-[var(--primary)]">Recent Activity</h3>
                        <Clock size={20} className="text-gray-400" />
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {(activity || []).map((item, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                    {item.user?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm">
                                        <span className="font-medium">{item.user}</span>{' '}
                                        <span className="text-gray-600">{formatAction(item.action)}</span>
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!activity || activity.length === 0) && (
                            <p className="text-gray-500 text-center py-4">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
                <h3 className="font-bold text-lg text-[var(--primary)] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/admin/students/add" className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-[var(--primary)] hover:bg-blue-50 transition-colors">
                        <Users className="mx-auto text-gray-400 mb-2" size={24} />
                        <span className="text-sm font-medium">Add Student</span>
                    </Link>
                    <Link to="/admin/payments" className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-[var(--primary)] hover:bg-blue-50 transition-colors">
                        <CreditCard className="mx-auto text-gray-400 mb-2" size={24} />
                        <span className="text-sm font-medium">Verify Payment</span>
                    </Link>
                    <Link to="/admin/upload" className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-[var(--primary)] hover:bg-blue-50 transition-colors">
                        <FileText className="mx-auto text-gray-400 mb-2" size={24} />
                        <span className="text-sm font-medium">Upload Results</span>
                    </Link>
                    <Link to="/admin/tests/add" className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-[var(--primary)] hover:bg-blue-50 transition-colors">
                        <TrendingUp className="mx-auto text-gray-400 mb-2" size={24} />
                        <span className="text-sm font-medium">Create Test</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
