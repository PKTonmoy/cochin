import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'

const AddTest = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { register, handleSubmit, control, formState: { errors } } = useForm({
        defaultValues: {
            subjects: [{ name: '', maxMarks: 100, passMarks: 33 }]
        }
    })

    const { fields, append, remove } = useFieldArray({ control, name: 'subjects' })

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/tests', data)
            return response.data
        },
        onSuccess: () => {
            toast.success('Test created successfully!')
            queryClient.invalidateQueries({ queryKey: ['tests'] })
            navigate('/admin/tests')
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create test')
        }
    })

    return (
        <div className="max-w-3xl mx-auto animate-fadeIn">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary)]">Create Test</h1>
                    <p className="text-gray-500">Add a new exam or test</p>
                </div>
            </div>

            <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="card p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Name *</label>
                        <input
                            {...register('testName', { required: 'Test name is required' })}
                            className={`input ${errors.testName ? 'input-error' : ''}`}
                            placeholder="e.g., Weekly Test - Week 1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                        <select {...register('class', { required: true })} className="input">
                            {['6', '7', '8', '9', '10', '11', '12'].map(c => (
                                <option key={c} value={c}>Class {c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                        <input {...register('date', { required: true })} type="date" className="input" />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">Subjects</h3>
                        <button
                            type="button"
                            onClick={() => append({ name: '', maxMarks: 100, passMarks: 33 })}
                            className="btn btn-outline btn-sm"
                        >
                            <Plus size={16} /> Add Subject
                        </button>
                    </div>
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm text-gray-600 mb-1">Subject Name</label>
                                    <input
                                        {...register(`subjects.${index}.name`, { required: true })}
                                        className="input"
                                        placeholder="e.g., Mathematics"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-sm text-gray-600 mb-1">Max Marks</label>
                                    <input
                                        {...register(`subjects.${index}.maxMarks`, { valueAsNumber: true })}
                                        type="number"
                                        className="input"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-sm text-gray-600 mb-1">Pass Marks</label>
                                    <input
                                        {...register(`subjects.${index}.passMarks`, { valueAsNumber: true })}
                                        type="number"
                                        className="input"
                                    />
                                </div>
                                {fields.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                    <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                        <Save size={18} />
                        {createMutation.isPending ? 'Creating...' : 'Create Test'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default AddTest
