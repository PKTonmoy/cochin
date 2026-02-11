import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';
import {
    Calendar,
    ClipboardCheck,
    FileText,
    Users,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    TrendingUp,
    Loader2,
    RefreshCw
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

/**
 * Admin Workflow Dashboard
 * Unified view of the Class → Attendance → Results workflow
 */

const WorkflowStatusBadge = ({ status }) => {
    const statusConfig = {
        scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800', icon: Calendar },
        ongoing: { label: 'Ongoing', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
        completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
        cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
        attendance_pending: { label: 'Attendance Pending', color: 'bg-orange-100 text-orange-800', icon: ClipboardCheck },
        attendance_marked: { label: 'Attendance Marked', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
        results_pending: { label: 'Results Pending', color: 'bg-purple-100 text-purple-800', icon: FileText },
        results_complete: { label: 'Results Ready', color: 'bg-indigo-100 text-indigo-800', icon: TrendingUp }
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow`}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className={`text-3xl font-bold mt-2 ${color || 'text-gray-900'}`}>{value}</p>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color ? 'bg-opacity-10' : 'bg-blue-50'}`}
                style={{ backgroundColor: color ? `${color}15` : undefined }}>
                <Icon className={`w-6 h-6 ${color || 'text-blue-600'}`} />
            </div>
        </div>
    </div>
);

const TestWorkflowCard = ({ test, onMarkAttendance, onEnterResults }) => {
    const getWorkflowStatus = () => {
        if (test.resultsComplete) return 'results_complete';
        if (test.attendanceMarked) return 'results_pending';
        if (isPast(new Date(test.date))) return 'attendance_pending';
        return 'scheduled';
    };

    const workflowStatus = getWorkflowStatus();
    const testDate = new Date(test.date);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-gray-900">{test.testName}</h3>
                    <p className="text-sm text-gray-500">{test.testCode} • {test.class}{test.section && ` - ${test.section}`}</p>
                </div>
                <WorkflowStatusBadge status={workflowStatus} />
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {isToday(testDate) ? 'Today' : isTomorrow(testDate) ? 'Tomorrow' : format(testDate, 'MMM d, yyyy')}
                </span>
                {test.attendanceCount > 0 && (
                    <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {test.attendanceCount} attended
                    </span>
                )}
                {test.resultCount > 0 && (
                    <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        {test.resultCount} results
                    </span>
                )}
            </div>

            {/* Workflow Progress */}
            <div className="relative mb-4">
                <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-2 ${test.attendanceMarked ? 'text-green-600' : isPast(testDate) ? 'text-orange-600' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${test.attendanceMarked ? 'bg-green-100' : isPast(testDate) ? 'bg-orange-100' : 'bg-gray-100'}`}>
                            <ClipboardCheck className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium">Attendance</span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-3 ${test.attendanceMarked ? 'bg-green-300' : 'bg-gray-200'}`} />
                    <div className={`flex items-center gap-2 ${test.resultsComplete ? 'text-green-600' : test.attendanceMarked ? 'text-purple-600' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${test.resultsComplete ? 'bg-green-100' : test.attendanceMarked ? 'bg-purple-100' : 'bg-gray-100'}`}>
                            <FileText className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium">Results</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                {!test.attendanceMarked && isPast(testDate) && (
                    <button
                        onClick={() => onMarkAttendance(test._id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <ClipboardCheck className="w-4 h-4" />
                        Mark Attendance
                    </button>
                )}
                {test.attendanceMarked && !test.resultsComplete && (
                    <button
                        onClick={() => onEnterResults(test._id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        Enter Results
                    </button>
                )}
                {test.resultsComplete && (
                    <button
                        onClick={() => window.location.href = `/admin/results?testId=${test._id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <TrendingUp className="w-4 h-4" />
                        View Results
                    </button>
                )}
            </div>
        </div>
    );
};

export default function AdminWorkflowDashboard() {
    const queryClient = useQueryClient();
    const [selectedTab, setSelectedTab] = useState('all');

    // Fetch workflow overview
    const { data: workflowData, isLoading, refetch } = useQuery({
        queryKey: ['admin-workflow-overview'],
        queryFn: async () => {
            const { data } = await api.get('/workflow/overview');
            return data.data;
        }
    });

    // Handle navigation to attendance page
    const handleMarkAttendance = (testId) => {
        window.location.href = `/admin/attendance?testId=${testId}`;
    };

    // Handle navigation to results page
    const handleEnterResults = (testId) => {
        window.location.href = `/admin/upload?testId=${testId}`;
    };

    // Filter tests based on selected tab
    const filteredTests = useMemo(() => {
        if (!workflowData?.tests) return [];

        switch (selectedTab) {
            case 'pending-attendance':
                return workflowData.tests.filter(t => !t.attendanceMarked && isPast(new Date(t.date)));
            case 'pending-results':
                return workflowData.tests.filter(t => t.attendanceMarked && !t.resultsComplete);
            case 'completed':
                return workflowData.tests.filter(t => t.resultsComplete);
            default:
                return workflowData.tests;
        }
    }, [workflowData?.tests, selectedTab]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const summary = workflowData?.summary || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Workflow Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage the class → attendance → results workflow</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Today's Classes"
                    value={summary.classesToday || 0}
                    icon={Calendar}
                    color="text-blue-600"
                />
                <StatCard
                    title="Today's Tests"
                    value={summary.testsToday || 0}
                    icon={FileText}
                    color="text-purple-600"
                />
                <StatCard
                    title="Pending Attendance"
                    value={summary.pendingAttendance || 0}
                    icon={ClipboardCheck}
                    color="text-orange-600"
                    subtitle="Tests awaiting attendance"
                />
                <StatCard
                    title="Pending Results"
                    value={summary.pendingResults || 0}
                    icon={TrendingUp}
                    color="text-emerald-600"
                    subtitle="Ready for result entry"
                />
            </div>

            {/* Alert Banner for Pending Work */}
            {(summary.pendingAttendance > 0 || summary.pendingResults > 0) && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-orange-800">Action Required</h3>
                        <p className="text-sm text-orange-700 mt-1">
                            {summary.pendingAttendance > 0 && `${summary.pendingAttendance} test(s) need attendance marking. `}
                            {summary.pendingResults > 0 && `${summary.pendingResults} test(s) are ready for result entry.`}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs & Test List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    {[
                        { id: 'all', label: 'All Tests' },
                        { id: 'pending-attendance', label: 'Pending Attendance', count: summary.pendingAttendance },
                        { id: 'pending-results', label: 'Pending Results', count: summary.pendingResults },
                        { id: 'completed', label: 'Completed' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${selectedTab === tab.id
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {tab.count}
                                </span>
                            )}
                            {selectedTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Test Cards Grid */}
                <div className="p-6">
                    {filteredTests.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="font-medium">No tests found</p>
                            <p className="text-sm mt-1">Tests matching this filter will appear here</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTests.map((test) => (
                                <TestWorkflowCard
                                    key={test._id}
                                    test={test}
                                    onMarkAttendance={handleMarkAttendance}
                                    onEnterResults={handleEnterResults}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                    href="/admin/classes"
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Manage Classes</p>
                            <p className="text-xs text-gray-500">Create & schedule classes</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>

                <a
                    href="/admin/attendance"
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <ClipboardCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Attendance</p>
                            <p className="text-xs text-gray-500">Mark & view attendance</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                </a>

                <a
                    href="/admin/tests"
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Tests & Results</p>
                            <p className="text-xs text-gray-500">Manage tests & results</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </a>
            </div>
        </div>
    );
}
