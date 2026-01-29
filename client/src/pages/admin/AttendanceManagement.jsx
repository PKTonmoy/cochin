import { useState } from 'react'
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
    FileText
} from 'lucide-react'

const AttendanceManagement = () => {
    const queryClient = useQueryClient()
    const [view, setView] = useState('mark') // 'mark' | 'history'

    // History filters
    const [historyTypeFilter, setHistoryTypeFilter] = useState('all')
    const [historyClassFilter, setHistoryClassFilter] = useState('')
    const [historySearch, setHistorySearch] = useState('')

    const [mode, setMode] = useState('class') // 'class' or 'test'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedTest, setSelectedTest] = useState('')
    const [studentSearch, setStudentSearch] = useState('')
    const [attendance, setAttendance] = useState({}) // { studentId: 'present' | 'absent' }

    // History modal state
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null)
    const [historyAttendance, setHistoryAttendance] = useState({})
    const [historyStudentSearch, setHistoryStudentSearch] = useState('')

    // Fetch published tests
    const { data: tests } = useQuery({
        queryKey: ['tests-for-attendance'],
        queryFn: async () => {
            const response = await api.get('/tests?isPublished=true&limit=100')
            return response.data.data.tests
        }
    })

    // Fetch students (include all except 'inactive' - students with due can still attend)
    const { data: studentsData, isLoading: loadingStudents } = useQuery({
        queryKey: ['students-for-attendance', selectedClass],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: 200,
                // Don't filter by status - students with pending payment can still attend
                ...(selectedClass && { class: selectedClass })
            })
            const response = await api.get(`/students?${params}`)
            // Return all students regardless of status
            return response.data.data.students
        },
        enabled: !!selectedClass || mode === 'test'
    })

    // Fetch existing attendance for selected date/test
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
            // Populate attendance state from existing records
            const existingMap = {}
            data?.forEach(record => {
                existingMap[record.studentId._id] = record.status
            })
            setAttendance(existingMap)
        }
    })

    // Fetch attendance history
    const { data: historyData, isLoading: loadingHistory } = useQuery({
        queryKey: ['attendance-history'],
        queryFn: async () => {
            const response = await api.get('/attendance/history')
            return response.data.data
        },
        enabled: view === 'history'
    })

    // Fetch detailed attendance for history modal
    const { data: historyDetailData, isLoading: loadingHistoryDetail } = useQuery({
        queryKey: ['attendance-history-detail', selectedHistoryItem?.type, selectedHistoryItem?.date, selectedHistoryItem?.testId, selectedHistoryItem?.class],
        queryFn: async () => {
            const params = new URLSearchParams({
                type: selectedHistoryItem.type,
                ...(selectedHistoryItem.type === 'class' && { date: selectedHistoryItem.date.split('T')[0], class: selectedHistoryItem.class }),
                ...(selectedHistoryItem.type === 'test' && { testId: selectedHistoryItem.testId })
            })
            const response = await api.get(`/attendance?${params}`)
            return response.data.data.attendance
        },
        enabled: historyModalOpen && !!selectedHistoryItem,
        onSuccess: (data) => {
            // Populate attendance state from records
            const attendanceMap = {}
            data?.forEach(record => {
                if (record.studentId?._id) {
                    attendanceMap[record.studentId._id] = record.status
                }
            })
            setHistoryAttendance(attendanceMap)
        }
    })

    // Filter history data
    const filteredHistory = historyData?.filter(item => {
        if (historyTypeFilter !== 'all' && item.type !== historyTypeFilter) return false
        if (historyClassFilter && item.class !== historyClassFilter) return false

        if (historySearch) {
            const lowerSearch = historySearch.toLowerCase()
            const dateStr = new Date(item.date).toLocaleDateString()
            if (item.testName?.toLowerCase().includes(lowerSearch)) return true
            if (dateStr.includes(lowerSearch)) return true
            return false
        }
        return true
    }) || []

    // Get selected test details
    const selectedTestData = tests?.find(t => t._id === selectedTest)

    // Filter students by search
    const filteredStudents = studentsData?.filter(s =>
        s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.roll?.toLowerCase().includes(studentSearch.toLowerCase())
    ) || []

    // When test is selected, auto-set class filter
    const handleTestSelect = (testId) => {
        setSelectedTest(testId)
        const test = tests?.find(t => t._id === testId)
        if (test) {
            setSelectedClass(test.class)
        }
        setAttendance({})
    }

    // Toggle individual attendance
    const toggleAttendance = (studentId, status) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }))
    }

    // Mark all present/absent
    const markAll = (status) => {
        const newAttendance = {}
        filteredStudents.forEach(student => {
            newAttendance[student._id] = status
        })
        setAttendance(newAttendance)
    }

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            // Include ALL students in the current view/filter context
            // Default to 'absent' if not explicitly marked
            const dataset = studentsData || [];
            const students = dataset.map(student => ({
                studentId: student._id,
                status: attendance[student._id] || 'absent'
            }));

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
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to save attendance')
        }
    })

    // Open history modal
    const openHistoryModal = (item) => {
        setSelectedHistoryItem(item)
        setHistoryAttendance({})
        setHistoryStudentSearch('')
        setHistoryModalOpen(true)
    }

    // Toggle attendance in history modal
    const toggleHistoryAttendance = (studentId, status) => {
        setHistoryAttendance(prev => ({
            ...prev,
            [studentId]: status
        }))
    }

    // Filter students in history modal
    const filteredHistoryStudents = (historyDetailData || [])
        .filter(record => record.studentId)
        .filter(record => {
            const name = record.studentId.name?.toLowerCase() || ''
            const roll = record.studentId.roll?.toLowerCase() || ''
            const search = historyStudentSearch.toLowerCase()
            return name.includes(search) || roll.includes(search)
        })

    // Mark all in history modal
    const markAllHistory = (status) => {
        const newAttendance = {}
        filteredHistoryStudents.forEach(record => {
            if (record.studentId?._id) {
                newAttendance[record.studentId._id] = status
            }
        })
        setHistoryAttendance(prev => ({ ...prev, ...newAttendance }))
    }

    // Save history modal mutation
    const saveHistoryMutation = useMutation({
        mutationFn: async () => {
            const students = filteredHistoryStudents.map(record => ({
                studentId: record.studentId._id,
                status: historyAttendance[record.studentId._id] || record.status
            }))

            const response = await api.post('/attendance/bulk', {
                type: selectedHistoryItem.type,
                date: selectedHistoryItem.date.split('T')[0],
                class: selectedHistoryItem.class,
                testId: selectedHistoryItem.type === 'test' ? selectedHistoryItem.testId : undefined,
                students
            })
            return response.data
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Attendance updated!')
            queryClient.invalidateQueries(['attendance-history'])
            queryClient.invalidateQueries(['attendance-history-detail'])
            setHistoryModalOpen(false)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update attendance')
        }
    })

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--primary)]">Attendance Management</h1>
                <p className="text-gray-500">Mark student attendance for classes and tests</p>
            </div>

            {/* View Tabs */}
            <div className="flex gap-4 border-b">
                <button
                    onClick={() => setView('mark')}
                    className={`pb-2 px-1 ${view === 'mark'
                        ? 'border-b-2 border-[var(--primary)] text-[var(--primary)] font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Mark Attendance
                </button>
                <button
                    onClick={() => setView('history')}
                    className={`pb-2 px-1 ${view === 'history'
                        ? 'border-b-2 border-[var(--primary)] text-[var(--primary)] font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Attendance History
                </button>
            </div>

            {view === 'mark' ? (
                <div className="space-y-6">
                    {/* Mode Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setMode('class'); setAttendance({}); }}
                            className={`btn flex items-center gap-2 ${mode === 'class' ? 'btn-primary' : 'btn-outline'}`}
                        >
                            <Calendar size={18} />
                            Class Attendance
                        </button>
                        <button
                            onClick={() => { setMode('test'); setAttendance({}); }}
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
                                            onChange={(e) => { setSelectedDate(e.target.value); setAttendance({}); }}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => { setSelectedClass(e.target.value); setAttendance({}); }}
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
                                            onChange={(e) => { setSelectedClass(e.target.value); setAttendance({}); }}
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search Student</label>
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
                        {(mode === 'class' ? (selectedDate && selectedClass) : selectedTest) && filteredStudents.length > 0 && (
                            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600">
                                        <Users size={16} className="inline mr-1" />
                                        {filteredStudents.length} students
                                    </span>
                                    <span className="text-sm text-green-600">
                                        <CheckCircle size={16} className="inline mr-1" />
                                        {Object.values(attendance).filter(s => s === 'present').length} present
                                    </span>
                                    <span className="text-sm text-red-600">
                                        <XCircle size={16} className="inline mr-1" />
                                        {Object.values(attendance).filter(s => s === 'absent').length} absent
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => markAll('present')} className="btn btn-outline py-1 px-3 text-sm text-green-600 border-green-300 hover:bg-green-50">
                                        <CheckCircle size={14} /> Mark All Present
                                    </button>
                                    <button onClick={() => markAll('absent')} className="btn btn-outline py-1 px-3 text-sm text-red-600 border-red-300 hover:bg-red-50">
                                        <XCircle size={14} /> Mark All Absent
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Student list */}
                        {(mode === 'class' ? (selectedDate && selectedClass) : selectedTest) ? (
                            <div className="border rounded-lg overflow-hidden">
                                <div className="max-h-[400px] overflow-y-auto">
                                    <table className="table">
                                        <thead className="sticky top-0 bg-gray-50">
                                            <tr>
                                                <th>Student</th>
                                                <th className="text-center w-40">Status</th>
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
                                                    <tr key={student._id}>
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
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => toggleAttendance(student._id, 'present')}
                                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${attendance[student._id] === 'present'
                                                                        ? 'bg-green-500 text-white'
                                                                        : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                                                                        }`}
                                                                >
                                                                    <CheckCircle size={16} className="inline mr-1" />
                                                                    Present
                                                                </button>
                                                                <button
                                                                    onClick={() => toggleAttendance(student._id, 'absent')}
                                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${attendance[student._id] === 'absent'
                                                                        ? 'bg-red-500 text-white'
                                                                        : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                                                                        }`}
                                                                >
                                                                    <XCircle size={16} className="inline mr-1" />
                                                                    Absent
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
            ) : (
                <div className="card p-6">
                    {/* History Filters */}
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select
                                value={historyTypeFilter}
                                onChange={(e) => setHistoryTypeFilter(e.target.value)}
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
                                value={historyClassFilter}
                                onChange={(e) => setHistoryClassFilter(e.target.value)}
                                className="input"
                            >
                                <option value="">All Classes</option>
                                {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                                    <option key={c} value={c}>Class {c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="input pl-10"
                                    placeholder="Search by Test Name or Date..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Detail</th>
                                    <th className="text-center">Present</th>
                                    <th className="text-center">Absent</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingHistory ? (
                                    <tr><td colSpan={6} className="text-center py-8"><div className="spinner mx-auto"></div></td></tr>
                                ) : filteredHistory.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-500">No attendance history found</td></tr>
                                ) : (
                                    filteredHistory.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td>{new Date(item.date).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`badge ${item.type === 'class' ? 'badge-primary' : 'badge-secondary'}`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td>
                                                {item.type === 'class'
                                                    ? `Class ${item.class}`
                                                    : item.testName
                                                }
                                            </td>
                                            <td className="text-center text-green-600 font-medium">{item.present}</td>
                                            <td className="text-center text-red-600 font-medium">{item.absent}</td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => openHistoryModal(item)}
                                                    className="btn btn-sm btn-outline"
                                                >
                                                    View / Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {historyModalOpen && selectedHistoryItem && (
                <div className="modal-overlay" onClick={() => setHistoryModalOpen(false)}>
                    <div className="modal-content w-full max-w-3xl p-6 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                            <div>
                                <h3 className="text-xl font-bold text-[var(--primary)]">
                                    {selectedHistoryItem.type === 'class'
                                        ? `Class ${selectedHistoryItem.class} Attendance`
                                        : selectedHistoryItem.testName}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {new Date(selectedHistoryItem.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <button onClick={() => setHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        {/* Search and Quick Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={historyStudentSearch}
                                    onChange={(e) => setHistoryStudentSearch(e.target.value)}
                                    className="input pl-10 w-full"
                                    placeholder="Search student..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => markAllHistory('present')} className="btn btn-outline py-1.5 px-3 text-sm text-green-600 border-green-300 hover:bg-green-50">
                                    <CheckCircle size={14} /> All Present
                                </button>
                                <button onClick={() => markAllHistory('absent')} className="btn btn-outline py-1.5 px-3 text-sm text-red-600 border-red-300 hover:bg-red-50">
                                    <XCircle size={14} /> All Absent
                                </button>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                            <span className="text-gray-600">
                                <Users size={16} className="inline mr-1" />
                                {filteredHistoryStudents.length} students
                            </span>
                            <span className="text-green-600">
                                <CheckCircle size={16} className="inline mr-1" />
                                {Object.values(historyAttendance).filter(s => s === 'present').length || selectedHistoryItem.present} present
                            </span>
                            <span className="text-red-600">
                                <XCircle size={16} className="inline mr-1" />
                                {Object.values(historyAttendance).filter(s => s === 'absent').length || selectedHistoryItem.absent} absent
                            </span>
                        </div>

                        {/* Student List */}
                        <div className="flex-1 overflow-y-auto border rounded-lg">
                            {loadingHistoryDetail ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="spinner"></div>
                                </div>
                            ) : filteredHistoryStudents.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    No students found
                                </div>
                            ) : (
                                <table className="table">
                                    <thead className="sticky top-0 bg-gray-50">
                                        <tr>
                                            <th>Student</th>
                                            <th className="text-center w-48">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistoryStudents.map(record => {
                                            const student = record.studentId
                                            const currentStatus = historyAttendance[student._id] || record.status
                                            return (
                                                <tr key={student._id}>
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
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => toggleHistoryAttendance(student._id, 'present')}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${currentStatus === 'present'
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                                                                    }`}
                                                            >
                                                                <CheckCircle size={14} className="inline mr-1" />
                                                                Present
                                                            </button>
                                                            <button
                                                                onClick={() => toggleHistoryAttendance(student._id, 'absent')}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${currentStatus === 'absent'
                                                                    ? 'bg-red-500 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                                                                    }`}
                                                            >
                                                                <XCircle size={14} className="inline mr-1" />
                                                                Absent
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                            <button onClick={() => setHistoryModalOpen(false)} className="btn btn-outline">
                                Cancel
                            </button>
                            <button
                                onClick={() => saveHistoryMutation.mutate()}
                                disabled={saveHistoryMutation.isPending}
                                className="btn btn-primary"
                            >
                                {saveHistoryMutation.isPending ? (
                                    <>
                                        <span className="spinner w-4 h-4 border-2"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AttendanceManagement
