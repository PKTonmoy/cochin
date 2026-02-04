import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Pencil, Trash2, Search,
    MessageSquare, Star, Video, Eye, EyeOff
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

export default function TestimonialList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [featuredFilter, setFeaturedFilter] = useState('');

    // Fetch testimonials
    const { data: response, isLoading } = useQuery({
        queryKey: ['testimonials', searchTerm, featuredFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (featuredFilter) params.append('featured', featuredFilter);
            const res = await api.get(`/testimonials?${params.toString()}`);
            return res.data;
        }
    });

    const testimonials = response?.data || [];

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/testimonials/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['testimonials']);
            toast.success('Testimonial deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
    });

    // Toggle active mutation
    const toggleActiveMutation = useMutation({
        mutationFn: (id) => api.patch(`/testimonials/${id}/toggle-active`),
        onSuccess: () => {
            queryClient.invalidateQueries(['testimonials']);
            toast.success('Status updated');
        }
    });

    const handleDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to delete testimonial by "${name}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
            />
        ));
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
                    <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
                    <p className="text-gray-600 mt-1">Manage student testimonials</p>
                </div>
                <Link
                    to="/admin/testimonials/add"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Testimonial
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search testimonials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={featuredFilter}
                        onChange={(e) => setFeaturedFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All</option>
                        <option value="true">Featured</option>
                        <option value="false">Not Featured</option>
                    </select>
                </div>
            </div>

            {/* Testimonials Grid */}
            {testimonials.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials found</h3>
                    <p className="text-gray-600 mb-4">Get started by adding student testimonials.</p>
                    <Link
                        to="/admin/testimonials/add"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Testimonial
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {testimonials.map((testimonial) => (
                        <div
                            key={testimonial._id}
                            className={`bg-white rounded-lg shadow overflow-hidden ${!testimonial.isActive ? 'opacity-60' : ''}`}
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {testimonial.photo?.url ? (
                                            <img
                                                src={testimonial.photo.url}
                                                alt={testimonial.studentName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-bold text-gray-400">
                                                {testimonial.studentName?.charAt(0) || '?'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{testimonial.studentName}</h3>
                                            {testimonial.featured && (
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            )}
                                            {testimonial.videoUrl && (
                                                <Video className="w-4 h-4 text-blue-500" />
                                            )}
                                        </div>
                                        {testimonial.achievement && (
                                            <p className="text-sm text-green-600 font-medium">{testimonial.achievement}</p>
                                        )}
                                        {testimonial.courseName && (
                                            <p className="text-sm text-gray-500">{testimonial.courseName}</p>
                                        )}
                                        <div className="flex items-center gap-1 mt-1">
                                            {renderStars(testimonial.rating)}
                                        </div>
                                    </div>
                                </div>

                                {/* Quote */}
                                <div className="relative">
                                    <span className="text-4xl text-gray-200 absolute -top-2 -left-1">"</span>
                                    <p className="text-gray-600 italic pl-6 line-clamp-3">
                                        {testimonial.quote}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                    <button
                                        onClick={() => navigate(`/admin/testimonials/edit/${testimonial._id}`)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => toggleActiveMutation.mutate(testimonial._id)}
                                        className={`p-2 rounded-lg transition-colors ${testimonial.isActive
                                            ? 'text-orange-600 hover:bg-orange-50'
                                            : 'text-green-600 hover:bg-green-50'
                                            }`}
                                        title={testimonial.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {testimonial.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(testimonial._id, testimonial.studentName)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
