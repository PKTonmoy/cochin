import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import {
    Calendar,
    Users,
    ClipboardCheck,
    CheckCircle,
    XCircle,
    Search,
    Save,
    FileText,
    Clock,
    TrendingUp,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Edit3,
    AlertCircle,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    History,
    Pencil,
    Info
} from 'lucide-react'

// ─── Stats Dashboard Bar ────────────────────────────────────────────
const StatsDashboard = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['attendance-stats'],
        queryFn: async () => {
            const response = await api.get('/attendance/stats')
            return response.data.data
        }
    })

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="card p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        )
    }

    const trendIcon = stats?.trend > 0
        ? <ArrowUpRight size={16} className="text-green-500" />
        : stats?.trend < 0
            ? <ArrowDownRight size={16} className="text-red-500" />
            : <Minus size={16} className="text-gray-400" />

    const trendColor = stats?.trend > 0 ? 'text-green-600' : stats?.trend < 0 ? 'text-red-600' : 'text-gray-500'

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 border-l-4 border-l-blue-500">
                <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={16} className="text-blue-500" />
                    <span className="text-xs font-medium text-gray-500 uppercase">Total Sessions</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalSessions || 0}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-green-500">
                <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-xs font-medium text-gray-500 uppercase">Overall Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats?.overallRate || 0}%</p>
            </div>
            <div className="card p-4 border-l-4 border-l-purple-500">
                <div className="flex items-center gap-2 mb-1">
                    <Calendar size={16} className="text-purple-500" />
                    <span className="text-xs font-medium text-gray-500 uppercase">This Month</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{stats?.thisMonth?.sessions || 0} sessions</p>
                <p className="text-xs text-gray-500">{stats?.thisMonth?.rate || 0}% attendance rate</p>
            </div>
            <div className="card p-4 border-l-4 border-l-amber-500">
                <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-amber-500" />
                    <span className="text-xs font-medium text-gray-500 uppercase">Monthly Trend</span>
                </div>
                <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${trendColor}`}>
                        {stats?.trend > 0 ? '+' : ''}{stats?.trend || 0}%
                    </p>
                    {trendIcon}
                </div>
                <p className="text-xs text-gray-500">vs last month</p>
            </div>
        </div>
    )
}

// ─── Mark Attendance Tab ────────────────────────────────────────────
const MarkAttendanceTab = () => {
    const queryClient = useQueryClient()
    const [mode, setMode] = useState('class')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedTest, setSelectedTest] = useState('')
    const [studentSearch, setStudentSearch] = useState('')
    const [attendance, setAttendance] = useState({})

    const { data: tests } = useQuery({
        queryKey: ['tests-for-attendance'],
        queryFn: async () => {
            const response = await api.get('/tests?isPublished=true&limit=100')
            return response.data.data.tests
        }
    })

    const { data: studentsData, isLoading: loadingStudents } = useQuery({
        queryKey: ['students-for-attendance', selectedClass],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: 200,
                ...(selectedClass && { class: selectedClass })
            })
            const response = await api.get(`/students?${params}`)
            return response.data.data.students
        },
        enabled: !!selectedClass || mode === 'test'
    })

    const { data: existingAttendance } = useQuery({
        queryKey: ['existing-attendance', mode, selectedDate, selectedTest, selectedClass],
        queryFn: async () => {
            const params = new URLSearchParams({
                type: mode,
                ...(mode === 'class' && { date: selectedDate, class: selectedClass }),
                ...(mode === 'test' && { testId: selectedTest })
            })
            const response = await api.get(`/attendance?${params}`)
            return response.data.data.attendance
        },
        enabled: (mode === 'class' && !!selectedDate && !!selectedClass) || (mode === 'test' && !!selectedTest),
        onSuccess: (data) => {
            const existingMap = {}
            data?.forEach(record => {
                existingMap[record.studentId._id] = record.status
            })
            setAttendance(existingMap)
        }
    })

    const filteredStudents = studentsData?.filter(s =>
        s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.roll?.toLowerCase().includes(studentSearch.toLowerCase())
    ) || []

    const handleTestSelect = (testId) => {
        setSelectedTest(testId)
        const test = tests?.find(t => t._id === testId)
        if (test) setSelectedClass(test.class)
        setAttendance({})
    }

    const toggleAttendance = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }))
    }

    const markAll = (status) => {
        const newAttendance = {}
        filteredStudents.forEach(student => {
            newAttendance[student._id] = status
        })
        setAttendance(newAttendance)
    }

    const saveMutation = useMutation({
        mutationFn: async () => {
            const dataset = studentsData || []
            const students = dataset.map(student => ({
                studentId: student._id,
                status: attendance[student._id] || 'absent'
            }))
            const response = await api.post('/attendance/bulk', {
                type: mode,
                date: selectedDate,
                class: selectedClass,
                testId: mode === 'test' ? selectedTest : undefined,
                students
            })
            return response.data
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Attendance saved!')
            queryClient.invalidateQueries(['existing-attendance'])
            queryClient.invalidateQueries(['attendance-stats'])
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to save attendance')
        }
    })

    const presentCount = Object.values(attendance).filter(s => s === 'present').length
    const absentCount = Object.values(attendance).filter(s => s === 'absent').length
    const lateCount = Object.values(attendance).filter(s => s === 'late').length
    const isReady = mode === 'class' ? (selectedDate && selectedClass) : selectedTest

    return (
        <div className="space-y-6">
            {/* Mode Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => { setMode('class'); setAttendance({}) }}
                    className={`btn flex items-center gap-2 ${mode === 'class' ? 'btn-primary' : 'btn-outline'}`}
                >
                    <Calendar size={18} />
                    Class Attendance
                </button>
                <button
                    onClick={() => { setMode('test'); setAttendance({}) }}
                    className={`btn flex items-center gap-2 ${mode === 'test' ? 'btn-primary' : 'btn-outline'}`}
                >
                    <FileText size={18} />
                    Test Attendance
                </button>
            </div>

            <div className="card p-6">
                {/* Filters */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                    {mode === 'class' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => { setSelectedDate(e.target.value); setAttendance({}) }}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => { setSelectedClass(e.target.value); setAttendance({}) }}
                                    className="input"
                                >
                                    <option value="">Select Class</option>
                                    {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                                        <option key={c} value={c}>Class {c}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Test *</label>
                                <select
                                    value={selectedTest}
                                    onChange={(e) => handleTestSelect(e.target.value)}
                                    className="input"
                                >
                                    <option value="">Select Test</option>
                                    {tests?.map(test => (
                                        <option key={test._id} value={test._id}>
                                            {test.testName} - Class {test.class} ({new Date(test.date).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Filter Class</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => { setSelectedClass(e.target.value); setAttendance({}) }}
                                    className="input"
                                >
                                    <option value="">All Classes</option>
                                    {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                                        <option key={c} value={c}>Class {c}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="input pl-10"
                                placeholder="Name or Roll..."
                            />
                        </div>
                    </div>
                </div>

                {/* Quick actions */}
                {isReady && filteredStudents.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg gap-3">
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-sm text-gray-600">
                                <Users size={16} className="inline mr-1" />
                                {filteredStudents.length} students
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                                <CheckCircle size={16} className="inline mr-1" />
                                {presentCount} present
                            </span>
                            <span className="text-sm text-red-600 font-medium">
                                <XCircle size={16} className="inline mr-1" />
                                {absentCount} absent
                            </span>
                            {lateCount > 0 && (
                                <span className="text-sm text-amber-600 font-medium">
                                    <Clock size={16} className="inline mr-1" />
                                    {lateCount} late
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => markAll('present')} className="btn btn-outline py-1 px-3 text-sm text-green-600 border-green-300 hover:bg-green-50">
                                <CheckCircle size={14} /> All Present
                            </button>
                            <button onClick={() => markAll('absent')} className="btn btn-outline py-1 px-3 text-sm text-red-600 border-red-300 hover:bg-red-50">
                                <XCircle size={14} /> All Absent
                            </button>
                            <button onClick={() => markAll('late')} className="btn btn-outline py-1 px-3 text-sm text-amber-600 border-amber-300 hover:bg-amber-50">
                                <Clock size={14} /> All Late
                            </button>
                        </div>
                    </div>
                )}

                {/* Student list */}
                {isReady ? (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto">
                            <table className="table">
                                <thead className="sticky top-0 bg-gray-50">
                                    <tr>
                                        <th>Student</th>
                                        <th className="text-center w-56">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingStudents ? (
                                        <tr>
                                            <td colSpan={2} className="text-center py-8">
                                                <div className="spinner mx-auto"></div>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="text-center py-8 text-gray-500">
                                                No students found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map(student => (
                                            <tr key={student._id} className="hover:bg-gray-50/50">
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-semibold">
                                                            {student.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{student.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm text-gray-500">{student.roll}</p>
                                                                {student.status !== 'active' && (
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${student.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                                                                        student.status === 'suspended' ? 'bg-red-100 text-red-600' :
                                                                            'bg-yellow-100 text-yellow-700'
                                                                        }`}>
                                                                        {student.status.replace('_', ' ')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => toggleAttendance(student._id, 'present')}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${attendance[student._id] === 'present'
                                                                ? 'bg-green-500 text-white shadow-sm'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                                                                }`}
                                                        >
                                                            <CheckCircle size={14} className="inline mr-1" />
                                                            P
                                                        </button>
                                                        <button
                                                            onClick={() => toggleAttendance(student._id, 'late')}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${attendance[student._id] === 'late'
                                                                ? 'bg-amber-500 text-white shadow-sm'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-amber-100'
                                                                }`}
                                                        >
                                                            <Clock size={14} className="inline mr-1" />
                                                            L
                                                        </button>
                                                        <button
                                                            onClick={() => toggleAttendance(student._id, 'absent')}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${attendance[student._id] === 'absent'
                                                                ? 'bg-red-500 text-white shadow-sm'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                                                                }`}
                                                        >
                                                            <XCircle size={14} className="inline mr-1" />
                                                            A
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                        <ClipboardCheck size={48} className="mx-auto text-gray-300 mb-4" />
                        <p>Select {mode === 'class' ? 'date and class' : 'a test'} to mark attendance</p>
                    </div>
                )}

                {/* Save button */}
                {studentsData?.length > 0 && (
                    <div className="flex justify-end mt-6 pt-4 border-t">
                        <button
                            onClick={() => saveMutation.mutate()}
                            disabled={saveMutation.isPending}
                            className="btn btn-primary"
                        >
                            {saveMutation.isPending ? (
                                <>
                                    <span className="spinner w-4 h-4 border-2"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Attendance
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Attendance History Tab ─────────────────────────────────────────
const AttendanceHistoryTab = ({ onEditSession }) => {
    const [typeFilter, setTypeFilter] = useState('all')
    const [classFilter, setClassFilter] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [page, setPage] = useState(1)

    const { data: historyResponse, isLoading } = useQuery({
        queryKey: ['attendance-history', typeFilter, classFilter, startDate, endDate, page],
        queryFn: async () => {
            const params = new URLSearchParams({ page, limit: 15 })
            if (typeFilter !== 'all') params.set('type', typeFilter)
            if (classFilter) params.set('class', classFilter)
            if (startDate) params.set('startDate', startDate)
            if (endDate) params.set('endDate', endDate)
            const response = await api.get(`/attendance/history?${params}`)
            return response.data.data
        }
    })

    const history = historyResponse?.history || []
    const pagination = historyResponse?.pagination || { page: 1, pages: 1, total: 0 }

    const clearFilters = () => {
        setTypeFilter('all')
        setClassFilter('')
        setStartDate('')
        setEndDate('')
        setPage(1)
    }

    return (
        <div className="card p-6">
            {/* Filters */}
            <div className="grid md:grid-cols-5 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                        className="input"
                    >
                        <option value="all">All Types</option>
                        <option value="class">Class</option>
                        <option value="test">Test</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                    <select
                        value={classFilter}
                        onChange={(e) => { setClassFilter(e.target.value); setPage(1) }}
                        className="input"
                    >
                        <option value="">All Classes</option>
                        {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                            <option key={c} value={c}>Class {c}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
                        className="input"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
                        className="input"
                    />
                </div>
                <div className="flex items-end">
                    <button onClick={clearFilters} className="btn btn-outline w-full">
                        <Filter size={16} /> Clear
                    </button>
                </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                    Showing {history.length} of {pagination.total} sessions
                </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border rounded-lg">
                <table className="table">
                    <thead className="bg-gray-50">
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Detail</th>
                            <th className="text-center">Present</th>
                            <th className="text-center">Late</th>
                            <th className="text-center">Absent</th>
                            <th className="text-center">Rate</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={8} className="text-center py-8"><div className="spinner mx-auto"></div></td></tr>
                        ) : history.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-8 text-gray-500">No attendance history found</td></tr>
                        ) : (
                            history.map((item, idx) => {
                                const rate = item.totalStudents > 0
                                    ? Math.round(((item.present + (item.late || 0)) / item.totalStudents) * 100)
                                    : 0
                                return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="font-medium">{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                        <td>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${item.type === 'class'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {item.type === 'class' ? <Calendar size={12} /> : <FileText size={12} />}
                                                {item.type}
                                            </span>
                                        </td>
                                        <td>
                                            {item.type === 'class' ? `Class ${item.class}` : item.testName || 'Unknown test'}
                                        </td>
                                        <td className="text-center">
                                            <span className="text-green-600 font-semibold">{item.present}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="text-amber-600 font-semibold">{item.late || 0}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="text-red-600 font-semibold">{item.absent}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${rate >= 80 ? 'bg-green-100 text-green-700' :
                                                rate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {rate}%
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => onEditSession(item)}
                                                className="btn btn-sm btn-outline flex items-center gap-1"
                                            >
                                                <Edit3 size={14} /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">
                        Page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="btn btn-outline btn-sm"
                        >
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                            disabled={page >= pagination.pages}
                            className="btn btn-outline btn-sm"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Attendance Editor Tab ──────────────────────────────────────────
const AttendanceEditorTab = ({ initialSession, onBack }) => {
    const queryClient = useQueryClient()
    const [editorMode, setEditorMode] = useState(initialSession ? 'loaded' : 'select')
    const [editType, setEditType] = useState(initialSession?.type || 'class')
    const [editDate, setEditDate] = useState(initialSession?.date ? new Date(initialSession.date).toISOString().split('T')[0] : '')
    const [editClass, setEditClass] = useState(initialSession?.class || '')
    const [editTest, setEditTest] = useState(initialSession?.testId || '')
    const [editAttendance, setEditAttendance] = useState({})
    const [editSearch, setEditSearch] = useState('')
    const [confirmSave, setConfirmSave] = useState(false)

    const { data: tests } = useQuery({
        queryKey: ['tests-for-editor'],
        queryFn: async () => {
            const response = await api.get('/tests?isPublished=true&limit=100')
            return response.data.data.tests
        }
    })

    // Fetch attendance records for the selected session
    const sessionReady = editType === 'class'
        ? (editDate && editClass)
        : !!editTest

    const { data: sessionRecords, isLoading: loadingRecords } = useQuery({
        queryKey: ['editor-records', editType, editDate, editClass, editTest],
        queryFn: async () => {
            const params = new URLSearchParams({ type: editType })
            if (editType === 'class') {
                params.set('date', editDate)
                params.set('class', editClass)
            } else {
                params.set('testId', editTest)
            }
            const response = await api.get(`/attendance?${params}`)
            return response.data.data.attendance
        },
        enabled: sessionReady && (editorMode === 'loaded' || editorMode === 'select'),
        onSuccess: (data) => {
            const map = {}
            data?.forEach(record => {
                if (record.studentId?._id) {
                    map[record.studentId._id] = record.status
                }
            })
            setEditAttendance(map)
            if (data?.length > 0) setEditorMode('loaded')
        }
    })

    const filteredRecords = (sessionRecords || [])
        .filter(record => record.studentId)
        .filter(record => {
            const name = record.studentId.name?.toLowerCase() || ''
            const roll = record.studentId.roll?.toLowerCase() || ''
            const search = editSearch.toLowerCase()
            return name.includes(search) || roll.includes(search)
        })

    const toggleEditAttendance = (studentId, status) => {
        setEditAttendance(prev => ({ ...prev, [studentId]: status }))
    }

    const markAllEdit = (status) => {
        const newAttendance = {}
        filteredRecords.forEach(record => {
            if (record.studentId?._id) {
                newAttendance[record.studentId._id] = status
            }
        })
        setEditAttendance(prev => ({ ...prev, ...newAttendance }))
    }

    const loadSession = () => {
        if (sessionReady) {
            setEditorMode('loaded')
            queryClient.invalidateQueries(['editor-records'])
        }
    }

    const saveEditMutation = useMutation({
        mutationFn: async () => {
            const students = filteredRecords.map(record => ({
                studentId: record.studentId._id,
                status: editAttendance[record.studentId._id] || record.status
            }))

            const sessionDate = editType === 'class'
                ? editDate
                : (filteredRecords[0]?.date ? new Date(filteredRecords[0].date).toISOString().split('T')[0] : editDate)

            const response = await api.post('/attendance/bulk', {
                type: editType,
                date: sessionDate,
                class: editClass || filteredRecords[0]?.class,
                testId: editType === 'test' ? editTest : undefined,
                students
            })
            return response.data
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Attendance updated successfully!')
            queryClient.invalidateQueries(['attendance-history'])
            queryClient.invalidateQueries(['attendance-stats'])
            queryClient.invalidateQueries(['editor-records'])
            setConfirmSave(false)
            if (onBack) onBack()
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update attendance')
            setConfirmSave(false)
        }
    })

    const presentCount = Object.values(editAttendance).filter(s => s === 'present').length
    const absentCount = Object.values(editAttendance).filter(s => s === 'absent').length
    const lateCount = Object.values(editAttendance).filter(s => s === 'late').length

    return (
        <div className="space-y-6">
            {/* Session Selector or Header */}
            {initialSession && onBack && (
                <button onClick={onBack} className="btn btn-outline btn-sm mb-2">
                    <ChevronLeft size={16} /> Back to History
                </button>
            )}

            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Pencil size={20} className="text-[var(--primary)]" />
                    {initialSession ? 'Editing Session' : 'Select Session to Edit'}
                </h3>

                {/* Session picker */}
                {!initialSession && (
                    <div className="grid md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select
                                value={editType}
                                onChange={(e) => { setEditType(e.target.value); setEditorMode('select'); setEditAttendance({}) }}
                                className="input"
                            >
                                <option value="class">Class</option>
                                <option value="test">Test</option>
                            </select>
                        </div>
                        {editType === 'class' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                                    <input
                                        type="date"
                                        value={editDate}
                                        onChange={(e) => { setEditDate(e.target.value); setEditorMode('select'); setEditAttendance({}) }}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                                    <select
                                        value={editClass}
                                        onChange={(e) => { setEditClass(e.target.value); setEditorMode('select'); setEditAttendance({}) }}
                                        className="input"
                                    >
                                        <option value="">Select Class</option>
                                        {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                                            <option key={c} value={c}>Class {c}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Test *</label>
                                <select
                                    value={editTest}
                                    onChange={(e) => {
                                        setEditTest(e.target.value)
                                        const test = tests?.find(t => t._id === e.target.value)
                                        if (test) setEditClass(test.class)
                                        setEditorMode('select')
                                        setEditAttendance({})
                                    }}
                                    className="input"
                                >
                                    <option value="">Select Test</option>
                                    {tests?.map(test => (
                                        <option key={test._id} value={test._id}>
                                            {test.testName} - Class {test.class} ({new Date(test.date).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex items-end">
                            <button
                                onClick={loadSession}
                                disabled={!sessionReady}
                                className="btn btn-primary w-full"
                            >
                                <Search size={16} /> Load Session
                            </button>
                        </div>
                    </div>
                )}

                {/* Session info header */}
                {(editorMode === 'loaded' || initialSession) && (
                    <div className="p-3 bg-blue-50 rounded-lg mb-4 flex items-center gap-2">
                        <Info size={16} className="text-blue-500" />
                        <span className="text-sm text-blue-700">
                            {editType === 'class'
                                ? `Editing Class ${editClass} attendance for ${new Date(editDate || initialSession?.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                                : `Editing attendance for "${initialSession?.testName || tests?.find(t => t._id === editTest)?.testName || 'Test'}"`
                            }
                        </span>
                    </div>
                )}

                {/* Search and actions */}
                {filteredRecords.length > 0 && (
                    <>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={editSearch}
                                    onChange={(e) => setEditSearch(e.target.value)}
                                    className="input pl-10 w-full"
                                    placeholder="Search student..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => markAllEdit('present')} className="btn btn-outline py-1.5 px-3 text-sm text-green-600 border-green-300 hover:bg-green-50">
                                    <CheckCircle size={14} /> All P
                                </button>
                                <button onClick={() => markAllEdit('late')} className="btn btn-outline py-1.5 px-3 text-sm text-amber-600 border-amber-300 hover:bg-amber-50">
                                    <Clock size={14} /> All L
                                </button>
                                <button onClick={() => markAllEdit('absent')} className="btn btn-outline py-1.5 px-3 text-sm text-red-600 border-red-300 hover:bg-red-50">
                                    <XCircle size={14} /> All A
                                </button>
                            </div>
                        </div>

                        {/* Stats bar */}
                        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                            <span className="text-gray-600">
                                <Users size={16} className="inline mr-1" />
                                {filteredRecords.length} students
                            </span>
                            <span className="text-green-600 font-medium">
                                <CheckCircle size={16} className="inline mr-1" />
                                {presentCount} present
                            </span>
                            <span className="text-amber-600 font-medium">
                                <Clock size={16} className="inline mr-1" />
                                {lateCount} late
                            </span>
                            <span className="text-red-600 font-medium">
                                <XCircle size={16} className="inline mr-1" />
                                {absentCount} absent
                            </span>
                        </div>
                    </>
                )}

                {/* Student list */}
                {loadingRecords ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="spinner"></div>
                    </div>
                ) : editorMode === 'loaded' && filteredRecords.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                        <p>No attendance records found for this session.</p>
                        <p className="text-sm mt-1">Mark attendance in the "Mark Attendance" tab first.</p>
                    </div>
                ) : filteredRecords.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto">
                            <table className="table">
                                <thead className="sticky top-0 bg-gray-50">
                                    <tr>
                                        <th>Student</th>
                                        <th className="text-center w-56">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map(record => {
                                        const student = record.studentId
                                        const currentStatus = editAttendance[student._id] || record.status
                                        return (
                                            <tr key={student._id} className="hover:bg-gray-50/50">
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-semibold text-sm">
                                                            {student.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{student.name}</p>
                                                            <p className="text-xs text-gray-500">{student.roll}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => toggleEditAttendance(student._id, 'present')}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${currentStatus === 'present'
                                                                ? 'bg-green-500 text-white shadow-sm'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                                                                }`}
                                                        >
                                                            <CheckCircle size={13} className="inline mr-1" />
                                                            Present
                                                        </button>
                                                        <button
                                                            onClick={() => toggleEditAttendance(student._id, 'late')}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${currentStatus === 'late'
                                                                ? 'bg-amber-500 text-white shadow-sm'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-amber-100'
                                                                }`}
                                                        >
                                                            <Clock size={13} className="inline mr-1" />
                                                            Late
                                                        </button>
                                                        <button
                                                            onClick={() => toggleEditAttendance(student._id, 'absent')}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${currentStatus === 'absent'
                                                                ? 'bg-red-500 text-white shadow-sm'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                                                                }`}
                                                        >
                                                            <XCircle size={13} className="inline mr-1" />
                                                            Absent
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : editorMode === 'select' ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                        <Pencil size={48} className="mx-auto text-gray-300 mb-4" />
                        <p>Select a session above and click "Load Session" to start editing</p>
                    </div>
                ) : null}

                {/* Save button */}
                {filteredRecords.length > 0 && (
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        {!confirmSave ? (
                            <button
                                onClick={() => setConfirmSave(true)}
                                className="btn btn-primary"
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        ) : (
                            <>
                                <span className="text-sm text-amber-600 flex items-center gap-1 mr-2">
                                    <AlertCircle size={16} /> Are you sure? This will overwrite existing records.
                                </span>
                                <button
                                    onClick={() => setConfirmSave(false)}
                                    className="btn btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => saveEditMutation.mutate()}
                                    disabled={saveEditMutation.isPending}
                                    className="btn btn-primary bg-amber-600 hover:bg-amber-700 border-amber-600"
                                >
                                    {saveEditMutation.isPending ? (
                                        <>
                                            <span className="spinner w-4 h-4 border-2"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} /> Confirm Save
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Main Component ─────────────────────────────────────────────────
const AttendanceManagement = () => {
    const [view, setView] = useState('mark') // 'mark' | 'history' | 'editor'
    const [editorSession, setEditorSession] = useState(null)

    const handleEditSession = (session) => {
        setEditorSession(session)
        setView('editor')
    }

    const handleBackFromEditor = () => {
        setEditorSession(null)
        setView('history')
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--primary)]">Attendance Management</h1>
                <p className="text-gray-500">Mark, review, and edit student attendance for classes and tests</p>
            </div>

            {/* Stats Dashboard */}
            <StatsDashboard />

            {/* View Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => { setView('mark'); setEditorSession(null) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'mark'
                        ? 'bg-white text-[var(--primary)] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <ClipboardCheck size={16} />
                    Mark Attendance
                </button>
                <button
                    onClick={() => { setView('history'); setEditorSession(null) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'history'
                        ? 'bg-white text-[var(--primary)] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <History size={16} />
                    Attendance History
                </button>
                <button
                    onClick={() => { setView('editor'); setEditorSession(null) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'editor'
                        ? 'bg-white text-[var(--primary)] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Pencil size={16} />
                    Attendance Editor
                </button>
            </div>

            {/* Tab Content */}
            {view === 'mark' && <MarkAttendanceTab />}
            {view === 'history' && <AttendanceHistoryTab onEditSession={handleEditSession} />}
            {view === 'editor' && (
                <AttendanceEditorTab
                    initialSession={editorSession}
                    onBack={editorSession ? handleBackFromEditor : null}
                />
            )}
        </div>
    )
}

export default AttendanceManagement
