import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Upload, Plus, Trash2, GripVertical } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const CATEGORIES = [
    { value: 'medical', label: 'Medical' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'university', label: 'University' },
    { value: 'hsc', label: 'HSC' },
    { value: 'ssc', label: 'SSC' },
    { value: 'foundation', label: 'Foundation' },
    { value: 'other', label: 'Other' }
];

const STUDY_MATERIALS = [
    { value: 'printed_books', label: 'Printed Books' },
    { value: 'online_notes', label: 'Online Notes' },
    { value: 'practice_papers', label: 'Practice Papers' },
    { value: 'video_lectures', label: 'Video Lectures' },
    { value: 'live_classes', label: 'Live Classes' },
    { value: 'doubt_sessions', label: 'Doubt Sessions' }
];

const initialFormState = {
    name: '',
    slug: '',
    shortDescription: '',
    fullDescription: '',
    category: 'other',
    tags: [],
    image: { url: '', publicId: '', alt: '' },
    duration: '',
    startDate: '',
    totalSeats: '',
    eligibility: '',
    pricing: { original: '', discounted: '' },
    syllabus: [{ subject: '', lectures: 0, topics: [''] }],
    faculty: [],
    studyMaterials: [],
    features: [''],
    seo: { metaTitle: '', metaDescription: '', keywords: [] },
    featured: false,
    displayOrder: 0,
    showOnHomepage: true,
    status: 'draft'
};

