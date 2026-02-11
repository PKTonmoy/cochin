import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Upload, Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const EXAMS = [
    { value: 'jee_main', label: 'JEE Main' },
    { value: 'jee_advanced', label: 'JEE Advanced' },
    { value: 'neet', label: 'NEET' },
    { value: 'buet', label: 'BUET' },
    { value: 'du_ka', label: 'DU KA Unit' },
    { value: 'du_kha', label: 'DU Kha Unit' },
    { value: 'du_cha', label: 'DU Cha Unit' },
    { value: 'du_gha', label: 'DU Gha Unit' },
    { value: 'ru', label: 'RU' },
    { value: 'ju', label: 'JU' },
    { value: 'jnu', label: 'JnU' },
    { value: 'cu', label: 'CU' },
    { value: 'gst', label: 'GST' },
    { value: 'nu', label: 'NU' },
    { value: 'ku', label: 'KU' },
    { value: 'sust', label: 'SUST' },
    { value: 'hust', label: 'HUST' },
    { value: 'bup', label: 'BUP' },
    { value: 'medical', label: 'Medical' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'hsc', label: 'HSC' },
    { value: 'ssc', label: 'SSC' },
    { value: 'other', label: 'Other' }
];

const UNITS = ['A', 'B', 'C', 'D', 'E'];

const initialFormState = {
    studentName: '',
    photo: { url: '', publicId: '', alt: '' },
    exam: 'other',
    examName: '',
    year: new Date().getFullYear(),
    rank: '',
    score: '',
    maxScore: '',
    percentile: '',
    subjectScores: [],
    course: '',
    courseName: '',
    batch: '',
    successStory: '',
    videoUrl: '',
    institution: '',
    section: '',
    featured: false,
    showOnHomepage: true,
    displayOrder: 0,
    isActive: true
};

export default function AddTopper() {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState(initialFormState);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);

    // Fetch existing data
    const { data: existingData, isLoading: loadingExisting } = useQuery({
        queryKey: ['topper', id],
        queryFn: async () => {
            const res = await api.get(`/toppers/${id}`);
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
                return api.put(`/toppers/${id}`, data);
            }
            return api.post('/toppers', data);
        },
        onSuccess: () => {
            // Invalidate all topper-related queries to ensure fresh data
            queryClient.invalidateQueries({ queryKey: ['toppers'] });
            queryClient.invalidateQueries({ queryKey: ['topper', id] });
            toast.success(isEditing ? 'Topper updated successfully' : 'Topper created successfully');
            navigate('/admin/toppers');
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

    const handleSubjectScoreChange = (index, field, value) => {
        setFormData(prev => {
            const newScores = [...prev.subjectScores];
            newScores[index] = { ...newScores[index], [field]: value };
            return { ...prev, subjectScores: newScores };
        });
    };

    const addSubjectScore = () => {
        setFormData(prev => ({
            ...prev,
            subjectScores: [...prev.subjectScores, { subject: '', score: '', maxScore: '' }]
        }));
    };

    const removeSubjectScore = (index) => {
        setFormData(prev => ({
            ...prev,
            subjectScores: prev.subjectScores.filter((_, i) => i !== index)
        }));
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
            formDataUpload.append('folder', 'toppers');

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
            console.error('Upload error:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Failed to upload photo');
            setImagePreview('');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const cleanedData = {
            ...formData,
            year: Number(formData.year),
            score: formData.score ? Number(formData.score) : undefined,
            maxScore: formData.maxScore ? Number(formData.maxScore) : undefined,
            percentile: formData.percentile ? Number(formData.percentile) : undefined,
            displayOrder: Number(formData.displayOrder) || 0,
            subjectScores: formData.subjectScores.filter(s => s.subject.trim())
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
                    onClick={() => navigate('/admin/toppers')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Edit Topper' : 'Add Topper'}
                    </h1>
                    <p className="text-gray-600">
                        {isEditing ? 'Update student achievement' : 'Add a new student achievement'}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Institution (Got into)</label>
                            <input
                                type="text"
                                name="institution"
                                value={formData.institution}
                                onChange={handleChange}
                                placeholder="e.g., BUET CSE, Dhaka Medical"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">No Unit</option>
                                {UNITS.map(s => (
                                    <option key={s} value={s}>Unit {s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Achievement Details */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Achievement Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Exam *</label>
                            <select
                                name="exam"
                                value={formData.exam}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {EXAMS.map(exam => (
                                    <option key={exam.value} value={exam.value}>{exam.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                            <input
                                type="number"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                required
                                min={2000}
                                max={new Date().getFullYear() + 1}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                            <input
                                type="text"
                                name="rank"
                                value={formData.rank}
                                onChange={handleChange}
                                placeholder="e.g., AIR 12, Merit 5"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                            <input
                                type="number"
                                name="score"
                                value={formData.score}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                            <input
                                type="number"
                                name="maxScore"
                                value={formData.maxScore}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Percentile</label>
                            <input
                                type="number"
                                name="percentile"
                                value={formData.percentile}
                                onChange={handleChange}
                                step="0.01"
                                max={100}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Subject Scores */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Subject-wise Scores (Optional)</h2>

                    {formData.subjectScores.map((score, index) => (
                        <div key={index} className="flex gap-4 mb-3">
                            <input
                                type="text"
                                value={score.subject}
                                onChange={(e) => handleSubjectScoreChange(index, 'subject', e.target.value)}
                                placeholder="Subject"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="number"
                                value={score.score}
                                onChange={(e) => handleSubjectScoreChange(index, 'score', e.target.value)}
                                placeholder="Score"
                                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="number"
                                value={score.maxScore}
                                onChange={(e) => handleSubjectScoreChange(index, 'maxScore', e.target.value)}
                                placeholder="Max"
                                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => removeSubjectScore(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addSubjectScore}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> Add Subject Score
                    </button>
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
                                placeholder="e.g., 2024-2026 Morning"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Success Story */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Success Story</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Story</label>
                            <textarea
                                name="successStory"
                                value={formData.successStory}
                                onChange={handleChange}
                                rows={4}
                                maxLength={2000}
                                placeholder="Student's journey and success story..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">{formData.successStory?.length || 0}/2000</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (YouTube/Vimeo)</label>
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
                                <span className="text-sm font-medium text-gray-700">Featured Topper</span>
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
                        onClick={() => navigate('/admin/toppers')}
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
                                {isEditing ? 'Update Topper' : 'Create Topper'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
