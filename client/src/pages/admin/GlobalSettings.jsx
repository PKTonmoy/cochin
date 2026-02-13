import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Save, RefreshCw, Globe, Phone, Palette, Search, Share2, Bell, ExternalLink, Upload, X, Image, FileText,
    Layout, BookOpen, Sparkles, Trophy, MessageCircle, Users
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const TABS = [
    { id: 'site', label: 'Site Info', icon: Globe },
    { id: 'landing', label: 'Landing Page', icon: Layout },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'receipt', label: 'Receipt', icon: FileText },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'social', label: 'Social Media', icon: Share2 },
    { id: 'notifications', label: 'Notifications', icon: Bell }
];

const initialSettings = {
    siteInfo: {
        name: '',
        tagline: '',
        mobileCoachingName: '',
        heroAnimatedTexts: [],
        heroTitleLine1: '',
        heroTitleLine2: '',
        heroBadge: '#1 Coaching Center in Bangladesh',
        description: '',
        landingPage: {
            programs: {
                badge: 'Our Programs',
                titleLine1: 'আমাদের',
                titleLine2: 'প্রোগ্রামসমূহ',
                description: 'আপনার লক্ষ্য অনুযায়ী সেরা প্রোগ্রাম নির্বাচন করুন'
            },
            whyChooseUs: {
                badge: 'Why Choose Us',
                titleLine1: 'কেন',
                titleLine2: 'প্যারাগন?'
            },
            hallOfFame: {
                badge: 'Hall of Fame',
                titleLine1: 'আমাদের',
                titleLine2: 'সফল শিক্ষার্থী'
            },
            successStories: {
                badge: 'Success Stories',
                titleLine1: 'সফল শিক্ষার্থীদের',
                titleLine2: 'মতামত'
            },
            faculty: {
                badge: 'Our Team',
                titleLine1: 'আমাদের',
                titleLine2: 'শিক্ষকমণ্ডলী'
            }
        },
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
    receiptTemplate: {
        primaryColor: '#1a365d',
        showLogo: true,
        showQRCode: true,
        showCredentialsOnFirst: true,
        footerNote: 'This is a computer-generated receipt. Please keep this for your records.',
        signatureLeftLabel: 'Student/Guardian',
        signatureRightLabel: 'Authorized Signature'
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
    const [animatedTextInput, setAnimatedTextInput] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = useRef(null);

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
            // Map phones array from backend to phone/alternatePhone fields for the form
            const contactData = settingsResponse.contact || {};
            const phonesArray = contactData.phones || [];

            setFormData(prev => ({
                ...prev,
                ...settingsResponse,
                siteInfo: { ...initialSettings.siteInfo, ...settingsResponse.siteInfo },
                contact: {
                    ...initialSettings.contact,
                    ...contactData,
                    phone: phonesArray[0] || '',
                    alternatePhone: phonesArray[1] || '',
                },
                receiptTemplate: { ...initialSettings.receiptTemplate, ...settingsResponse.receiptTemplate },
                theme: { ...initialSettings.theme, ...settingsResponse.theme },
                seo: { ...initialSettings.seo, ...settingsResponse.seo },
                socialMedia: { ...initialSettings.socialMedia, ...settingsResponse.socialMedia },
                notifications: { ...initialSettings.notifications, ...settingsResponse.notifications }
            }));
        }
    }, [settingsResponse]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: (data) => {
            // Convert phone/alternatePhone back to phones array for backend
            const payload = {
                ...data,
                contact: {
                    ...data.contact,
                    phones: [data.contact.phone, data.contact.alternatePhone].filter(Boolean),
                }
            };
            // Remove form-only fields
            delete payload.contact.phone;
            delete payload.contact.alternatePhone;
            return api.put('/settings', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['settings']);
            queryClient.invalidateQueries(['public-settings']);
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

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be less than 2MB');
            return;
        }

        setUploadingLogo(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await api.post('/uploads/image', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data?.data) {
                handleNestedChange('siteInfo', 'logo', 'url', res.data.data.url);
                handleNestedChange('siteInfo', 'logo', 'publicId', res.data.data.publicId);
                // Directly update both fields at once to avoid partial state
                setFormData(prev => ({
                    ...prev,
                    siteInfo: {
                        ...prev.siteInfo,
                        logo: {
                            url: res.data.data.url,
                            publicId: res.data.data.publicId
                        }
                    }
                }));
                setHasChanges(true);
                toast.success('Logo uploaded! Click "Save Settings" to apply.');
            }
        } catch (error) {
            toast.error('Failed to upload logo');
            console.error('Logo upload error:', error);
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    const handleRemoveLogo = () => {
        setFormData(prev => ({
            ...prev,
            siteInfo: {
                ...prev.siteInfo,
                logo: { url: '', publicId: '' }
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Coaching Name</label>
                                        <input
                                            type="text"
                                            value={formData.siteInfo.mobileCoachingName || ''}
                                            onChange={(e) => handleChange('siteInfo', 'mobileCoachingName', e.target.value)}
                                            placeholder="Displayed on mobile hero section (e.g. PARAGON ACADEMY)"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hero Badge Text</label>
                                        <input
                                            type="text"
                                            value={formData.siteInfo.heroBadge || ''}
                                            onChange={(e) => handleChange('siteInfo', 'heroBadge', e.target.value)}
                                            placeholder="e.g. #1 Coaching Center in Bangladesh"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title Line 1</label>
                                        <input
                                            type="text"
                                            value={formData.siteInfo.heroTitleLine1 || ''}
                                            onChange={(e) => handleChange('siteInfo', 'heroTitleLine1', e.target.value)}
                                            placeholder="e.g. Transform Your"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title Line 2</label>
                                        <input
                                            type="text"
                                            value={formData.siteInfo.heroTitleLine2 || ''}
                                            onChange={(e) => handleChange('siteInfo', 'heroTitleLine2', e.target.value)}
                                            placeholder="e.g. Future Today"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hero Animated Texts</label>
                                        <p className="text-xs text-gray-500 mb-2">These texts animate (typewriter effect) on the hero section. Add at least 2 for best effect.</p>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={animatedTextInput}
                                                onChange={(e) => setAnimatedTextInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (animatedTextInput.trim()) {
                                                            handleChange('siteInfo', 'heroAnimatedTexts', [...(formData.siteInfo.heroAnimatedTexts || []), animatedTextInput.trim()]);
                                                            setAnimatedTextInput('');
                                                        }
                                                    }
                                                }}
                                                placeholder="e.g. Engineering Excellence"
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (animatedTextInput.trim()) {
                                                        handleChange('siteInfo', 'heroAnimatedTexts', [...(formData.siteInfo.heroAnimatedTexts || []), animatedTextInput.trim()]);
                                                        setAnimatedTextInput('');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(formData.siteInfo.heroAnimatedTexts || []).map((text, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                                    {text}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChange('siteInfo', 'heroAnimatedTexts', formData.siteInfo.heroAnimatedTexts.filter((_, i) => i !== idx))}
                                                        className="ml-1 text-blue-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        {(formData.siteInfo.heroAnimatedTexts || []).length === 0 && (
                                            <p className="text-xs text-gray-400 mt-2 italic">No animated texts added. Defaults will be used (Engineering Excellence, Medical Mastery, etc.)</p>
                                        )}
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

                                {/* Logo Upload Section */}
                                <div className="border-t pt-6">
                                    <h3 className="text-md font-semibold mb-4">Logo</h3>
                                    <div className="flex items-start gap-6">
                                        {/* Logo Preview */}
                                        <div className="flex-shrink-0">
                                            {formData.siteInfo.logo?.url || formData.siteInfo.logo ? (
                                                <div className="relative group">
                                                    <img
                                                        src={formData.siteInfo.logo?.url || formData.siteInfo.logo}
                                                        alt="Site logo"
                                                        className="w-32 h-32 object-contain rounded-xl border-2 border-gray-200 bg-gray-50 p-2"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveLogo}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                        title="Remove logo"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                                    <Image className="w-8 h-8 mb-1" />
                                                    <span className="text-xs">No logo</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload Control */}
                                        <div className="flex-1">
                                            <input
                                                ref={logoInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="hidden"
                                                id="logo-upload"
                                            />
                                            <label
                                                htmlFor="logo-upload"
                                                className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                {uploadingLogo ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4" />
                                                        {formData.siteInfo.logo?.url || formData.siteInfo.logo ? 'Change Logo' : 'Upload Logo'}
                                                    </>
                                                )}
                                            </label>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Recommended: Square image, at least 200×200px. Max 2MB. PNG or SVG preferred.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Landing Page Settings */}
                        {activeTab === 'landing' && (
                            <div className="space-y-8">
                                {/* Programs Section */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> Programs Section
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.programs?.badge || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, programs: { ...formData.siteInfo.landingPage?.programs, badge: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.programs?.description || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, programs: { ...formData.siteInfo.landingPage?.programs, description: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Part 1 (Black)</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.programs?.titleLine1 || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, programs: { ...formData.siteInfo.landingPage?.programs, titleLine1: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Part 2 (Gradient)</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.programs?.titleLine2 || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, programs: { ...formData.siteInfo.landingPage?.programs, titleLine2: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Why Choose Us Section */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> Why Choose Us Section
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.whyChooseUs?.badge || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, whyChooseUs: { ...formData.siteInfo.landingPage?.whyChooseUs, badge: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Part 1 (Black)</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.whyChooseUs?.titleLine1 || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, whyChooseUs: { ...formData.siteInfo.landingPage?.whyChooseUs, titleLine1: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Part 2 (Gradient)</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.whyChooseUs?.titleLine2 || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, whyChooseUs: { ...formData.siteInfo.landingPage?.whyChooseUs, titleLine2: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Hall of Fame Section */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <Trophy className="w-4 h-4" /> Hall of Fame Section
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.hallOfFame?.badge || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, hallOfFame: { ...formData.siteInfo.landingPage?.hallOfFame, badge: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Part 1 (Black)</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.hallOfFame?.titleLine1 || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, hallOfFame: { ...formData.siteInfo.landingPage?.hallOfFame, titleLine1: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Part 2 (Gradient)</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.hallOfFame?.titleLine2 || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, hallOfFame: { ...formData.siteInfo.landingPage?.hallOfFame, titleLine2: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Success Stories Section */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <MessageCircle className="w-4 h-4" /> Success Stories Section
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.successStories?.badge || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, successStories: { ...formData.siteInfo.landingPage?.successStories, badge: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Part 1 (Black)</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.successStories?.titleLine1 || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, successStories: { ...formData.siteInfo.landingPage?.successStories, titleLine1: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Part 2 (Gradient)</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.successStories?.titleLine2 || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, successStories: { ...formData.siteInfo.landingPage?.successStories, titleLine2: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Faculty Section */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Faculty Section
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.faculty?.badge || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, faculty: { ...formData.siteInfo.landingPage?.faculty, badge: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Part 1 (Black)</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.faculty?.titleLine1 || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, faculty: { ...formData.siteInfo.landingPage?.faculty, titleLine1: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title Part 2 (Gradient)</label>
                                            <input
                                                type="text"
                                                value={formData.siteInfo.landingPage?.faculty?.titleLine2 || ''}
                                                onChange={(e) => handleChange('siteInfo', 'landingPage', { ...formData.siteInfo.landingPage, faculty: { ...formData.siteInfo.landingPage?.faculty, titleLine2: e.target.value } })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={saveMutation.isLoading || !hasChanges}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {saveMutation.isLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
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

                        {/* Receipt Template Tab */}
                        {activeTab === 'receipt' && (
                            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                                <h2 className="text-lg font-semibold">Receipt Template</h2>
                                <p className="text-sm text-gray-500 mb-4">Customize how your payment receipts look. Changes will apply to all future receipts.</p>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Settings Column */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={formData.receiptTemplate.primaryColor}
                                                    onChange={(e) => handleChange('receiptTemplate', 'primaryColor', e.target.value)}
                                                    className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.receiptTemplate.primaryColor}
                                                    onChange={(e) => handleChange('receiptTemplate', 'primaryColor', e.target.value)}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Used for borders, headers, and highlights.</p>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.receiptTemplate.showLogo}
                                                    onChange={(e) => handleChange('receiptTemplate', 'showLogo', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <div>
                                                    <span className="font-medium block">Show Logo</span>
                                                    <span className="text-xs text-gray-500">Display institute logo in header</span>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.receiptTemplate.showQRCode}
                                                    onChange={(e) => handleChange('receiptTemplate', 'showQRCode', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <div>
                                                    <span className="font-medium block">Show QR Code</span>
                                                    <span className="text-xs text-gray-500">Enable student portal login QR code</span>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.receiptTemplate.showCredentialsOnFirst}
                                                    onChange={(e) => handleChange('receiptTemplate', 'showCredentialsOnFirst', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <div>
                                                    <span className="font-medium block">Show Credentials</span>
                                                    <span className="text-xs text-gray-500">Show login username/password on first receipt only</span>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Left Signature</label>
                                                <input
                                                    type="text"
                                                    value={formData.receiptTemplate.signatureLeftLabel}
                                                    onChange={(e) => handleChange('receiptTemplate', 'signatureLeftLabel', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Right Signature</label>
                                                <input
                                                    type="text"
                                                    value={formData.receiptTemplate.signatureRightLabel}
                                                    onChange={(e) => handleChange('receiptTemplate', 'signatureRightLabel', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Footer Note</label>
                                            <textarea
                                                value={formData.receiptTemplate.footerNote}
                                                onChange={(e) => handleChange('receiptTemplate', 'footerNote', e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Preview Column */}
                                    <div className="border rounded-lg p-1 bg-gray-100">
                                        <p className="text-xs text-gray-500 text-center mb-2 font-medium">Live Preview</p>
                                        <div
                                            className="bg-white p-4 shadow-sm mx-auto text-[10px] leading-relaxed origin-top transform scale-95"
                                            style={{
                                                width: '100%',
                                                maxWidth: '350px',
                                                border: `2px solid ${formData.receiptTemplate.primaryColor}`,
                                                fontFamily: 'sans-serif'
                                            }}
                                        >
                                            <div className="text-center border-b pb-2 mb-2" style={{ borderColor: formData.receiptTemplate.primaryColor }}>
                                                {formData.receiptTemplate.showLogo && formData.siteInfo.logo?.url && (
                                                    <img src={formData.siteInfo.logo.url} alt="Logo" className="h-8 mx-auto mb-1" />
                                                )}
                                                <div className="font-bold text-lg" style={{ color: formData.receiptTemplate.primaryColor }}>
                                                    {formData.siteInfo.name || 'Institute Name'}
                                                </div>
                                                <div className="text-gray-500">
                                                    {formData.contact.address.city || 'City'}, {formData.contact.address.country || 'Country'}
                                                </div>
                                            </div>

                                            <div className="text-white font-bold text-center py-1 mb-3" style={{ backgroundColor: formData.receiptTemplate.primaryColor }}>
                                                PAYMENT RECEIPT
                                            </div>

                                            <div className="flex justify-between bg-gray-50 p-2 rounded mb-3">
                                                <div className="text-center">
                                                    <div className="text-gray-500 text-[8px] uppercase">Receipt No</div>
                                                    <div className="font-bold" style={{ color: formData.receiptTemplate.primaryColor }}>REC-001</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-gray-500 text-[8px] uppercase">Amount</div>
                                                    <div className="font-bold" style={{ color: formData.receiptTemplate.primaryColor }}>৳5,000</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-gray-500 text-[8px] uppercase">Date</div>
                                                    <div className="font-bold" style={{ color: formData.receiptTemplate.primaryColor }}>12 Feb 2026</div>
                                                </div>
                                            </div>

                                            <div className="space-y-1 mb-3">
                                                <div className="flex justify-between border-b border-dashed border-gray-200 py-1">
                                                    <span className="text-gray-500">Name:</span>
                                                    <span className="font-medium">John Doe</span>
                                                </div>
                                                <div className="flex justify-between border-b border-dashed border-gray-200 py-1">
                                                    <span className="text-gray-500">Roll No:</span>
                                                    <span className="font-medium">1001</span>
                                                </div>
                                            </div>

                                            <div className="border border-gray-200 mt-2">
                                                <div className="bg-gray-50 p-1 font-semibold border-b border-gray-200">Total Fee</div>
                                                <div className="p-1 text-right">5,000</div>
                                            </div>

                                            <div className="flex justify-between mt-8 pt-2">
                                                <div className="w-16 border-t border-black text-center text-[8px]">{formData.receiptTemplate.signatureLeftLabel}</div>
                                                <div className="w-16 border-t border-black text-center text-[8px]">{formData.receiptTemplate.signatureRightLabel}</div>
                                            </div>

                                            <div className="text-center text-gray-500 italic mt-4 text-[8px]">
                                                {formData.receiptTemplate.footerNote}
                                            </div>
                                        </div>
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
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900 mb-1">SMS Notifications</h3>
                                                <p className="text-sm text-gray-500">
                                                    SMS settings have moved to a dedicated management page.
                                                </p>
                                            </div>
                                            <a
                                                href="/admin/sms-management"
                                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                Go to SMS Management
                                            </a>
                                        </div>
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
