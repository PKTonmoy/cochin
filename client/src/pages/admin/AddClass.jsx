/**
 * Add Class Page
 * Create a new class session
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    Save,
    AlertTriangle,
    Calendar,
    Clock,
    MapPin,
    Video,
    Users,
    FileText
} from 'lucide-react'
import api from '../../lib/api'
import { CLASSES } from '../../data/classData'

export default function AddClass() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [conflicts, setConflicts] = useState(null)
    const [isOnline, setIsOnline] = useState(false)

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            subject: '',
            class: '',
            section: '',
            instructorName: '',
            date: '',
            startTime: '',
            endTime: '',
            room: '',
            meetingLink: '',
            capacity: 0,
            description: ''
        }
    })

    const watchedValues = watch(['class', 'section', 'date', 'startTime', 'endTime', 'room'])

    // Check conflicts mutation
    const checkConflictsMutation = useMutation({
        mutationFn: (data) => api.post('/classes/check-conflicts', data),
        onSuccess: (response) => {
            setConflicts(response.data.data)
        }
    })

    // Create class mutation
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/classes', { ...data, isOnline, checkConflicts: true }),
        onSuccess: () => {
            toast.success('Class created successfully')
            queryClient.invalidateQueries({ queryKey: ['classes'] })
            navigate('/admin/classes')
        },
        onError: (error) => {
            if (error.response?.status === 409) {
                setConflicts(error.response.data.conflicts)
                toast.error('Schedule conflicts detected')
            } else {
                toast.error(error.response?.data?.message || 'Failed to create class')
            }
        }
    })

    const onSubmit = (data) => {
        createMutation.mutate(data)
    }

    const handleCheckConflicts = () => {
        const [cls, section, date, startTime, endTime, room] = watchedValues
        if (date && startTime && endTime) {
            checkConflictsMutation.mutate({
                class: cls,
                section,
                date,
                startTime,
                endTime,
                room
            })
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/classes')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary)]">Add Class</h1>
                    <p className="text-gray-500">Create a new class session</p>
                </div>
            </div>

            {/* Conflict Warning */}
            {conflicts?.hasConflicts && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-orange-800">Schedule Conflicts Detected</h4>
                            {conflicts.instructor.length > 0 && (
                                <p className="text-sm text-orange-700 mt-1">
                                    Instructor has {conflicts.instructor.length} conflicting class(es)
                                </p>
                            )}
                            {conflicts.room.length > 0 && (
                                <p className="text-sm text-orange-700 mt-1">
                                    Room has {conflicts.room.length} conflicting booking(s)
                                </p>
                            )}
                            {conflicts.students.length > 0 && (
                                <p className="text-sm text-orange-700 mt-1">
                                    Students have {conflicts.students.length} conflicting event(s)
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="font-medium text-[var(--primary)] flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Basic Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Class Title *
                            </label>
                            <input
                                {...register('title', { required: 'Title is required' })}
                                className="input w-full"
                                placeholder="e.g., Physics - Mechanics"
                            />
                            {errors.title && (
                                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject *
                            </label>
                            <input
                                {...register('subject', { required: 'Subject is required' })}
                                className="input w-full"
                                placeholder="e.g., Physics"
                            />
                            {errors.subject && (
                                <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Target Class *
                            </label>
                            <select {...register('class', { required: true })} className="input w-full">
                                <option value="">Select Class</option>
                                {CLASSES.map((cls) => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Section
                            </label>
                            <input
                                {...register('section')}
                                className="input w-full"
                                placeholder="e.g., A, B, Science"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Instructor
                            </label>
                            <input
                                {...register('instructorName')}
                                className="input w-full"
                                placeholder="Instructor name"
                            />
                        </div>
                    </div>
                </div>

                {/* Schedule */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-[var(--primary)] flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Schedule
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date *
                            </label>
                            <input
                                type="date"
                                {...register('date', { required: 'Date is required' })}
                                className="input w-full"
                            />
                            {errors.date && (
                                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time *
                            </label>
                            <input
                                type="time"
                                {...register('startTime', { required: 'Start time is required' })}
                                className="input w-full"
                            />
                            {errors.startTime && (
                                <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Time *
                            </label>
                            <input
                                type="time"
                                {...register('endTime', { required: 'End time is required' })}
                                className="input w-full"
                            />
                            {errors.endTime && (
                                <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCheckConflicts}
                        className="btn btn-outline text-sm"
                        disabled={checkConflictsMutation.isPending}
                    >
                        {checkConflictsMutation.isPending ? 'Checking...' : 'Check for Conflicts'}
                    </button>
                </div>

                {/* Location */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-[var(--primary)] flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                    </h3>

                    <div className="flex items-center gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={!isOnline}
                                onChange={() => setIsOnline(false)}
                                className="form-radio"
                            />
                            <span>In-person</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={isOnline}
                                onChange={() => setIsOnline(true)}
                                className="form-radio"
                            />
                            <span>Online</span>
                        </label>
                    </div>

                    {isOnline ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Meeting Link
                            </label>
                            <div className="relative">
                                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    {...register('meetingLink')}
                                    className="input w-full pl-10"
                                    placeholder="https://meet.google.com/..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Room / Venue
                                </label>
                                <input
                                    {...register('room')}
                                    className="input w-full"
                                    placeholder="e.g., Room 101"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Capacity
                                </label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        {...register('capacity', { valueAsNumber: true })}
                                        className="input w-full pl-10"
                                        placeholder="0 = Unlimited"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700">
                        Description / Notes
                    </label>
                    <textarea
                        {...register('description')}
                        className="input w-full h-24"
                        placeholder="Additional information about this class..."
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/classes')}
                        className="btn btn-outline"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {createMutation.isPending ? 'Creating...' : 'Create Class'}
                    </button>
                </div>
            </form>
        </div>
    )
}
