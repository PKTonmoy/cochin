import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import api, { apiUpload } from '../../lib/api'
import toast from 'react-hot-toast'
import {
    Upload,
    FileSpreadsheet,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Download,
    ArrowRight,
    RotateCcw,
    PenLine,
    Search,
    Save,
    Users
} from 'lucide-react'
import { CLASSES } from '../../data/classData'

const UploadResults = () => {
    const queryClient = useQueryClient()
    const [mode, setMode] = useState('upload') // 'upload' or 'manual'
    const [step, setStep] = useState(1) // 1: upload, 2: mapping, 3: validation, 4: complete
    const [uploadData, setUploadData] = useState(null)
    const [mapping, setMapping] = useState({})
    const [validationResult, setValidationResult] = useState(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [selectedTest, setSelectedTest] = useState('')
    const [selectedClass, setSelectedClass] = useState('')
    const [studentSearch, setStudentSearch] = useState('')
    const [manualResults, setManualResults] = useState({})

    // Fetch only PUBLISHED tests (completed)
    const { data: tests } = useQuery({
        queryKey: ['tests-for-upload'],
        queryFn: async () => {
            const response = await api.get('/tests?isPublished=true&limit=50')
            return response.data.data.tests
        }
    })

    // Fetch attendees for the selected test (with full student data)
    const { data: attendeesData, isLoading: loadingAttendees } = useQuery({
        queryKey: ['test-attendees', selectedTest],
        queryFn: async () => {
            const response = await api.get(`/attendance/test/${selectedTest}`)
            // The API returns attendees with student data spread at root level
            // Each attendee has _id (student's ID), name, roll, class, etc.
            return response.data.data.attendees || []
        },
        enabled: !!selectedTest && mode === 'manual'
    })

    // Get selected test details
    const selectedTestData = tests?.find(t => t._id === selectedTest)

    // Filter attendees by class and search
    const filteredStudents = (attendeesData || []).filter(student => {
        // Filter by class if selected
        if (selectedClass && student.class !== selectedClass) return false;

        // Filter by search
        const matchesSearch = student.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
            student.roll?.toLowerCase().includes(studentSearch.toLowerCase());

        return matchesSearch;
    })

    // Loading state for manual entry
    const loadingStudents = loadingAttendees

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            setUploadProgress(0)
            const response = await apiUpload('/uploads/results/upload', formData, (progress) => {
                setUploadProgress(progress)
            })

            setUploadData(response.data.data)
            setMapping(response.data.data.suggestedMapping || {})
            setStep(2)
            toast.success('File uploaded! Now map the columns.')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed')
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        maxFiles: 1
    })

    const validateMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/uploads/results/validate', {
                tempId: uploadData.tempId,
                mapping,
                testId: selectedTest
            })
            return response.data.data
        },
        onSuccess: (data) => {
            setValidationResult(data)
            setStep(3)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Validation failed')
        }
    })

    const importMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/uploads/results/import', {
                tempId: uploadData.tempId,
                testId: selectedTest
            })
            return response.data
        },
        onSuccess: (data) => {
            toast.success(data.message)
            queryClient.invalidateQueries(['results'])
            queryClient.invalidateQueries(['test-results'])
            setStep(4)
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Import failed')
        }
    })

    // Manual result save mutation
    const saveManualMutation = useMutation({
        mutationFn: async () => {
            const results = Object.entries(manualResults)
                .filter(([_, marks]) => Object.values(marks).some(m => m !== '' && m !== undefined))
                .map(([studentId, marks]) => ({
                    studentId,
                    testId: selectedTest,
                    marks
                }))

            const response = await api.post('/results/bulk', { results })
            return response.data
        },
        onSuccess: (data) => {
            toast.success(`${data.data?.count || 'Results'} saved successfully!`)
            setManualResults({})
            queryClient.invalidateQueries(['results'])
            queryClient.invalidateQueries(['test-results'])
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to save results')
        }
    })

    const handleManualMarkChange = (studentId, subject, value) => {
        setManualResults(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [subject]: value === '' ? '' : parseFloat(value) || 0
            }
        }))
    }

    const systemFields = [
        { value: 'roll', label: 'Roll Number', required: true },
        { value: 'name', label: 'Student Name' },
        { value: 'bangla', label: 'Bangla' },
        { value: 'english', label: 'English' },
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'science', label: 'Science' },
        { value: 'social_science', label: 'Social Science' },
        { value: 'religion', label: 'Religion' },
        { value: 'ict', label: 'ICT' },
        { value: 'physics', label: 'Physics' },
        { value: 'chemistry', label: 'Chemistry' },
        { value: 'biology', label: 'Biology' },
        { value: 'higher_math', label: 'Higher Math' },
        { value: 'ignore', label: '-- Ignore --' }
    ]

    const resetUpload = () => {
        setStep(1)
        setUploadData(null)
        setMapping({})
        setValidationResult(null)
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[var(--primary)]">Upload Results</h1>
                <p className="text-gray-500">Import test results from Excel file or add manually</p>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => { setMode('upload'); resetUpload(); }}
                    className={`btn flex items-center gap-2 ${mode === 'upload' ? 'btn-primary' : 'btn-outline'}`}
                >
                    <Upload size={18} />
                    Excel Upload
                </button>
                <button
                    onClick={() => setMode('manual')}
                    className={`btn flex items-center gap-2 ${mode === 'manual' ? 'btn-primary' : 'btn-outline'}`}
                >
                    <PenLine size={18} />
                    Manual Entry
                </button>
            </div>

            {/* === UPLOAD MODE === */}
            {mode === 'upload' && (
                <>
                    {/* Progress steps */}
                    <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {step > s ? <CheckCircle size={18} /> : s}
                                </div>
                                {s < 4 && <div className={`w-12 h-1 ${step > s ? 'bg-[var(--primary)]' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div className="card p-8">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Completed Test</label>
                                <select
                                    value={selectedTest}
                                    onChange={(e) => setSelectedTest(e.target.value)}
                                    className="input max-w-md"
                                >
                                    <option value="">-- No specific test --</option>
                                    {tests?.map((test) => (
                                        <option key={test._id} value={test._id}>
                                            {test.testName} - Class {test.class} ({new Date(test.date).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Only published/completed tests are shown</p>
                            </div>

                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[var(--primary)] bg-blue-50' : 'border-gray-300 hover:border-[var(--primary)]'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <FileSpreadsheet className="mx-auto text-gray-400 mb-4" size={48} />
                                <p className="text-lg font-medium text-gray-700">
                                    {isDragActive ? 'Drop your file here' : 'Drag & drop Excel file here'}
                                </p>
                                <p className="text-gray-500 mt-2">or click to browse</p>
                                <p className="text-sm text-gray-400 mt-4">Supports: .xlsx, .xls, .csv</p>
                            </div>

                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="mt-4">
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--primary)] transition-all" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                                </div>
                            )}

                            <div className="mt-6 flex justify-center">
                                <a href="/api/uploads/template" download className="btn btn-outline">
                                    <Download size={18} />
                                    Download Template
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Mapping */}
                    {step === 2 && uploadData && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-lg mb-4">Map Columns</h3>
                            <p className="text-gray-500 mb-6">Match your Excel columns to system fields</p>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {uploadData.headers.map((header) => (
                                    <div key={header.column} className="flex items-center gap-4">
                                        <div className="w-1/3">
                                            <span className="font-medium">{header.name}</span>
                                        </div>
                                        <ArrowRight className="text-gray-400" size={20} />
                                        <div className="flex-1">
                                            <select
                                                value={mapping[header.name] || ''}
                                                onChange={(e) => setMapping({ ...mapping, [header.name]: e.target.value })}
                                                className="input"
                                            >
                                                <option value="">-- Select field --</option>
                                                {systemFields.map((field) => (
                                                    <option key={field.value} value={field.value}>
                                                        {field.label} {field.required && '*'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between mt-6 pt-4 border-t">
                                <button onClick={resetUpload} className="btn btn-outline">
                                    <RotateCcw size={18} />
                                    Start Over
                                </button>
                                <button
                                    onClick={() => validateMutation.mutate()}
                                    disabled={!mapping.roll || validateMutation.isPending}
                                    className="btn btn-primary"
                                >
                                    {validateMutation.isPending ? (
                                        <span className="spinner w-5 h-5 border-2"></span>
                                    ) : (
                                        <>Validate</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Validation Results */}
                    {step === 3 && validationResult && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-lg mb-4">Validation Results</h3>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-green-50 rounded-lg text-center">
                                    <CheckCircle className="mx-auto text-green-500 mb-2" size={24} />
                                    <p className="text-2xl font-bold text-green-600">{validationResult.summary.valid}</p>
                                    <p className="text-sm text-green-700">Valid Rows</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-lg text-center">
                                    <XCircle className="mx-auto text-red-500 mb-2" size={24} />
                                    <p className="text-2xl font-bold text-red-600">{validationResult.summary.errors}</p>
                                    <p className="text-sm text-red-700">Errors</p>
                                </div>
                                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                                    <AlertTriangle className="mx-auto text-yellow-500 mb-2" size={24} />
                                    <p className="text-2xl font-bold text-yellow-600">{validationResult.summary.warnings}</p>
                                    <p className="text-sm text-yellow-700">Updates</p>
                                </div>
                            </div>

                            {validationResult.errors.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-red-600 mb-2">Errors (first 10):</h4>
                                    <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto text-sm">
                                        {validationResult.errors.slice(0, 10).map((error, i) => (
                                            <p key={i} className="text-red-700">Row {error.row}: {error.message}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between mt-6 pt-4 border-t">
                                <button onClick={() => setStep(2)} className="btn btn-outline">
                                    Back to Mapping
                                </button>
                                <button
                                    onClick={() => importMutation.mutate()}
                                    disabled={validationResult.summary.valid === 0 || importMutation.isPending}
                                    className="btn btn-primary"
                                >
                                    {importMutation.isPending ? (
                                        <span className="spinner w-5 h-5 border-2"></span>
                                    ) : (
                                        <>Import {validationResult.summary.valid} Rows</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {step === 4 && (
                        <div className="card p-8 text-center">
                            <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                            <h3 className="text-2xl font-bold text-green-600 mb-2">Import Complete!</h3>
                            <p className="text-gray-600 mb-6">Results have been imported successfully.</p>
                            <button onClick={resetUpload} className="btn btn-primary">
                                Upload Another File
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* === MANUAL ENTRY MODE === */}
            {mode === 'manual' && (
                <div className="card p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Users size={24} className="text-[var(--primary)]" />
                        <h3 className="font-semibold text-lg">Manual Result Entry</h3>
                    </div>

                    {/* Filters */}
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Completed Test *</label>
                            <select
                                value={selectedTest}
                                onChange={(e) => setSelectedTest(e.target.value)}
                                className="input"
                            >
                                <option value="">-- Select test --</option>
                                {tests?.map((test) => (
                                    <option key={test._id} value={test._id}>
                                        {test.testName} - Class {test.class}
                                    </option>
                                ))}
                            </select>
                            {selectedTest && attendeesData && (
                                <p className={`text-xs mt-1 ${attendeesData.length === 0 ? 'text-red-500 font-medium' : 'text-blue-600'}`}>
                                    {attendeesData.length === 0
                                        ? 'Warning: No students marked present for this test!'
                                        : `Only showing ${attendeesData.length} students who attended this test`}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Only published/completed tests</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="input"
                            >
                                <option value="">All Classes</option>
                                {CLASSES.map(c => (
                                    <option key={c} value={c}>{c}</option>
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
                                    placeholder="Name or Roll..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Student list with mark inputs */}
                    {selectedTest && selectedTestData ? (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="table">
                                    <thead className="sticky top-0 bg-gray-50">
                                        <tr>
                                            <th>Student</th>
                                            {selectedTestData.subjects?.map((subject) => (
                                                <th key={subject.name} className="text-center">
                                                    {subject.name}
                                                    <br />
                                                    <span className="text-xs text-gray-400 font-normal">/{subject.maxMarks}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingStudents ? (
                                            <tr>
                                                <td colSpan={1 + (selectedTestData.subjects?.length || 0)} className="text-center py-8">
                                                    <div className="spinner mx-auto"></div>
                                                </td>
                                            </tr>
                                        ) : filteredStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan={1 + (selectedTestData.subjects?.length || 0)} className="text-center py-8 text-gray-500">
                                                    No students found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStudents.map((student) => (
                                                <tr key={student._id}>
                                                    <td>
                                                        <div>
                                                            <p className="font-medium">{student.name}</p>
                                                            <p className="text-sm text-gray-500">{student.roll}</p>
                                                        </div>
                                                    </td>
                                                    {selectedTestData.subjects?.map((subject) => (
                                                        <td key={subject.name} className="text-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={subject.maxMarks}
                                                                value={manualResults[student._id]?.[subject.name] ?? ''}
                                                                onChange={(e) => handleManualMarkChange(student._id, subject.name, e.target.value)}
                                                                className="input w-20 text-center py-1"
                                                                placeholder="--"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                            <PenLine size={48} className="mx-auto text-gray-300 mb-4" />
                            <p>Select a completed test to enter marks for students</p>
                        </div>
                    )}

                    {/* Save button */}
                    {selectedTest && Object.keys(manualResults).length > 0 && (
                        <div className="flex justify-end mt-6 pt-4 border-t">
                            <button
                                onClick={() => saveManualMutation.mutate()}
                                disabled={saveManualMutation.isPending}
                                className="btn btn-primary"
                            >
                                {saveManualMutation.isPending ? (
                                    <>
                                        <span className="spinner w-4 h-4 border-2"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Results
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default UploadResults
