import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Save, RefreshCw, Globe, Phone, Palette, Search, Share2, Bell, ExternalLink
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const TABS = [
    { id: 'site', label: 'Site Info', icon: Globe },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'social', label: 'Social Media', icon: Share2 },
    { id: 'notifications', label: 'Notifications', icon: Bell }
];

const initialSettings = {
    siteInfo: {
        name: '',
        tagline: '',
        description: '',
        logo: { url: '', publicId: '' },
        favicon: { url: '', publicId: '' },
        establishedYear: new Date().getFullYear()
    },
    contact: {
        email: '',
        phone: '',
        alternatePhone: '',
        whatsapp: '',
        address: { street: '', city: '', state: '', country: '', postalCode: '' }
    },
    theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        darkMode: { enabled: false, primaryColor: '#60A5FA', backgroundColor: '#1F2937', textColor: '#F9FAFB' }
    },
    seo: {
        metaTitle: '',
        metaDescription: '',
        keywords: [],
        ogImage: { url: '', publicId: '' },
        googleAnalyticsId: '',
        facebookPixelId: ''
    },
    socialMedia: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        linkedin: '',
        telegram: ''
    },
    notifications: {
        emailNotifications: { enabled: true, adminEmail: '' },
        smsNotifications: { enabled: false, apiProvider: '', apiKey: '' },
        whatsappNotifications: { enabled: false, apiProvider: '', apiKey: '' }
    }
};

