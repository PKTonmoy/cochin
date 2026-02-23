import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    QrCode, Settings, BarChart3, Eye, Download, Save, RefreshCw,
    Search, Plus, Trash2, Copy, Smartphone, Monitor, ChevronDown,
    Palette, Type, Sliders, ToggleLeft, ToggleRight, ArrowRight
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import PWAInstallGuide from '../../components/PWAInstallGuide'

// ─── Tabs ────────────────────────────────────────────────────────
const TABS = [
    { id: 'qr', label: 'QR Codes', icon: QrCode },
    { id: 'guide', label: 'Install Guide', icon: Smartphone },
    { id: 'redirect', label: 'Redirect', icon: ArrowRight },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
]

const PWAQRSettings = () => {
    const [activeTab, setActiveTab] = useState('qr')
    const queryClient = useQueryClient()

    // ── Fetch settings ──
    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['pwa-settings'],
        queryFn: async () => {
            const res = await api.get('/pwa-settings')
            return res.data?.data
        }
    })

    // ── Save settings mutation ──
    const saveMutation = useMutation({
        mutationFn: (data) => api.put('/pwa-settings', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pwa-settings'] })
            toast.success('Settings saved successfully')
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to save')
    })

    const [settings, setSettings] = useState(null)

    useEffect(() => {
        if (settingsData) setSettings(JSON.parse(JSON.stringify(settingsData)))
    }, [settingsData])

    const handleSave = () => {
        if (settings) saveMutation.mutate(settings)
    }

    const updateField = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }))
    }

    if (isLoading || !settings) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">PWA & QR Codes</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage QR codes, installation guide, and smart redirects</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="btn-primary flex items-center gap-2 px-6"
                >
                    {saveMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Settings
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${activeTab === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={16} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'qr' && <QRCodesTab settings={settings} />}
            {activeTab === 'guide' && <GuideSettingsTab settings={settings} setSettings={setSettings} updateField={updateField} />}
            {activeTab === 'redirect' && <RedirectSettingsTab settings={settings} updateField={updateField} />}
            {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1: QR Codes
// ═══════════════════════════════════════════════════════════════════
const QRCodesTab = ({ settings }) => {
    const [globalQrResult, setGlobalQrResult] = useState(null)
    const [globalGenerating, setGlobalGenerating] = useState(false)

    const [roll, setRoll] = useState('')
    const [qrResult, setQrResult] = useState(null)
    const [bulkRolls, setBulkRolls] = useState('')
    const [bulkResults, setBulkResults] = useState([])
    const [generating, setGenerating] = useState(false)

    const generateGlobal = async () => {
        setGlobalGenerating(true)
        try {
            const res = await api.post('/qr/generate', { isGlobal: true })
            setGlobalQrResult(res.data?.data)
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to generate Global QR')
        } finally {
            setGlobalGenerating(false)
        }
    }

    const generateSingle = async () => {
        if (!roll.trim()) return toast.error('Enter a roll number')
        setGenerating(true)
        try {
            const res = await api.post('/qr/generate', { roll: roll.trim() })
            setQrResult(res.data?.data)
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to generate QR')
        } finally {
            setGenerating(false)
        }
    }

    const generateBulk = async () => {
        const rolls = bulkRolls.split(/[\n,\s]+/).map(r => r.trim()).filter(Boolean)
        if (rolls.length === 0) return toast.error('Enter roll numbers')
        if (rolls.length > 200) return toast.error('Maximum 200 at a time')
        setGenerating(true)
        try {
            const res = await api.post('/qr/bulk', { rolls })
            setBulkResults(res.data?.data || [])
            toast.success(`Generated ${res.data?.data?.length || 0} QR codes`)
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to generate')
        } finally {
            setGenerating(false)
        }
    }

    const downloadQR = (dataUrl, filename) => {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = filename
        a.click()
    }

    return (
        <div className="space-y-6">
            {/* Global QR Generation */}
            <div className="card p-6 border-2 border-blue-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Smartphone size={20} className="text-blue-500" />
                            Global App QR Code
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">General QR code not linked to any specific student roll number. Ideal for posters and banners.</p>
                    </div>
                    <button onClick={generateGlobal} disabled={globalGenerating} className="btn-primary min-w-[140px]">
                        {globalGenerating ? <RefreshCw size={16} className="animate-spin mx-auto" /> : 'Generate Global'}
                    </button>
                </div>

                {globalQrResult && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                            <img src={globalQrResult.qrImage} alt="Global QR Code" className="w-32 h-32" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <p className="text-lg font-bold text-gray-900 mb-3">Global App Link</p>
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                <button
                                    onClick={() => downloadQR(globalQrResult.qrImage, 'PARAGON-Global-QR.png')}
                                    className="btn-outline px-4 py-2 text-sm bg-white"
                                >
                                    <Download size={14} /> Download PNG
                                </button>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(globalQrResult.url); toast.success('URL copied!') }}
                                    className="btn-outline px-4 py-2 text-sm bg-white"
                                >
                                    <Copy size={14} /> Copy URL
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Single QR Generation */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <QrCode size={20} className="text-blue-500" />
                    Generate Single QR Code
                </h3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={roll}
                        onChange={e => setRoll(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter Roll Number"
                        className="input flex-1"
                        inputMode="numeric"
                    />
                    <button onClick={generateSingle} disabled={generating} className="btn-primary px-6">
                        {generating ? <RefreshCw size={16} className="animate-spin" /> : 'Generate'}
                    </button>
                </div>

                {/* QR Preview */}
                {qrResult && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 p-4 bg-gray-50 rounded-xl">
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                            <img src={qrResult.qrImage} alt="QR Code" className="w-48 h-48" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm text-gray-500">Roll Number</p>
                            <p className="text-xl font-bold font-mono text-gray-900">{qrResult.roll}</p>
                            {qrResult.studentName && (
                                <>
                                    <p className="text-sm text-gray-500 mt-2">Student Name</p>
                                    <p className="text-base font-semibold text-gray-800">{qrResult.studentName}</p>
                                </>
                            )}
                            <div className="flex gap-2 mt-4 justify-center sm:justify-start">
                                <button
                                    onClick={() => downloadQR(qrResult.qrImage, `QR-${qrResult.roll}.png`)}
                                    className="btn-outline px-4 py-2 text-sm"
                                >
                                    <Download size={14} /> PNG
                                </button>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(qrResult.url); toast.success('URL copied!') }}
                                    className="btn-outline px-4 py-2 text-sm"
                                >
                                    <Copy size={14} /> Copy URL
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk QR Generation */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-blue-500" />
                    Bulk QR Generation
                </h3>
                <textarea
                    value={bulkRolls}
                    onChange={e => setBulkRolls(e.target.value)}
                    placeholder="Enter roll numbers (one per line, or comma separated)&#10;e.g., 11001, 11002, 11003"
                    className="input min-h-[100px] font-mono text-sm"
                    rows={4}
                />
                <button onClick={generateBulk} disabled={generating} className="btn-primary mt-3 px-6">
                    {generating ? <RefreshCw size={16} className="animate-spin" /> : 'Generate All'}
                </button>

                {/* Bulk Results Grid */}
                {bulkResults.length > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-gray-600">{bulkResults.length} QR codes generated</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {bulkResults.map((qr) => (
                                <div key={qr.roll} className="bg-gray-50 rounded-xl p-3 text-center">
                                    <img src={qr.qrImage} alt={`QR-${qr.roll}`} className="w-full aspect-square mb-2" />
                                    <p className="text-xs font-bold font-mono">{qr.roll}</p>
                                    {qr.studentName && <p className="text-xs text-gray-500 truncate">{qr.studentName}</p>}
                                    <button
                                        onClick={() => downloadQR(qr.qrImage, `QR-${qr.roll}.png`)}
                                        className="mt-2 text-xs text-blue-500 hover:underline"
                                    >
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2: Install Guide Settings
// ═══════════════════════════════════════════════════════════════════
const GuideSettingsTab = ({ settings, setSettings, updateField }) => {
    const [showPreview, setShowPreview] = useState(false)
    const vis = settings.guideVisibility || {}
    const content = settings.guideContent || {}
    const appearance = settings.guideAppearance || {}

    const updateVis = (field, val) => updateField('guideVisibility', field, val)
    const updateContent = (field, val) => updateField('guideContent', field, val)
    const updateAppearance = (field, val) => updateField('guideAppearance', field, val)

    const updateBenefit = (index, field, val) => {
        const benefits = [...(content.benefits || [])]
        benefits[index] = { ...benefits[index], [field]: val }
        updateContent('benefits', benefits)
    }

    const addBenefit = () => {
        const benefits = [...(content.benefits || []), { emoji: '✨', text: 'New Benefit' }]
        updateContent('benefits', benefits)
    }

    const removeBenefit = (index) => {
        const benefits = (content.benefits || []).filter((_, i) => i !== index)
        updateContent('benefits', benefits)
    }

    return (
        <div className="space-y-6">
            {/* Preview Guide Overlay */}
            {showPreview && (
                <PWAInstallGuide
                    settings={settings}
                    onClose={() => setShowPreview(false)}
                    onInstallComplete={() => setShowPreview(false)}
                    deferredPrompt={null}
                />
            )}

            {/* Preview Button */}
            <div className="card p-4 border-2 border-dashed border-blue-300 bg-blue-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Eye size={18} className="text-blue-500" />
                            Live Preview
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">See how the install guide looks to students with your current settings</p>
                    </div>
                    <button
                        onClick={() => setShowPreview(true)}
                        className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm whitespace-nowrap"
                    >
                        <Eye size={16} /> Preview Guide
                    </button>
                </div>
            </div>
            {/* Visibility Toggles */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Eye size={20} className="text-blue-500" />
                    Guide Visibility
                </h3>
                <div className="space-y-4">
                    <ToggleRow label="Show to new visitors" checked={vis.showToNewVisitors !== false} onChange={v => updateVis('showToNewVisitors', v)} />
                    <ToggleRow label="Show when student scans QR" checked={vis.showOnQRScan !== false} onChange={v => updateVis('showOnQRScan', v)} />
                    <ToggleRow label="Show on direct website visit" checked={vis.showOnDirectVisit !== false} onChange={v => updateVis('showOnDirectVisit', v)} />
                    <ToggleRow label="Re-show after dismissal" checked={vis.reShowAfterDismissal !== false} onChange={v => updateVis('reShowAfterDismissal', v)} />
                    {vis.reShowAfterDismissal !== false && (
                        <div className="ml-8 flex items-center gap-2">
                            <label className="text-sm text-gray-600">Re-show after</label>
                            <input
                                type="number"
                                value={vis.reShowDays || 3}
                                onChange={e => updateVis('reShowDays', parseInt(e.target.value) || 3)}
                                className="input w-20 text-center"
                                min={1} max={30}
                            />
                            <span className="text-sm text-gray-600">days</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Type size={20} className="text-blue-500" />
                    Guide Content
                </h3>
                <div className="space-y-4">
                    <InputRow label="Welcome Heading" value={content.welcomeHeading || ''} onChange={v => updateContent('welcomeHeading', v)} />
                    <InputRow label="Welcome Subtext" value={content.welcomeSubtext || ''} onChange={v => updateContent('welcomeSubtext', v)} multiline />
                    <InputRow label="Install Button Text" value={content.installButtonText || ''} onChange={v => updateContent('installButtonText', v)} />
                    <InputRow label="Maybe Later Text" value={content.maybeLaterText || ''} onChange={v => updateContent('maybeLaterText', v)} />
                    <InputRow label="Success Heading" value={content.successHeading || ''} onChange={v => updateContent('successHeading', v)} />
                    <InputRow label="Success Subtext" value={content.successSubtext || ''} onChange={v => updateContent('successSubtext', v)} />

                    {/* Benefits */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Benefit Items</label>
                        <div className="space-y-2">
                            {(content.benefits || []).map((b, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        value={b.emoji || ''}
                                        onChange={e => updateBenefit(i, 'emoji', e.target.value)}
                                        className="input w-16 text-center text-lg"
                                        maxLength={2}
                                    />
                                    <input
                                        value={b.text || ''}
                                        onChange={e => updateBenefit(i, 'text', e.target.value)}
                                        className="input flex-1"
                                    />
                                    <button onClick={() => removeBenefit(i)} className="p-2 text-red-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addBenefit} className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-1">
                                <Plus size={14} /> Add Benefit
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Palette size={20} className="text-blue-500" />
                    Guide Appearance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorRow label="Primary Color" value={appearance.primaryColor || '#3b82f6'} onChange={v => updateAppearance('primaryColor', v)} />
                    <ColorRow label="Button Color" value={appearance.buttonColor || '#3b82f6'} onChange={v => updateAppearance('buttonColor', v)} />
                    <ColorRow label="Card Background" value={appearance.cardBackgroundColor || '#ffffff'} onChange={v => updateAppearance('cardBackgroundColor', v)} />
                    <ColorRow label="Text Color" value={appearance.textColor || '#1e293b'} onChange={v => updateAppearance('textColor', v)} />
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Overlay Opacity</label>
                        <input
                            type="range" min={0} max={100}
                            value={appearance.overlayOpacity ?? 60}
                            onChange={e => updateAppearance('overlayOpacity', parseInt(e.target.value))}
                            className="w-full"
                        />
                        <span className="text-xs text-gray-500">{appearance.overlayOpacity ?? 60}%</span>
                    </div>
                    <SelectRow label="Animation Speed" value={appearance.animationSpeed || 'normal'} onChange={v => updateAppearance('animationSpeed', v)} options={['slow', 'normal', 'fast', 'none']} />
                    <SelectRow label="Font Size" value={appearance.fontSize || 'medium'} onChange={v => updateAppearance('fontSize', v)} options={['small', 'medium', 'large']} />
                    <ToggleRow label="Show Benefits Section" checked={appearance.showBenefits !== false} onChange={v => updateAppearance('showBenefits', v)} />
                    <ToggleRow label="Show Phone Mockup" checked={appearance.showPhoneMockup !== false} onChange={v => updateAppearance('showPhoneMockup', v)} />
                </div>
            </div>

            {/* Android Steps */}
            <StepsEditor
                title="Android Installation Steps"
                steps={settings.androidSteps || []}
                onChange={(steps) => setSettings(prev => ({ ...prev, androidSteps: steps }))}
            />

            {/* iOS Steps */}
            <StepsEditor
                title="iOS Installation Steps"
                steps={settings.iosSteps || []}
                onChange={(steps) => setSettings(prev => ({ ...prev, iosSteps: steps }))}
            />
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3: Redirect Settings
// ═══════════════════════════════════════════════════════════════════
const RedirectSettingsTab = ({ settings, updateField }) => {
    const r = settings.redirectSettings || {}
    const update = (field, val) => updateField('redirectSettings', field, val)

    return (
        <div className="card p-6 space-y-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowRight size={20} className="text-blue-500" />
                Smart Redirect Settings
            </h3>
            <ToggleRow label="Enable smart redirect" checked={r.enabled !== false} onChange={v => update('enabled', v)} />
            <InputRow label="PWA Redirect URL (installed)" value={r.pwaRedirectUrl || ''} onChange={v => update('pwaRedirectUrl', v)} placeholder="/student-login" />
            <InputRow label="Non-PWA Redirect URL" value={r.nonPwaRedirectUrl || ''} onChange={v => update('nonPwaRedirectUrl', v)} placeholder="/student-login" />
            <InputRow label="Desktop Redirect URL" value={r.desktopRedirectUrl || ''} onChange={v => update('desktopRedirectUrl', v)} placeholder="/student-login" />
            <div className="border-t pt-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3">"Open in App" Button</h4>
                <ToggleRow label="Show button on website" checked={r.showOpenInAppButton !== false} onChange={v => update('showOpenInAppButton', v)} />
                <InputRow label="Button Text" value={r.openInAppButtonText || ''} onChange={v => update('openInAppButtonText', v)} placeholder="Open in App" />
                <ColorRow label="Button Color" value={r.openInAppButtonColor || '#3b82f6'} onChange={v => update('openInAppButtonColor', v)} />
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// TAB 4: Analytics
// ═══════════════════════════════════════════════════════════════════
const AnalyticsTab = () => {
    const [period, setPeriod] = useState('month')

    const { data, isLoading } = useQuery({
        queryKey: ['pwa-analytics', period],
        queryFn: async () => {
            const res = await api.get(`/pwa-settings/analytics?period=${period}`)
            return res.data?.data
        }
    })

    if (isLoading) return <div className="flex justify-center py-20"><div className="spinner" /></div>

    const summary = data?.summary || {}
    const devices = data?.deviceBreakdown || []

    const statCards = [
        { label: 'Total Scans', value: summary.totalScans || 0, color: '#3b82f6' },
        { label: 'PWA Installed', value: summary.pwaInstalled || 0, color: '#10b981' },
        { label: 'Guide Shown', value: summary.guideShown || 0, color: '#f59e0b' },
        { label: 'Install Rate', value: `${summary.installRate || 0}%`, color: '#a855f7' }
    ]

    return (
        <div className="space-y-6">
            {/* Period selector */}
            <div className="flex gap-2">
                {['today', 'week', 'month'].map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${period === p ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                    </button>
                ))}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map(card => (
                    <div key={card.label} className="card p-5 text-center">
                        <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Device breakdown */}
            <div className="card p-6">
                <h4 className="text-sm font-bold text-gray-700 mb-4">Device Breakdown</h4>
                {devices.length === 0 ? (
                    <p className="text-sm text-gray-400">No data yet</p>
                ) : (
                    <div className="space-y-3">
                        {devices.map(d => {
                            const total = devices.reduce((s, x) => s + x.count, 0)
                            const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
                            const colors = { android: '#10b981', ios: '#3b82f6', desktop: '#6366f1', unknown: '#94a3b8' }
                            return (
                                <div key={d._id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium capitalize">{d._id || 'Unknown'}</span>
                                        <span className="text-gray-500">{d.count} ({pct}%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[d._id] || '#94a3b8' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
// Shared UI Components
// ═══════════════════════════════════════════════════════════════════
const ToggleRow = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-1">
        <span className="text-sm text-gray-700">{label}</span>
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </button>
    </div>
)

const InputRow = ({ label, value, onChange, placeholder, multiline }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
        {multiline ? (
            <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input text-sm" rows={2} />
        ) : (
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input text-sm" />
        )}
    </div>
)

const ColorRow = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
        <div className="flex items-center gap-2">
            <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
            <input value={value} onChange={e => onChange(e.target.value)} className="input text-sm font-mono flex-1" />
        </div>
    </div>
)

const SelectRow = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="input text-sm capitalize">
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
)

const StepsEditor = ({ title, steps, onChange }) => {
    const updateStep = (index, field, val) => {
        const updated = [...steps]
        updated[index] = { ...updated[index], [field]: val }
        onChange(updated)
    }
    const addStep = () => onChange([...steps, { stepNumber: steps.length + 1, title: '', description: '' }])
    const removeStep = (i) => onChange(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stepNumber: idx + 1 })))

    return (
        <div className="card p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">{title}</h3>
            <div className="space-y-3">
                {steps.map((step, i) => (
                    <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                            {i + 1}
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <input value={step.title || ''} onChange={e => updateStep(i, 'title', e.target.value)} className="input text-sm" placeholder="Step title" />
                            <input value={step.description || ''} onChange={e => updateStep(i, 'description', e.target.value)} className="input text-sm" placeholder="Step description" />
                        </div>
                        <button onClick={() => removeStep(i)} className="p-1.5 text-red-400 hover:text-red-600 mt-1">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                <button onClick={addStep} className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                    <Plus size={14} /> Add Step
                </button>
            </div>
        </div>
    )
}

export default PWAQRSettings
