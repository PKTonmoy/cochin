// Placeholder for EditStudent - similar to AddStudent but prefilled
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'

const EditStudent = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['student', id],
        queryFn: async () => {
            const response = await api.get(`/students/${id}`)
            return response.data.data
        }
    })

    const { register, handleSubmit, reset, formState: { errors } } = useForm()

    useEffect(() => {
        if (data?.student) {
            reset({
                ...data.student,
                dob: data.student.dob?.split('T')[0]
            })
        }
    }, [data, reset])

    const updateMutation = useMutation({
        mutationFn: async (formData) => {
            const response = await api.put(`/students/${id}`, formData)
            return response.data
        },
        onSuccess: () => {
            toast.success('Student updated successfully!')
            queryClient.invalidateQueries({ queryKey: ['students'] })
            queryClient.invalidateQueries({ queryKey: ['student', id] })
            navigate('/admin/students')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Update failed')
        }
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto animate-fadeIn">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary)]">Edit Student</h1>
                    <p className="text-gray-500">Update {data?.student?.name}'s information</p>
                </div>
            </div>

            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="card p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input {...register('name', { required: true })} className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input {...register('phone', { required: true })} className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select {...register('class')} className="input">
                            {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                                <option key={c} value={c}>Class {c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <input {...register('section')} className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                        <input {...register('fatherName')} className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
                        <input {...register('guardianPhone')} className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (৳)</label>
                        <input {...register('totalFee', { valueAsNumber: true })} type="number" className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input {...register('email')} type="email" className="input" />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                    <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                        <Save size={18} />
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default EditStudent
