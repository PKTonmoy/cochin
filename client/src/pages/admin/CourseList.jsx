import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Pencil, Trash2, Eye, Search, Filter,
    BookOpen, Users, Clock, Star, MoreVertical, Archive
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const CATEGORIES = {
    medical: 'Medical',
    engineering: 'Engineering',
    university: 'University',
    ru: 'RU',
    ju: 'JU',
    jnu: 'JnU',
    cu: 'CU',
    gst: 'GST',
    nu: 'NU',
    ku: 'KU',
    sust: 'SUST',
    hust: 'HUST',
    bup: 'BUP',
    hsc: 'HSC',
    ssc: 'SSC',
    foundation: 'Foundation',
    other: 'Other'
};

const STATUS_COLORS = {
    draft: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
};

export default function CourseList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Fetch courses
    const { data: response, isLoading } = useQuery({
        queryKey: ['courses', searchTerm, categoryFilter, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (categoryFilter) params.append('category', categoryFilter);
            if (statusFilter) params.append('status', statusFilter);
            const res = await api.get(`/courses?${params.toString()}`);
            return res.data;
        }
    });

    const courses = response?.data || [];

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/courses/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['courses']);
            toast.success('Course deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
    });

    // Toggle status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, status }) => api.patch(`/courses/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['courses']);
            toast.success('Status updated');
        }
    });

    const handleDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0
        }).format(price);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
                    <p className="text-gray-600 mt-1">Manage your coaching programs</p>
                </div>
                <Link
                    to="/admin/courses/add"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Course
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Categories</option>
                        {Object.entries(CATEGORIES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Courses List */}
            {courses.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first course.</p>
                    <Link
                        to="/admin/courses/add"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Course
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Course
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {courses.map((course) => (
                                    <tr key={course._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-12 rounded bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                                                    {course.image?.url ? (
                                                        <img src={course.image.url} alt={course.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <BookOpen className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900">{course.name}</span>
                                                        {course.featured && (
                                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        )}
                                                    </div>
                                                    {course.duration && (
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <Clock className="w-3 h-3" />
                                                            {course.duration}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-sm bg-gray-100 rounded">
                                                {CATEGORIES[course.category] || course.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {course.pricing?.discounted ? (
                                                <div>
                                                    <span className="font-medium text-gray-900">
                                                        {formatPrice(course.pricing.discounted)}
                                                    </span>
                                                    <span className="ml-2 text-sm text-gray-500 line-through">
                                                        {formatPrice(course.pricing.original)}
                                                    </span>
                                                </div>
                                            ) : course.pricing?.original ? (
                                                <span className="font-medium text-gray-900">
                                                    {formatPrice(course.pricing.original)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[course.status]}`}>
                                                {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/courses/edit/${course._id}`)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                {course.status === 'draft' && (
                                                    <button
                                                        onClick={() => toggleStatusMutation.mutate({ id: course._id, status: 'published' })}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Publish"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {course.status === 'published' && (
                                                    <button
                                                        onClick={() => toggleStatusMutation.mutate({ id: course._id, status: 'archived' })}
                                                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Archive"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(course._id, course.name)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
