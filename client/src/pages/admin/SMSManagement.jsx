import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MessageSquare, Send, BarChart3, History, Settings, Power,
    Search, Filter, Users, Phone, CheckCircle, XCircle, Clock,
    RefreshCw, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle,
    Zap, Eye, Save
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'send', label: 'Send SMS', icon: Send },
    { id: 'logs', label: 'SMS Logs', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings }
];

export default function SMSManagement() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">SMS Management</h1>
                    <p className="text-gray-500 mt-1">Send SMS notifications and manage delivery</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="flex border-b overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'dashboard' && <DashboardTab />}
                    {activeTab === 'send' && <SendSmsTab />}
                    {activeTab === 'logs' && <LogsTab />}
                    {activeTab === 'settings' && <SettingsTab />}
                </div>
            </div>
        </div>
    );
}

// ─── Dashboard Tab ──────────────────────────────────────────────────────────────

function DashboardTab() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['sms-stats'],
        queryFn: async () => {
            const res = await api.get('/sms/stats');
            return res.data.data;
        }
    });

    const { data: balanceData, isLoading: balanceLoading } = useQuery({
        queryKey: ['sms-balance'],
        queryFn: async () => {
            const res = await api.get('/sms/balance');
            return res.data.data;
        },
        retry: false
    });

    const { data: settingsData } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await api.get('/settings');
            return res.data.data;
        }
    });

    const smsEnabled = settingsData?.smsSettings?.enabled;

    const statCards = [
        {
            label: 'Total SMS Sent',
            value: stats?.sent || 0,
            icon: CheckCircle,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200'
        },
        {
            label: 'Failed',
            value: stats?.failed || 0,
            icon: XCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200'
        },
        {
            label: 'Queued',
            value: stats?.queued || 0,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200'
        },
        {
            label: 'Today Sent',
            value: stats?.todaySent || 0,
            icon: Zap,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Service Status */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${smsEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                }`}>
                <div className={`w-3 h-3 rounded-full ${smsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="font-medium">
                    SMS Service: {smsEnabled ? 'Active' : 'Inactive'}
                </span>
                {!smsEnabled && (
                    <span className="text-sm text-gray-500 ml-2">— Go to Settings tab to enable</span>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(card => (
                    <div key={card.label} className={`${card.bg} ${card.border} border rounded-xl p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                            <card.icon size={18} className={card.color} />
                            <span className="text-sm text-gray-600">{card.label}</span>
                        </div>
                        <p className={`text-2xl font-bold ${card.color}`}>
                            {statsLoading ? '...' : card.value.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-200 text-sm mb-1">BulkSMSBD Balance</p>
                        <p className="text-3xl font-bold">
                            {balanceLoading ? '...' : (balanceData?.balance ?? 'N/A')}
                        </p>
                        <p className="text-blue-200 text-xs mt-1">Credits remaining</p>
                    </div>
                    <MessageSquare size={48} className="text-blue-300/30" />
                </div>
            </div>
        </div>
    );
}

// ─── Send SMS Tab ───────────────────────────────────────────────────────────────

function SendSmsTab() {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const [phoneField, setPhoneField] = useState('guardianPhone');

    // Mode: 'bulk' or 'single'
    const [smsMode, setSmsMode] = useState('bulk');
    const [filters, setFilters] = useState({ class: '', section: '', name: '' });

    // Single student search
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [recipientInfo, setRecipientInfo] = useState(null);

    // Search students for single mode
    const { data: searchResults, isLoading: isSearching } = useQuery({
        queryKey: ['student-search', studentSearch],
        queryFn: async () => {
            if (!studentSearch || studentSearch.length < 2) return [];
            const res = await api.get('/students', {
                params: { search: studentSearch, limit: 5 }
            });
            return res.data.data.students;
        },
        enabled: smsMode === 'single' && studentSearch.length >= 2,
        keepPreviousData: true
    });

    // Fetch classes for filter
    const { data: classesData } = useQuery({
        queryKey: ['classes-list'],
        queryFn: async () => {
            const res = await api.get('/students/classes-list');
            return res.data.data;
        }
    });

    // Check recipient count
    const checkRecipients = useMutation({
        mutationFn: async () => {
            const res = await api.post('/sms/recipient-count', { filters, phoneField });
            return res.data.data;
        },
        onSuccess: (data) => setRecipientInfo(data),
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to check recipients')
    });

    // Send custom SMS
    const sendSmsMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/sms/send-custom', { filters, message, phoneField });
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message || 'SMS sending initiated');
            queryClient.invalidateQueries({ queryKey: ['sms-stats'] });
            queryClient.invalidateQueries({ queryKey: ['sms-logs'] });
            setMessage('');
            setRecipientInfo(null);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to send SMS')
    });

    const charCount = message.length;
    const smsCount = Math.ceil(charCount / 160) || 0;

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (filters.class || filters.section || filters.name || filters.roll) {
                checkRecipients.mutate();
            } else {
                setRecipientInfo(null);
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [filters, phoneField]);

    const handleSend = () => {
        if (!message.trim()) {
            toast.error('Please enter a message');
            return;
        }
        if (!recipientInfo || recipientInfo.withPhone === 0) {
            toast.error('No valid recipients found');
            return;
        }
        if (window.confirm(`Send SMS to ${recipientInfo.withPhone} recipient(s)?`)) {
            sendSmsMutation.mutate();
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-5 border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Filter size={18} />
                        Recipient Filters
                    </h3>
                    <div className="flex bg-gray-200 p-1 rounded-lg">
                        <button
                            onClick={() => {
                                setSmsMode('bulk');
                                setFilters({ class: '', section: '', name: '' });
                                setRecipientInfo(null);
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${smsMode === 'bulk' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Bulk / Class
                        </button>
                        <button
                            onClick={() => {
                                setSmsMode('single');
                                setFilters({ class: '', section: '', name: '' });
                                setRecipientInfo(null);
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${smsMode === 'single' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            Single Student
                        </button>
                    </div>
                </div>

                {smsMode === 'bulk' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select
                                value={filters.class}
                                onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Classes</option>
                                {classesData?.map((cls, index) => (
                                    <option key={index} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <input
                                type="text"
                                value={filters.section}
                                onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
                                placeholder="e.g. A, B"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name (Optional)</label>
                            <input
                                type="text"
                                value={filters.name}
                                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Filter within class..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {!selectedStudent ? (
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        placeholder="Enter Name, Roll, or Phone..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                </div>
                                {studentSearch.length > 1 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                        {isSearching ? (
                                            <div className="p-4 text-center text-gray-500">Searching...</div>
                                        ) : searchResults?.length > 0 ? (
                                            searchResults.map(student => (
                                                <button
                                                    key={student._id}
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        setFilters({ roll: student.roll });
                                                        setStudentSearch('');
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="font-medium text-gray-800">{student.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Roll: {student.roll} • Class: {student.class} {student.section ? `(${student.section})` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="text-right text-xs text-gray-400 group-hover:text-blue-600">
                                                        Select
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500">No students found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {selectedStudent.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{selectedStudent.name}</h4>
                                        <p className="text-sm text-gray-600">
                                            Roll: {selectedStudent.roll} • Class: {selectedStudent.class}
                                        </p>
                                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Phone size={10} /> Guardian: {selectedStudent.guardianPhone}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone size={10} /> Personal: {selectedStudent.phone}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedStudent(null);
                                        setFilters({ class: '', section: '', name: '' });
                                        setRecipientInfo(null);
                                    }}
                                    className="p-2 hover:bg-white rounded-full text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Phone Field Selector */}
                <div className="mt-4 flex items-center gap-4">
                    <span className="text-sm text-gray-600">Send to:</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            value="guardianPhone"
                            checked={phoneField === 'guardianPhone'}
                            onChange={(e) => setPhoneField(e.target.value)}
                            className="text-blue-600"
                        />
                        <span className="text-sm">Guardian Phone</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            value="phone"
                            checked={phoneField === 'phone'}
                            onChange={(e) => setPhoneField(e.target.value)}
                            className="text-blue-600"
                        />
                        <span className="text-sm">Student Phone</span>
                    </label>
                </div>

                {/* Recipient Count */}
                {recipientInfo && (
                    <div className="mt-4 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-emerald-600">
                            <Users size={16} />
                            <strong>{recipientInfo.withPhone}</strong> recipients with phone
                        </span>
                        {recipientInfo.withoutPhone > 0 && (
                            <span className="flex items-center gap-1.5 text-amber-600">
                                <AlertTriangle size={14} />
                                {recipientInfo.withoutPhone} without phone number
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Message */}
            <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MessageSquare size={18} />
                    Message
                </h3>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your SMS message here..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                    <span>{charCount} characters · {smsCount} SMS part(s)</span>
                    <span className="text-xs text-gray-400">160 chars per standard SMS</span>
                </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSend}
                    disabled={sendSmsMutation.isPending || !message.trim() || !recipientInfo?.withPhone}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {sendSmsMutation.isPending ? (
                        <RefreshCw size={18} className="animate-spin" />
                    ) : (
                        <Send size={18} />
                    )}
                    {sendSmsMutation.isPending ? 'Sending...' : 'Send SMS'}
                </button>
            </div>
        </div>
    );
}

// ─── Logs Tab ───────────────────────────────────────────────────────────────────

function LogsTab() {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [search, setSearch] = useState('');
    const limit = 15;

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['sms-logs', page, statusFilter, typeFilter, search],
        queryFn: async () => {
            const params = { page, limit };
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.type = typeFilter;
            if (search) params.search = search;
            const res = await api.get('/sms/logs', { params });
            return res.data.data;
        },
        keepPreviousData: true
    });

    const logs = data?.logs || [];
    const pagination = data?.pagination || {};

    const statusBadge = (status) => {
        const map = {
            sent: { label: 'Sent', icon: CheckCircle, classes: 'bg-emerald-100 text-emerald-700' },
            failed: { label: 'Failed', icon: XCircle, classes: 'bg-red-100 text-red-700' },
            queued: { label: 'Queued', icon: Clock, classes: 'bg-amber-100 text-amber-700' }
        };
        const badge = map[status] || map.queued;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
                <badge.icon size={12} />
                {badge.label}
            </span>
        );
    };

    const typeBadge = (type) => {
        if (type === 'result_sms') return <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Result</span>;
        return <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Custom</span>;
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by name, phone, or message..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="">All Status</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                    <option value="queued">Queued</option>
                </select>
                <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    <option value="">All Types</option>
                    <option value="result_sms">Result SMS</option>
                    <option value="custom_sms">Custom SMS</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Recipient</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Message</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">No SMS logs found</td></tr>
                        ) : logs.map(log => (
                            <tr key={log._id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-800">{log.recipientName || '—'}</div>
                                    {log.testId && (
                                        <div className="text-xs text-gray-500">{log.testId.testName}</div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{log.phone}</td>
                                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                                    <div className="max-w-xs truncate" title={log.message}>
                                        {log.message}
                                    </div>
                                </td>
                                <td className="px-4 py-3">{typeBadge(log.type)}</td>
                                <td className="px-4 py-3">
                                    {statusBadge(log.status)}
                                    {log.retryCount > 0 && (
                                        <span className="text-xs text-gray-400 ml-1">({log.retryCount}x)</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                                    {new Date(log.createdAt).toLocaleString('en-BD')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={pagination.page <= 1}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                            disabled={pagination.page >= pagination.pages}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Settings Tab ───────────────────────────────────────────────────────────────

function SettingsTab() {
    const queryClient = useQueryClient();
    const [settings, setSettings] = useState({
        enabled: false,
        apiKey: '',
        senderId: '',
        resultSmsTemplate: 'Dear {studentName}, Your {testName} result: {score}/{total}. Highest Score: {highest}. Visit {website} for details. - PARAGON',
        websiteUrl: '',
        isEnvApiKey: false,
        isEnvSenderId: false
    });

    // Fetch current settings
    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await api.get('/settings');
            return res.data.data;
        }
    });

    useEffect(() => {
        if (settingsData?.smsSettings) {
            setSettings(prev => ({
                ...prev,
                ...settingsData.smsSettings
            }));
        }
    }, [settingsData]);

    // Save settings mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            const res = await api.put('/settings', { smsSettings: settings });
            return res.data;
        },
        onSuccess: () => {
            toast.success('SMS settings saved successfully');
            queryClient.invalidateQueries({ queryKey: ['settings'] });
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to save settings')
    });

    if (isLoading) {
        return <div className="text-center py-8 text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Service Toggle */}
            <div className={`p-5 rounded-xl border-2 transition-colors ${settings.enabled ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 bg-gray-50'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Power size={24} className={settings.enabled ? 'text-emerald-600' : 'text-gray-400'} />
                        <div>
                            <h3 className="font-semibold text-gray-800">SMS Service</h3>
                            <p className="text-sm text-gray-500">
                                {settings.enabled ? 'SMS notifications are active' : 'SMS notifications are disabled'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                </div>
            </div>



            {/* Result SMS Template */}
            <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Result SMS Template</h3>
                <textarea
                    value={settings.resultSmsTemplate || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, resultSmsTemplate: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                />
                <div className="flex flex-wrap gap-2">
                    {['{studentName}', '{testName}', '{score}', '{total}', '{highest}', '{website}', '{percentage}', '{grade}', '{rank}'].map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-mono">
                            {tag}
                        </span>
                    ))}
                </div>
                <p className="text-xs text-gray-500">Use the tags above in your template. They'll be replaced with actual values.</p>
            </div>

            {/* Website URL */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input
                    type="text"
                    value={settings.websiteUrl || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Used in the {'{website}'} template tag</p>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-4 border-t">
                <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {saveMutation.isPending ? (
                        <RefreshCw size={18} className="animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
