import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import ReceiptModal from '../../components/ReceiptModal'
import { CLASSES } from '../../data/classData'

const AddStudent = () => {
    // Force refresh
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [photoPreview, setPhotoPreview] = useState(null)
    const [photoFile, setPhotoFile] = useState(null)

    // Receipt modal state
    const [showReceiptModal, setShowReceiptModal] = useState(false)
    const [createdStudent, setCreatedStudent] = useState(null)
    const [paymentData, setPaymentData] = useState(null)

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            class: '',
            gender: 'male',
            totalFee: 0,
            advancePayment: 0,
            paymentMethod: 'cash'
        }
    })

    // Watch values for dynamic info message
    const watchTotalFee = watch('totalFee') || 0
    const watchAdvance = watch('advancePayment') || 0
    const watchDeadline = watch('paymentDeadline')

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const formData = new FormData()
            Object.keys(data).forEach(key => {
                if (data[key]) formData.append(key, data[key])
            })
            if (photoFile) {
                formData.append('photo', photoFile)
            }
            const response = await api.post('/students', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            return response.data
        },
        onSuccess: (data, variables) => {
            toast.success('Student created successfully!')
            queryClient.invalidateQueries({ queryKey: ['students'] })

            // Check if there's a payment (advance > 0)
            if (variables.advancePayment > 0 && data.data) {
                // Set up receipt modal data
                const studentInfo = {
                    ...data.data.student,
                    roll: data.data.credentials?.roll || data.data.student?.roll,
                    phone: variables.phone
                }

                setCreatedStudent(studentInfo)
                setPaymentData({
                    receiptId: data.data.payment?.receiptId,
                    totalFee: variables.totalFee,
                    amountPaid: variables.advancePayment,
                    paymentMethod: variables.paymentMethod || 'cash',
                    paymentDate: new Date().toISOString()
                })
                setShowReceiptModal(true)
            } else if (data.data?.credentials) {
                // No payment, just show credentials
                toast.success(`Roll: ${data.data.credentials.roll}, Password: ${data.data.credentials.password}`, {
                    duration: 10000
                })
                navigate('/admin/students')
            } else {
                navigate('/admin/students')
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create student')
        }
    })

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setPhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => setPhotoPreview(reader.result)
            reader.readAsDataURL(file)
        }
    }

    const onSubmit = (data) => {
        createMutation.mutate(data)
    }

    const handleReceiptModalClose = () => {
        setShowReceiptModal(false)
        navigate('/admin/students')
    }

    return (
        <>
            <div className="max-w-3xl mx-auto animate-fadeIn">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--primary)]">Add New Student</h1>
                        <p className="text-gray-500">Create a new student enrollment</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
                    {/* Photo upload */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload size={32} className="text-gray-400" />
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        <div>
                            <p className="font-medium">Student Photo</p>
                            <p className="text-sm text-gray-500">Click to upload (optional)</p>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Personal Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('name', { required: 'Name is required' })}
                                    className={`input ${errors.name ? 'input-error' : ''}`}
                                    placeholder="Student's full name"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select {...register('gender')} className="input">
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input {...register('dob')} type="date" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                                <input {...register('fatherName')} className="input" placeholder="Father's name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                                <input {...register('motherName')} className="input" placeholder="Mother's name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                                <input {...register('school')} className="input" placeholder="Current school" />
                            </div>
                        </div>
                    </div>

                    {/* Academic Information */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Academic Information</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Class <span className="text-red-500">*</span>
                                </label>
                                <select {...register('class', { required: true })} className="input">
                                    <option value="">Select Class</option>
                                    {CLASSES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                <input {...register('section')} className="input" placeholder="A, B, C..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                                <select {...register('group')} className="input">
                                    <option value="">Select group</option>
                                    <option value="Science">Science</option>
                                    <option value="Commerce">Commerce</option>
                                    <option value="Arts">Arts</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('phone', { required: 'Phone is required' })}
                                    className={`input ${errors.phone ? 'input-error' : ''}`}
                                    placeholder="01XXXXXXXXX"
                                />
                                <p className="text-xs text-gray-500 mt-1">This will be used as initial password</p>
                                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
                                <input {...register('guardianPhone')} className="input" placeholder="Guardian's phone" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input {...register('email')} type="email" className="input" placeholder="Email address" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input {...register('address')} className="input" placeholder="Home address" />
                            </div>
                        </div>
                    </div>

                    {/* Fee Information */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Fee Information</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (৳)</label>
                                <input
                                    {...register('totalFee', { valueAsNumber: true })}
                                    type="number"
                                    className="input"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Payment (৳)</label>
                                <input
                                    {...register('advancePayment', { valueAsNumber: true })}
                                    type="number"
                                    className="input"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">Amount paid during enrollment</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select {...register('paymentMethod')} className="input">
                                    <option value="cash">Cash</option>
                                    <option value="bkash">bKash</option>
                                    <option value="nagad">Nagad</option>
                                    <option value="rocket">Rocket</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="card">Card</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Deadline</label>
                                <input
                                    {...register('paymentDeadline')}
                                    type="date"
                                    className="input"
                                />
                                <p className="text-xs text-gray-500 mt-1">Deadline for remaining due amount</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <input {...register('notes')} className="input" placeholder="Any additional notes" />
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Info box */}
                    <div className={`border rounded-lg p-4 ${watchAdvance >= watchTotalFee && watchTotalFee > 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-amber-50 border-amber-200'
                        }`}>
                        <p className={`text-sm ${watchAdvance >= watchTotalFee && watchTotalFee > 0
                            ? 'text-green-800'
                            : 'text-amber-800'
                            }`}>
                            {watchAdvance >= watchTotalFee && watchTotalFee > 0 ? (
                                <>
                                    <strong>✓ Fully Paid:</strong> Student will be added as <strong>Active</strong> immediately.
                                    Login credentials will be generated. <strong>Receipt will be shown after creation.</strong>
                                </>
                            ) : watchAdvance > 0 ? (
                                <>
                                    <strong>⚡ Partial Payment:</strong> Student will be added with <strong>Due Payment</strong> status.
                                    Remaining: ৳{((watchTotalFee || 0) - (watchAdvance || 0)).toLocaleString()}
                                    {watchDeadline && ` • Deadline: ${new Date(watchDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                    <strong> • Receipt will be shown after creation.</strong>
                                </>
                            ) : (
                                <>
                                    <strong>⏳ Pending Payment:</strong> Student will be added with <strong>Pending Payment</strong> status.
                                    Verify payment later to activate account.
                                </>
                            )}
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? (
                                <>
                                    <span className="spinner w-5 h-5 border-2"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Create Student
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Receipt Modal */}
            <ReceiptModal
                isOpen={showReceiptModal}
                onClose={handleReceiptModalClose}
                paymentData={paymentData}
                studentData={createdStudent}
                showCredentials={true}
            />
        </>
    )
}

export default AddStudent
