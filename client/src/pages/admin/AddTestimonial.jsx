import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Upload, Star } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const initialFormState = {
    studentName: '',
    photo: { url: '', publicId: '', alt: '' },
    quote: '',
    fullReview: '',
    rating: 5,
    achievement: '',
    course: '',
    courseName: '',
    batch: '',
    videoUrl: '',
    featured: false,
    showOnHomepage: true,
    displayOrder: 0,
    isActive: true
};

export default function AddTestimonial() {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState(initialFormState);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);

    // Fetch existing data
    const { data: existingData, isLoading: loadingExisting } = useQuery({
        queryKey: ['testimonial', id],
        queryFn: async () => {
            const res = await api.get(`/testimonials/${id}`);
            return res.data.data;
        },
        enabled: isEditing
    });

    // Fetch courses
    const { data: coursesResponse } = useQuery({
        queryKey: ['courses-list'],
        queryFn: async () => {
            const res = await api.get('/courses?status=published');
            return res.data;
        }
    });

    const courses = coursesResponse?.data || [];

    useEffect(() => {
        if (existingData) {
            setFormData({
                ...initialFormState,
                ...existingData,
                course: existingData.course?._id || existingData.course || ''
            });
            if (existingData.photo?.url) {
                setImagePreview(existingData.photo.url);
            }
        }
    }, [existingData]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (isEditing) {
                return api.put(`/testimonials/${id}`, data);
            }
            return api.post('/testimonials', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['testimonials']);
            toast.success(isEditing ? 'Testimonial updated successfully' : 'Testimonial created successfully');
            navigate('/admin/testimonials');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to save');
        }
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRatingChange = (rating) => {
        setFormData(prev => ({ ...prev, rating }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);

        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('folder', 'testimonials');

            const res = await api.post('/media/upload', formDataUpload);
            setFormData(prev => ({
                ...prev,
                photo: {
                    url: res.data.data.url,
                    publicId: res.data.data.publicId,
                    alt: formData.studentName
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

        const cleanedData = {
            ...formData,
            rating: Number(formData.rating),
            displayOrder: Number(formData.displayOrder) || 0
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
                    onClick={() => navigate('/admin/testimonials')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Edit Testimonial' : 'Add Testimonial'}
                    </h1>
                    <p className="text-gray-600">
                        {isEditing ? 'Update student testimonial' : 'Add a new student testimonial'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Info */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Student Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Photo Upload */}
                        <div className="md:col-span-2 flex items-start gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Upload className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-full">
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
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                            <input
                                type="text"
                                name="studentName"
                                value={formData.studentName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Achievement</label>
                            <input
                                type="text"
                                name="achievement"
                                value={formData.achievement}
                                onChange={handleChange}
                                placeholder="e.g., BUET CSE 2024"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Testimonial Content */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Testimonial</h2>

                    <div className="space-y-4">
                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleRatingChange(star)}
                                        className="p-1 transition-colors"
                                    >
                                        <Star
                                            className={`w-8 h-8 ${star <= formData.rating
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quote (Short) *</label>
                            <textarea
                                name="quote"
                                value={formData.quote}
                                onChange={handleChange}
                                required
                                rows={3}
                                maxLength={500}
                                placeholder="A brief, impactful quote..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">{formData.quote?.length || 0}/500</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Review (Optional)</label>
                            <textarea
                                name="fullReview"
                                value={formData.fullReview}
                                onChange={handleChange}
                                rows={5}
                                maxLength={2000}
                                placeholder="Detailed testimonial..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">{formData.fullReview?.length || 0}/2000</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Video Testimonial URL</label>
                            <input
                                type="url"
                                name="videoUrl"
                                value={formData.videoUrl}
                                onChange={handleChange}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Course Connection */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Course Connection</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                            <select
                                name="course"
                                value={formData.course}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Course (Optional)</option>
                                {courses.map(course => (
                                    <option key={course._id} value={course._id}>{course.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                            <input
                                type="text"
                                name="batch"
                                value={formData.batch}
                                onChange={handleChange}
                                placeholder="e.g., Batch 2024"
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
                                <span className="text-sm font-medium text-gray-700">Featured Testimonial</span>
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
                        onClick={() => navigate('/admin/testimonials')}
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
                                {isEditing ? 'Update Testimonial' : 'Create Testimonial'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
