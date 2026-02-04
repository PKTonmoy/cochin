import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Pencil, Trash2, Eye, EyeOff, Search, Filter,
    GripVertical, Star, MoreVertical, User, BookOpen
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const SUBJECTS = {
    physics: 'Physics',
    chemistry: 'Chemistry',
    mathematics: 'Mathematics',
    biology: 'Biology',
    english: 'English',
    bangla: 'Bangla',
    ict: 'ICT',
    general_knowledge: 'General Knowledge',
    other: 'Other'
};

export default function FacultyList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState('');

    // Fetch faculty
    const { data: response, isLoading } = useQuery({
        queryKey: ['faculty', searchTerm, subjectFilter, activeFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (subjectFilter) params.append('subject', subjectFilter);
            if (activeFilter) params.append('isActive', activeFilter);
            const res = await api.get(`/faculty?${params.toString()}`);
            return res.data;
        }
    });

    const faculty = response?.data || [];

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/faculty/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['faculty']);
            toast.success('Faculty deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
    });

    // Toggle active mutation
    const toggleActiveMutation = useMutation({
        mutationFn: (id) => api.patch(`/faculty/${id}/toggle-active`),
        onSuccess: () => {
            queryClient.invalidateQueries(['faculty']);
            toast.success('Status updated');
        }
    });

    const handleDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
            deleteMutation.mutate(id);
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
                    <p className="text-gray-600 mt-1">Manage your teaching staff</p>
                </div>
                <Link
                    to="/admin/faculty/add"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Faculty
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search faculty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Subjects</option>
                        {Object.entries(SUBJECTS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Faculty Grid */}
            {faculty.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No faculty found</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first faculty member.</p>
                    <Link
                        to="/admin/faculty/add"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Faculty
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {faculty.map((member) => (
                        <div
                            key={member._id}
                            className={`bg-white rounded-lg shadow overflow-hidden ${!member.isActive ? 'opacity-60' : ''}`}
                        >
                            {/* Photo */}
                            <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                                {member.photo?.url ? (
                                    <img
                                        src={member.photo.url}
                                        alt={member.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-20 h-20 text-gray-400" />
                                    </div>
                                )}
                                {/* Badges */}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {member.featured && (
                                        <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full flex items-center gap-1">
                                            <Star className="w-3 h-3" /> Featured
                                        </span>
                                    )}
                                    {!member.isActive && (
                                        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                                <p className="text-gray-600 text-sm">{member.designation}</p>

                                {/* Subjects */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {member.subjects?.map((subject) => (
                                        <span
                                            key={subject}
                                            className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                                        >
                                            {SUBJECTS[subject] || subject}
                                        </span>
                                    ))}
                                </div>

                                {/* Experience */}
                                {member.experience?.totalYears > 0 && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        {member.experience.totalYears} years experience
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                    <button
                                        onClick={() => navigate(`/admin/faculty/edit/${member._id}`)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => toggleActiveMutation.mutate(member._id)}
                                        className={`p-2 rounded-lg transition-colors ${member.isActive
                                            ? 'text-orange-600 hover:bg-orange-50'
                                            : 'text-green-600 hover:bg-green-50'
                                            }`}
                                        title={member.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {member.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(member._id, member.name)}
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
