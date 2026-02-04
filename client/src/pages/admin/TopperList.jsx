import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus, Pencil, Trash2, Search, Filter,
    Trophy, Star, Calendar, Award
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const EXAMS = {
    jee_main: 'JEE Main',
    jee_advanced: 'JEE Advanced',
    neet: 'NEET',
    buet: 'BUET',
    du_ka: 'DU KA Unit',
    du_kha: 'DU Kha Unit',
    du_cha: 'DU Cha Unit',
    du_gha: 'DU Gha Unit',
    medical: 'Medical',
    engineering: 'Engineering',
    hsc: 'HSC',
    ssc: 'SSC',
    other: 'Other'
};

export default function TopperList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [examFilter, setExamFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');

    // Fetch toppers
    const { data: response, isLoading } = useQuery({
        queryKey: ['toppers', searchTerm, examFilter, yearFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (examFilter) params.append('exam', examFilter);
            if (yearFilter) params.append('year', yearFilter);
            const res = await api.get(`/toppers?${params.toString()}`);
            return res.data;
        }
    });

    // Fetch years
    const { data: yearsResponse } = useQuery({
        queryKey: ['topper-years'],
        queryFn: async () => {
            const res = await api.get('/toppers/public/years');
            return res.data;
        }
    });

    const toppers = response?.data || [];
    const years = yearsResponse?.data || [];

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/toppers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['toppers']);
            toast.success('Topper deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete');
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
                    <h1 className="text-2xl font-bold text-gray-900">Toppers & Results</h1>
                    <p className="text-gray-600 mt-1">Manage student achievements</p>
                </div>
                <Link
                    to="/admin/toppers/add"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Topper
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={examFilter}
                        onChange={(e) => setExamFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Exams</option>
                        {Object.entries(EXAMS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Years</option>
                        {years.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Toppers Grid */}
            {toppers.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No toppers found</h3>
                    <p className="text-gray-600 mb-4">Get started by adding student achievements.</p>
                    <Link
                        to="/admin/toppers/add"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Topper
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {toppers.map((topper) => (
                        <div
                            key={topper._id}
                            className="bg-white rounded-lg shadow overflow-hidden"
                        >
                            {/* Photo & Rank */}
                            <div className="relative h-48 bg-gradient-to-br from-yellow-100 to-orange-100">
                                {topper.photo?.url ? (
                                    <img
                                        src={topper.photo.url}
                                        alt={topper.studentName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Trophy className="w-20 h-20 text-yellow-400" />
                                    </div>
                                )}
                                {/* Rank Badge */}
                                {topper.rank && (
                                    <div className="absolute top-2 left-2 px-3 py-1 bg-yellow-500 text-white font-bold rounded-full text-sm">
                                        {topper.rank}
                                    </div>
                                )}
                                {topper.featured && (
                                    <div className="absolute top-2 right-2">
                                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900">{topper.studentName}</h3>

                                <div className="flex items-center gap-2 mt-2">
                                    <Award className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm text-gray-600">
                                        {topper.examName || EXAMS[topper.exam] || topper.exam}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">{topper.year}</span>
                                </div>

                                {/* Score */}
                                {topper.score && (
                                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {topper.score}
                                            {topper.maxScore && <span className="text-gray-400 text-lg">/{topper.maxScore}</span>}
                                        </div>
                                        {topper.percentile && (
                                            <div className="text-sm text-gray-500">
                                                Percentile: {topper.percentile}%
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Institution */}
                                {topper.institution && (
                                    <p className="text-sm text-green-600 mt-2 font-medium">
                                        → {topper.institution}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                    <button
                                        onClick={() => navigate(`/admin/toppers/edit/${topper._id}`)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(topper._id, topper.studentName)}
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
