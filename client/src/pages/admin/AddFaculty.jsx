import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Upload, X, Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const SUBJECTS = [
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'biology', label: 'Biology' },
    { value: 'higher_math', label: 'Higher Math' },
    { value: 'english', label: 'English' },
    { value: 'bangla', label: 'Bangla' },
    { value: 'ict', label: 'ICT' },
    { value: 'accounting', label: 'Accounting' },
    { value: 'finance', label: 'Finance' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'management', label: 'Management' },
    { value: 'business_studies', label: 'Business Studies' },
    { value: 'statistics', label: 'Statistics' },
    { value: 'economics', label: 'Economics' },
    { value: 'history', label: 'History' },
    { value: 'geography', label: 'Geography' },
    { value: 'civics', label: 'Civics' },
    { value: 'sociology', label: 'Sociology' },
    { value: 'social_work', label: 'Social Work' },
    { value: 'psychology', label: 'Psychology' },
    { value: 'logic', label: 'Logic' },
    { value: 'islamic_studies', label: 'Islamic Studies' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'general_knowledge', label: 'General Knowledge' },
    { value: 'other', label: 'Other' }
];

const initialFormState = {
    name: '',
    designation: 'Faculty',
    photo: { url: '', publicId: '', alt: '' },
    subjects: [],
    qualifications: [''],
    experience: { totalYears: 0, teachingSince: new Date().getFullYear(), previous: [] },
    achievements: [''],
    bio: '',
    contact: { email: '', phone: '', linkedin: '' },
    featured: false,
    displayOrder: 0,
    showOnHomepage: true,
    isActive: true
};

export default function AddFaculty() {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState(initialFormState);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);

    // Fetch existing data if editing
    const { data: existingData, isLoading: loadingExisting } = useQuery({
        queryKey: ['faculty', id],
        queryFn: async () => {
            const res = await api.get(`/faculty/${id}`);
            return res.data.data;
        },
        enabled: isEditing
    });

    useEffect(() => {
        if (existingData) {
            setFormData({
                ...initialFormState,
                ...existingData,
                qualifications: existingData.qualifications?.length ? existingData.qualifications : [''],
                achievements: existingData.achievements?.length ? existingData.achievements : ['']
            });
            if (existingData.photo?.url || existingData.photo) {
                setImagePreview(existingData.photo?.url || existingData.photo);
            }
        }
    }, [existingData]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (isEditing) {
                return api.put(`/faculty/${id}`, data);
            }
            return api.post('/faculty', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['faculty']);
            toast.success(isEditing ? 'Faculty updated successfully' : 'Faculty created successfully');
            navigate('/admin/faculty');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to save');
        }
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubjectChange = (subject) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.includes(subject)
                ? prev.subjects.filter(s => s !== subject)
                : [...prev.subjects, subject]
        }));
    };

    const handleArrayChange = (field, index, value) => {
        setFormData(prev => {
            const newArray = [...prev[field]];
            newArray[index] = value;
            return { ...prev, [field]: newArray };
        });
    };

    const addArrayItem = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const removeArrayItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('folder', 'faculty');

            const res = await api.post('/media/upload', formDataUpload);
            setFormData(prev => ({
                ...prev,
                photo: {
                    url: res.data.data.url,
                    publicId: res.data.data.publicId,
                    alt: formData.name
                }
            }));
            toast.success('Photo uploaded');
        } catch (error) {
            toast.error('Failed to upload photo');
            setImagePreview('');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Clean up empty array items
        const cleanedData = {
            ...formData,
            qualifications: formData.qualifications.filter(q => q.trim()),
            achievements: formData.achievements.filter(a => a.trim())
        };

        saveMutation.mutate(cleanedData);
    };

    if (isEditing && loadingExisting) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/admin/faculty')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Edit Faculty' : 'Add Faculty'}
                    </h1>
                    <p className="text-gray-600">
                        {isEditing ? 'Update faculty member information' : 'Add a new faculty member'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Photo Upload */}
                        <div className="md:col-span-2 flex items-start gap-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="text-xs text-gray-500 mt-1">Recommended: 400x400px, max 2MB</p>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Designation */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                            <input
                                type="text"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Bio */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={4}
                                maxLength={1000}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">{formData.bio?.length || 0}/1000</p>
                        </div>
                    </div>
                </div>

                {/* Subjects Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Subjects</h2>
                    <div className="flex flex-wrap gap-3">
                        {SUBJECTS.map((subject) => (
                            <label
                                key={subject.value}
                                className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${formData.subjects.includes(subject.value)
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.subjects.includes(subject.value)}
                                    onChange={() => handleSubjectChange(subject.value)}
                                    className="sr-only"
                                />
                                {subject.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Qualifications & Achievements */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Qualifications */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                            {formData.qualifications.map((qual, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={qual}
                                        onChange={(e) => handleArrayChange('qualifications', index, e.target.value)}
                                        placeholder="e.g., PhD in Physics"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    {formData.qualifications.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeArrayItem('qualifications', index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addArrayItem('qualifications')}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Qualification
                            </button>
                        </div>

                        {/* Achievements */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Achievements</label>
                            {formData.achievements.map((ach, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={ach}
                                        onChange={(e) => handleArrayChange('achievements', index, e.target.value)}
                                        placeholder="e.g., Best Teacher Award 2023"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    {formData.achievements.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeArrayItem('achievements', index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addArrayItem('achievements')}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Achievement
                            </button>
                        </div>
                    </div>
                </div>

                {/* Experience */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Experience</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Years</label>
                            <input
                                type="number"
                                name="experience.totalYears"
                                value={formData.experience?.totalYears || 0}
                                onChange={handleChange}
                                min={0}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Since</label>
                            <input
                                type="number"
                                name="experience.teachingSince"
                                value={formData.experience?.teachingSince || new Date().getFullYear()}
                                onChange={handleChange}
                                min={1950}
                                max={new Date().getFullYear()}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Display Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Display Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                            <input
                                type="number"
                                name="displayOrder"
                                value={formData.displayOrder}
                                onChange={handleChange}
                                min={0}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="featured"
                                    checked={formData.featured}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Featured Faculty</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="showOnHomepage"
                                    checked={formData.showOnHomepage}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Show on Homepage</span>
                            </label>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Active</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/faculty')}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saveMutation.isPending ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {isEditing ? 'Update Faculty' : 'Create Faculty'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
