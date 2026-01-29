import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import {
    Search,
    Download,
    Trophy,
    TrendingUp,
    Users,
    AlertCircle,
    FileText,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    MoreVertical,
    FileSpreadsheet,
    Award,
    BarChart3,
    X,
    Save
} from 'lucide-react'

const ResultList = () => {
    const queryClient = useQueryClient()
    const [selectedTest, setSelectedTest] = useState('')
    const [studentSearch, setStudentSearch] = useState('')
    const [classFilter, setClassFilter] = useState('')
    const [editingResult, setEditingResult] = useState(null)
    const [editMarks, setEditMarks] = useState({})
    const [showStatsModal, setShowStatsModal] = useState(false)

    // Fetch published tests
    const { data: tests } = useQuery({
        queryKey: ['tests-for-results'],
        queryFn: async () => {
            const response = await api.get('/tests?limit=100')
            return response.data.data.tests
        }
    })

    // Fetch results for selected test
    const { data: resultData, isLoading, refetch } = useQuery({
        queryKey: ['test-results', selectedTest],
        queryFn: async () => {
            const response = await api.get(`/results/test/${selectedTest}`)
            return response.data.data
        },
        enabled: !!selectedTest
    })

    // Fetch merit list with stats
    const { data: meritData } = useQuery({
        queryKey: ['merit-list', selectedTest],
        queryFn: async () => {
            const response = await api.get(`/results/merit-list/${selectedTest}`)
            return response.data.data
        },
        enabled: !!selectedTest
    })

    // Publish/unpublish mutation
    const publishMutation = useMutation({
        mutationFn: async ({ testId, publish }) => {
            const response = await api.post(`/results/publish/${testId}`, { publish })
            return response.data
        },
        onSuccess: (data) => {
            toast.success(data.message)
            queryClient.invalidateQueries(['tests-for-results'])
            queryClient.invalidateQueries(['test-results'])
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update publish status')
        }
    })

    // Update result mutation
    const updateMutation = useMutation({
        mutationFn: async ({ resultId, data }) => {
            const response = await api.put(`/results/${resultId}`, data)
            return response.data
        },
        onSuccess: () => {
            toast.success('Result updated successfully')
            setEditingResult(null)
            setEditMarks({})
            refetch()
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update result')
        }
    })

    // Delete result mutation
    const deleteMutation = useMutation({
        mutationFn: async (resultId) => {
            const response = await api.delete(`/results/${resultId}`)
            return response.data
        },
        onSuccess: () => {
            toast.success('Result deleted')
            refetch()
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete result')
        }
    })

    // Export mutation
    const exportMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/results/export', { testId: selectedTest }, { responseType: 'blob' })
            return response.data
        },
        onSuccess: (data) => {
            const url = window.URL.createObjectURL(new Blob([data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `results-${selectedTest}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('Export downloaded')
        },
        onError: () => {
            toast.error('Export failed')
        }
    })

    // Download template
    const downloadTemplate = async () => {
        try {
            window.open(`/api/results/template/${selectedTest}`, '_blank')
        } catch {
            toast.error('Failed to download template')
        }
    }

    // Filter results
    const filteredResults = resultData?.results?.filter(result => {
        if (classFilter && result.studentId?.class !== classFilter) return false
        if (studentSearch) {
            const searchLower = studentSearch.toLowerCase()
            return (
                result.studentId?.name?.toLowerCase().includes(searchLower) ||
                result.studentId?.roll?.toLowerCase().includes(searchLower)
            )
        }
        return true
    }) || []

    const test = resultData?.test
    const stats = meritData?.statistics

    const selectedTestData = tests?.find(t => t._id === selectedTest)

    const handleEditClick = (result) => {
        setEditingResult(result)
        // Convert Map to object if needed
        const marks = result.subjectMarks || {}
        setEditMarks(typeof marks === 'object' ? marks : Object.fromEntries(marks))
    }

    const handleSaveEdit = () => {
        updateMutation.mutate({
            resultId: editingResult._id,
            data: {
                subjectMarks: editMarks,
                reason: 'Admin edit'
            }
        })
    }

    const getGradeColor = (grade) => {
        const colors = {
            'A+': 'bg-emerald-100 text-emerald-700',
            'A': 'bg-green-100 text-green-700',
            'A-': 'bg-blue-100 text-blue-700',
            'B': 'bg-yellow-100 text-yellow-700',
            'C': 'bg-orange-100 text-orange-700',
            'D': 'bg-red-100 text-red-600',
            'F': 'bg-red-200 text-red-800'
        }
        return colors[grade] || 'bg-gray-100 text-gray-700'
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary)] flex items-center gap-2">
                        <BarChart3 className="text-[var(--secondary)]" />
                        Results Management
                    </h1>
                    <p className="text-gray-500">View, edit, and manage test results</p>
                </div>
                {selectedTest && selectedTestData && (
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Publish Status Badge & Toggle */}
                        <button
                            onClick={() => publishMutation.mutate({
                                testId: selectedTest,
                                publish: !selectedTestData.isPublished
                            })}
                            disabled={publishMutation.isPending}
                            className={`btn gap-2 ${selectedTestData.isPublished
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {selectedTestData.isPublished ? (
                                <>
                                    <Eye size={18} />
                                    Published
                                </>
                            ) : (
                                <>
                                    <EyeOff size={18} />
                                    Unpublished
                                </>
                            )}
                        </button>
                        <button
                            onClick={downloadTemplate}
                            className="btn btn-outline gap-2"
                        >
                            <FileSpreadsheet size={18} />
                            Template
                        </button>
                        <button
                            onClick={() => exportMutation.mutate()}
                            disabled={exportMutation.isPending}
                            className="btn btn-primary gap-2"
                        >
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                )}
            </div>

            <div className="card p-6">
                {/* Filters */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Test</label>
                        <select
                            value={selectedTest}
                            onChange={(e) => setSelectedTest(e.target.value)}
                            className="input"
                        >
                            <option value="">Select a Test</option>
                            {tests?.map(t => (
                                <option key={t._id} value={t._id}>
                                    {t.testName} - Class {t.class}
                                    {t.isPublished ? ' ✓' : ' (Draft)'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter Class</label>
                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="input"
                        >
                            <option value="">All Classes</option>
                            {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                                <option key={c} value={c}>Class {c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Student</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="input pl-10"
                                placeholder="Name or Roll Number..."
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {!selectedTest ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Test Selected</h3>
                        <p>Please select a test from the dropdown to view results</p>
                    </div>
                ) : isLoading ? (
                    <div className="text-center py-12">
                        <div className="spinner mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading results...</p>
                    </div>
                ) : !resultData ? (
                    <div className="text-center py-12 text-gray-500">
                        <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                        <p>No data found for this test</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl">
                                <Users size={20} className="mb-2 opacity-80" />
                                <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                                <p className="text-sm opacity-80">Total Students</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl">
                                <Trophy size={20} className="mb-2 opacity-80" />
                                <p className="text-2xl font-bold">{stats?.highestScore || 0}</p>
                                <p className="text-sm opacity-80">Highest</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl">
                                <TrendingUp size={20} className="mb-2 opacity-80" />
                                <p className="text-2xl font-bold">{stats?.averageScore || 0}</p>
                                <p className="text-sm opacity-80">Average</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl">
                                <Award size={20} className="mb-2 opacity-80" />
                                <p className="text-2xl font-bold">{stats?.passPercentage || 0}%</p>
                                <p className="text-sm opacity-80">Pass Rate</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-red-400 to-rose-600 text-white rounded-xl">
                                <AlertCircle size={20} className="mb-2 opacity-80" />
                                <p className="text-2xl font-bold">{stats?.absentCount || 0}</p>
                                <p className="text-sm opacity-80">Absent</p>
                            </div>
                        </div>

                        {/* Topper Highlight */}
                        {meritData?.topper && (
                            <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                                    <Trophy className="text-yellow-900" size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-yellow-700 font-medium">🏆 Topper</p>
                                    <p className="font-bold text-lg text-gray-800">{meritData.topper.name}</p>
                                    <p className="text-sm text-gray-500">Roll: {meritData.topper.roll}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-[var(--primary)]">
                                        {meritData.topper.totalMarks}/{meritData.topper.maxMarks}
                                    </p>
                                    <p className="text-sm text-gray-500">{meritData.topper.percentage}%</p>
                                </div>
                            </div>
                        )}

                        {/* Result Table */}
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="table">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="w-16 text-center">Rank</th>
                                        <th>Student</th>
                                        {test?.subjects?.map(subject => (
                                            <th key={subject.name} className="text-center">
                                                {subject.name}
                                                <span className="block text-xs font-normal text-gray-500">/{subject.maxMarks}</span>
                                            </th>
                                        ))}
                                        <th className="text-center bg-gray-100">Total</th>
                                        <th className="text-center">%</th>
                                        <th className="text-center">Grade</th>
                                        <th className="w-20 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResults.length === 0 ? (
                                        <tr>
                                            <td colSpan={100} className="text-center py-8 text-gray-500">
                                                No results found matching your filters
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredResults.map((result) => (
                                            <tr key={result._id} className={`hover:bg-gray-50 ${result.isAbsent ? 'bg-red-50' : ''}`}>
                                                <td className="text-center font-bold text-gray-500">
                                                    {result.isAbsent ? '-' : `#${result.rank}`}
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${result.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                                                                result.rank === 2 ? 'bg-gray-300 text-gray-700' :
                                                                    result.rank === 3 ? 'bg-amber-600 text-white' :
                                                                        'bg-[var(--primary)] text-white'
                                                            }`}>
                                                            {result.studentId?.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{result.studentId?.name}</p>
                                                            <p className="text-xs text-gray-500">{result.studentId?.roll}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {test?.subjects?.map(subject => (
                                                    <td key={subject.name} className="text-center">
                                                        {result.isAbsent ? '-' : (result.subjectMarks?.[subject.name] ?? '-')}
                                                    </td>
                                                ))}
                                                <td className="text-center font-bold bg-gray-50 text-[var(--primary)]">
                                                    {result.isAbsent ? 'Absent' : result.totalMarks}
                                                </td>
                                                <td className="text-center font-medium">
                                                    {result.isAbsent ? '-' : `${result.percentage}%`}
                                                </td>
                                                <td className="text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                                                        {result.isAbsent ? 'ABS' : result.grade}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleEditClick(result)}
                                                            className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this result?')) {
                                                                    deleteMutation.mutate(result._id)
                                                                }
                                                            }}
                                                            className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
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
                )}
            </div>

            {/* Edit Modal */}
            {editingResult && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-bold text-lg">Edit Result</h3>
                            <button
                                onClick={() => setEditingResult(null)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium">{editingResult.studentId?.name}</p>
                                <p className="text-sm text-gray-500">Roll: {editingResult.studentId?.roll}</p>
                            </div>

                            <div className="space-y-3">
                                {test?.subjects?.map(subject => (
                                    <div key={subject.name}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {subject.name} (Max: {subject.maxMarks})
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={subject.maxMarks}
                                            value={editMarks[subject.name] ?? ''}
                                            onChange={(e) => setEditMarks({
                                                ...editMarks,
                                                [subject.name]: parseFloat(e.target.value) || 0
                                            })}
                                            className="input"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                onClick={() => setEditingResult(null)}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={updateMutation.isPending}
                                className="btn btn-primary gap-2"
                            >
                                {updateMutation.isPending ? (
                                    <span className="spinner w-4 h-4 border-2"></span>
                                ) : (
                                    <Save size={18} />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ResultList