export default function GlobalSettings() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('site');
    const [formData, setFormData] = useState(initialSettings);
    const [keywordInput, setKeywordInput] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch settings
    const { data: settingsResponse, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await api.get('/settings');
            return res.data.data;
        }
    });

    useEffect(() => {
        if (settingsResponse) {
            setFormData(prev => ({
                ...prev,
                ...settingsResponse,
                siteInfo: { ...initialSettings.siteInfo, ...settingsResponse.siteInfo },
                contact: { ...initialSettings.contact, ...settingsResponse.contact },
                theme: { ...initialSettings.theme, ...settingsResponse.theme },
                seo: { ...initialSettings.seo, ...settingsResponse.seo },
                socialMedia: { ...initialSettings.socialMedia, ...settingsResponse.socialMedia },
                notifications: { ...initialSettings.notifications, ...settingsResponse.notifications }
            }));
        }
    }, [settingsResponse]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: (data) => api.put('/settings', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['settings']);
            toast.success('Settings saved successfully');
            setHasChanges(false);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to save settings');
        }
    });

    const handleChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
        setHasChanges(true);
    };

    const handleNestedChange = (section, parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [parent]: {
                    ...prev[section]?.[parent],
                    [field]: value
                }
            }
        }));
        setHasChanges(true);
    };

    const addKeyword = () => {
        if (keywordInput.trim() && !formData.seo.keywords.includes(keywordInput.trim())) {
            handleChange('seo', 'keywords', [...formData.seo.keywords, keywordInput.trim()]);
            setKeywordInput('');
        }
    };

    const removeKeyword = (keyword) => {
        handleChange('seo', 'keywords', formData.seo.keywords.filter(k => k !== keyword));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
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
                    <h1 className="text-2xl font-bold text-gray-900">Global Settings</h1>
                    <p className="text-gray-600 mt-1">Configure site-wide settings and preferences</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!hasChanges || saveMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saveMutation.isPending ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Settings
                        </>
                    )}
                </button>
            </div>

            <div className="flex gap-6">
                {/* Tabs Sidebar */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <form onSubmit={handleSubmit}>
                        {/* Site Info Tab */}
                        {activeTab === 'site' && (
                            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                                <h2 className="text-lg font-semibold">Site Information</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Site Name *</label>
                                        <input
                                            type="text"
                                            value={formData.siteInfo.name}
                                            onChange={(e) => handleChange('siteInfo', 'name', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                                        <input
                                            type="text"
                                            value={formData.siteInfo.tagline}
                                            onChange={(e) => handleChange('siteInfo', 'tagline', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={formData.siteInfo.description}
                                            onChange={(e) => handleChange('siteInfo', 'description', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                                        <input
                                            type="number"
                                            value={formData.siteInfo.establishedYear}
                                            onChange={(e) => handleChange('siteInfo', 'establishedYear', parseInt(e.target.value))}
                                            min={1900}
                                            max={new Date().getFullYear()}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contact Tab */}
                        {activeTab === 'contact' && (
                            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                                <h2 className="text-lg font-semibold">Contact Information</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.contact.email}
                                            onChange={(e) => handleChange('contact', 'email', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.contact.phone}
                                            onChange={(e) => handleChange('contact', 'phone', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.contact.alternatePhone}
                                            onChange={(e) => handleChange('contact', 'alternatePhone', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                        <input
                                            type="tel"
                                            value={formData.contact.whatsapp}
                                            onChange={(e) => handleChange('contact', 'whatsapp', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <h3 className="text-md font-semibold mt-6">Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                        <input
                                            type="text"
                                            value={formData.contact.address?.street || ''}
                                            onChange={(e) => handleNestedChange('contact', 'address', 'street', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={formData.contact.address?.city || ''}
                                            onChange={(e) => handleNestedChange('contact', 'address', 'city', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            value={formData.contact.address?.state || ''}
                                            onChange={(e) => handleNestedChange('contact', 'address', 'state', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                                        <input
                                            type="text"
                                            value={formData.contact.address?.postalCode || ''}
                                            onChange={(e) => handleNestedChange('contact', 'address', 'postalCode', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                        <input
                                            type="text"
                                            value={formData.contact.address?.country || ''}
                                            onChange={(e) => handleNestedChange('contact', 'address', 'country', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Theme Tab */}
                        {activeTab === 'theme' && (
                            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                                <h2 className="text-lg font-semibold">Theme Colors</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={formData.theme.primaryColor}
                                                onChange={(e) => handleChange('theme', 'primaryColor', e.target.value)}
                                                className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={formData.theme.primaryColor}
                                                onChange={(e) => handleChange('theme', 'primaryColor', e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={formData.theme.secondaryColor}
                                                onChange={(e) => handleChange('theme', 'secondaryColor', e.target.value)}
                                                className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={formData.theme.secondaryColor}
                                                onChange={(e) => handleChange('theme', 'secondaryColor', e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={formData.theme.accentColor}
                                                onChange={(e) => handleChange('theme', 'accentColor', e.target.value)}
                                                className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={formData.theme.accentColor}
                                                onChange={(e) => handleChange('theme', 'accentColor', e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="mt-6 p-4 rounded-lg border">
                                    <p className="text-sm text-gray-500 mb-3">Preview</p>
                                    <div className="flex gap-4">
                                        <button
                                            className="px-4 py-2 rounded-lg text-white"
                                            style={{ backgroundColor: formData.theme.primaryColor }}
                                        >
                                            Primary Button
                                        </button>
                                        <button
                                            className="px-4 py-2 rounded-lg text-white"
                                            style={{ backgroundColor: formData.theme.secondaryColor }}
                                        >
                                            Secondary Button
                                        </button>
                                        <button
                                            className="px-4 py-2 rounded-lg text-white"
                                            style={{ backgroundColor: formData.theme.accentColor }}
                                        >
                                            Accent Button
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SEO Tab */}
                        {activeTab === 'seo' && (
                            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                                <h2 className="text-lg font-semibold">SEO Settings</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                                        <input
                                            type="text"
                                            value={formData.seo.metaTitle}
                                            onChange={(e) => handleChange('seo', 'metaTitle', e.target.value)}
                                            maxLength={60}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{formData.seo.metaTitle?.length || 0}/60</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                                        <textarea
                                            value={formData.seo.metaDescription}
                                            onChange={(e) => handleChange('seo', 'metaDescription', e.target.value)}
                                            maxLength={160}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{formData.seo.metaDescription?.length || 0}/160</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={keywordInput}
                                                onChange={(e) => setKeywordInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                                                placeholder="Add keyword..."
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={addKeyword}
                                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.seo.keywords?.map((keyword, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-2"
                                                >
                                                    {keyword}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeKeyword(keyword)}
                                                        className="text-gray-500 hover:text-red-500"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
                                            <input
                                                type="text"
                                                value={formData.seo.googleAnalyticsId}
                                                onChange={(e) => handleChange('seo', 'googleAnalyticsId', e.target.value)}
                                                placeholder="G-XXXXXXXXXX"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
                                            <input
                                                type="text"
                                                value={formData.seo.facebookPixelId}
                                                onChange={(e) => handleChange('seo', 'facebookPixelId', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Social Media Tab */}
                        {activeTab === 'social' && (
                            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                                <h2 className="text-lg font-semibold">Social Media Links</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.keys(formData.socialMedia).map((platform) => (
                                        <div key={platform}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{platform}</label>
                                            <input
                                                type="url"
                                                value={formData.socialMedia[platform]}
                                                onChange={(e) => handleChange('socialMedia', platform, e.target.value)}
                                                placeholder={`https://${platform}.com/...`}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                                <h2 className="text-lg font-semibold">Notification Settings</h2>

                                <div className="space-y-6">
                                    {/* Email Notifications */}
                                    <div className="p-4 border rounded-lg">
                                        <label className="flex items-center gap-3 mb-4">
                                            <input
                                                type="checkbox"
                                                checked={formData.notifications.emailNotifications?.enabled}
                                                onChange={(e) => handleNestedChange('notifications', 'emailNotifications', 'enabled', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="font-medium">Email Notifications</span>
                                        </label>
                                        {formData.notifications.emailNotifications?.enabled && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.notifications.emailNotifications?.adminEmail || ''}
                                                    onChange={(e) => handleNestedChange('notifications', 'emailNotifications', 'adminEmail', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* SMS Notifications */}
                                    <div className="p-4 border rounded-lg">
                                        <label className="flex items-center gap-3 mb-4">
                                            <input
                                                type="checkbox"
                                                checked={formData.notifications.smsNotifications?.enabled}
                                                onChange={(e) => handleNestedChange('notifications', 'smsNotifications', 'enabled', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="font-medium">SMS Notifications</span>
                                        </label>
                                        {formData.notifications.smsNotifications?.enabled && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Provider</label>
                                                    <input
                                                        type="text"
                                                        value={formData.notifications.smsNotifications?.apiProvider || ''}
                                                        onChange={(e) => handleNestedChange('notifications', 'smsNotifications', 'apiProvider', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                                    <input
                                                        type="password"
                                                        value={formData.notifications.smsNotifications?.apiKey || ''}
                                                        onChange={(e) => handleNestedChange('notifications', 'smsNotifications', 'apiKey', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