export default function AddCourse() {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState(initialFormState);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const [tagInput, setTagInput] = useState('');

    // Fetch existing course
    const { data: existingData, isLoading: loadingExisting } = useQuery({
        queryKey: ['course', id],
        queryFn: async () => {
            const res = await api.get(`/courses/${id}`);
            return res.data.data;
        },
        enabled: isEditing
    });

    // Fetch faculty for selection
    const { data: facultyResponse } = useQuery({
        queryKey: ['faculty-list'],
        queryFn: async () => {
            const res = await api.get('/faculty?isActive=true');
            return res.data;
        }
    });

    const availableFaculty = facultyResponse?.data || [];

    useEffect(() => {
        if (existingData) {
            setFormData({
                ...initialFormState,
                ...existingData,
                pricing: existingData.pricing || { original: '', discounted: '' },
                syllabus: existingData.syllabus?.length
                    ? existingData.syllabus.map(s => ({ ...s, topics: s.topics?.length ? s.topics : [''] }))
                    : [{ subject: '', lectures: 0, topics: [''] }],
                features: existingData.features?.length ? existingData.features : [''],
                startDate: existingData.startDate ? existingData.startDate.split('T')[0] : '',
                faculty: existingData.faculty?.map(f => f._id || f) || []
            });
            if (existingData.image?.url) {
                setImagePreview(existingData.image.url);
            }
        }
    }, [existingData]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (isEditing) {
                return api.put(`/courses/${id}`, data);
            }
            return api.post('/courses', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['courses']);
            toast.success(isEditing ? 'Course updated successfully' : 'Course created successfully');
            navigate('/admin/courses');
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

    const handleMaterialChange = (material) => {
        setFormData(prev => ({
            ...prev,
            studyMaterials: prev.studyMaterials.includes(material)
                ? prev.studyMaterials.filter(m => m !== material)
                : [...prev.studyMaterials, material]
        }));
    };

    const handleFacultyChange = (facultyId) => {
        setFormData(prev => ({
            ...prev,
            faculty: prev.faculty.includes(facultyId)
                ? prev.faculty.filter(f => f !== facultyId)
                : [...prev.faculty, facultyId]
        }));
    };

    const handleFeatureChange = (index, value) => {
        setFormData(prev => {
            const newFeatures = [...prev.features];
            newFeatures[index] = value;
            return { ...prev, features: newFeatures };
        });
    };

    const addFeature = () => {
        setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
    };

    const removeFeature = (index) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const handleSyllabusChange = (index, field, value) => {
        setFormData(prev => {
            const newSyllabus = [...prev.syllabus];
            newSyllabus[index] = { ...newSyllabus[index], [field]: value };
            return { ...prev, syllabus: newSyllabus };
        });
    };

    const addSyllabusItem = () => {
        setFormData(prev => ({
            ...prev,
            syllabus: [...prev.syllabus, { subject: '', lectures: 0, topics: [''] }]
        }));
    };

    const removeSyllabusItem = (index) => {
        setFormData(prev => ({
            ...prev,
            syllabus: prev.syllabus.filter((_, i) => i !== index)
        }));
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
            setTagInput('');
        }
    };

    const removeTag = (tag) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
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
            formDataUpload.append('folder', 'courses');

            const res = await api.post('/media/upload', formDataUpload);
            setFormData(prev => ({
                ...prev,
                image: {
                    url: res.data.data.url,
                    publicId: res.data.data.publicId,
                    alt: formData.name
                }
            }));
            toast.success('Image uploaded');
        } catch (error) {
            toast.error('Failed to upload image');
            setImagePreview('');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const cleanedData = {
            ...formData,
            features: formData.features.filter(f => f.trim()),
            syllabus: formData.syllabus.filter(s => s.subject.trim()),
            pricing: {
                original: formData.pricing.original ? Number(formData.pricing.original) : undefined,
                discounted: formData.pricing.discounted ? Number(formData.pricing.discounted) : undefined
            },
            totalSeats: formData.totalSeats ? Number(formData.totalSeats) : undefined,
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
                    onClick={() => navigate('/admin/courses')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Edit Course' : 'Add Course'}
                    </h1>
                    <p className="text-gray-600">
                        {isEditing ? 'Update course information' : 'Add a new coaching program'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Image Upload */}
                        <div className="md:col-span-2 flex items-start gap-6">
                            <div className="relative">
                                <div className="w-40 h-28 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Course Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="text-xs text-gray-500 mt-1">Recommended: 1200x800px, max 2MB</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                            <textarea
                                name="shortDescription"
                                value={formData.shortDescription}
                                onChange={handleChange}
                                rows={2}
                                maxLength={300}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">{formData.shortDescription?.length || 0}/300</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                            <input
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                placeholder="e.g., 2 Years, 6 Months"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Pricing</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (BDT)</label>
                            <input
                                type="number"
                                name="pricing.original"
                                value={formData.pricing.original}
                                onChange={handleChange}
                                min={0}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Price (BDT)</label>
                            <input
                                type="number"
                                name="pricing.discounted"
                                value={formData.pricing.discounted}
                                onChange={handleChange}
                                min={0}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
                            <input
                                type="number"
                                name="totalSeats"
                                value={formData.totalSeats}
                                onChange={handleChange}
                                min={0}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Study Materials */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Study Materials Included</h2>
                    <div className="flex flex-wrap gap-3">
                        {STUDY_MATERIALS.map((material) => (
                            <label
                                key={material.value}
                                className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors ${formData.studyMaterials.includes(material.value)
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.studyMaterials.includes(material.value)}
                                    onChange={() => handleMaterialChange(material.value)}
                                    className="sr-only"
                                />
                                {material.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Features */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Features & Highlights</h2>
                    {formData.features.map((feature, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={feature}
                                onChange={(e) => handleFeatureChange(index, e.target.value)}
                                placeholder="e.g., Expert faculty guidance"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            {formData.features.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addFeature}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                    >
                        <Plus className="w-4 h-4" /> Add Feature
                    </button>
                </div>

                {/* Faculty */}
                {availableFaculty.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Assign Faculty</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {availableFaculty.map((faculty) => (
                                <label
                                    key={faculty._id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.faculty.includes(faculty._id)
                                        ? 'bg-blue-50 border-blue-500'
                                        : 'bg-white border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.faculty.includes(faculty._id)}
                                        onChange={() => handleFacultyChange(faculty._id)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <div>
                                        <p className="font-medium text-sm">{faculty.name}</p>
                                        <p className="text-xs text-gray-500">{faculty.designation}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Display Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Display Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
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
                        <div className="md:col-span-2 flex flex-wrap gap-6">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="featured"
                                    checked={formData.featured}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Featured Course</span>
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
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/courses')}
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
                                {isEditing ? 'Update Course' : 'Create Course'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
