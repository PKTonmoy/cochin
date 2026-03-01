/**
 * MarketingDashboard.jsx
 * Admin panel for managing the isolated Marketing Module
 * Features: Master Toggle, Pop-ups, Promo Sections, Offer Banners, QR Videos
 */

import { useState, useEffect, useCallback } from 'react'
import api from '../../lib/api'
import {
    Megaphone, Settings, Image, Gift, QrCode, Plus, Edit2, Trash2,
    ToggleLeft, ToggleRight, GripVertical, Eye, EyeOff, ExternalLink,
    Upload, Play, BarChart3, Copy, Check, X, Loader2, AlertTriangle
} from 'lucide-react'

// ============================================================
// STYLES — All inline to maintain isolation (mkt- prefix)
// ============================================================
const STYLES = {
    page: {
        maxWidth: '1200px', margin: '0 auto', padding: '24px',
        fontFamily: "'Inter', -apple-system, sans-serif"
    },
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px'
    },
    title: {
        fontSize: '24px', fontWeight: '700', color: '#1e293b',
        display: 'flex', alignItems: 'center', gap: '10px'
    },
    tabs: {
        display: 'flex', gap: '4px', borderBottom: '2px solid #e2e8f0',
        marginBottom: '24px', flexWrap: 'wrap'
    },
    tab: (active) => ({
        padding: '10px 18px', cursor: 'pointer', fontWeight: active ? '600' : '400',
        color: active ? '#3b82f6' : '#64748b', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
        marginBottom: '-2px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '14px', background: 'none', border: 'none', whiteSpace: 'nowrap'
    }),
    card: {
        background: '#fff', borderRadius: '12px', padding: '20px',
        border: '1px solid #e2e8f0', marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    },
    btn: (variant = 'primary') => ({
        padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
        fontWeight: '500', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px',
        transition: 'all 0.2s',
        ...(variant === 'primary' && { background: '#3b82f6', color: '#fff' }),
        ...(variant === 'danger' && { background: '#ef4444', color: '#fff' }),
        ...(variant === 'success' && { background: '#10b981', color: '#fff' }),
        ...(variant === 'outline' && { background: '#fff', color: '#3b82f6', border: '1px solid #3b82f6' }),
        ...(variant === 'ghost' && { background: 'transparent', color: '#64748b' })
    }),
    input: {
        width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
        fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
    },
    select: {
        width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
        fontSize: '14px', outline: 'none', background: '#fff', boxSizing: 'border-box'
    },
    textarea: {
        width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
        fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical',
        fontFamily: 'inherit', boxSizing: 'border-box'
    },
    label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' },
    formGroup: { marginBottom: '16px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
    badge: (active) => ({
        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px',
        borderRadius: '20px', fontSize: '12px', fontWeight: '500',
        background: active ? '#dcfce7' : '#fee2e2', color: active ? '#16a34a' : '#dc2626'
    }),
    modal: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px'
    },
    modalContent: {
        background: '#fff', borderRadius: '16px', padding: '24px', width: '100%',
        maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
    },
    modalHeader: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0'
    },
    stat: {
        textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '10px',
        border: '1px solid #e2e8f0'
    },
    statValue: { fontSize: '28px', fontWeight: '700', color: '#1e293b' },
    statLabel: { fontSize: '12px', color: '#64748b', marginTop: '4px' },
    colorPreview: (color) => ({
        width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #d1d5db',
        background: color, display: 'inline-block', verticalAlign: 'middle', marginLeft: '8px'
    }),
    dragHandle: {
        cursor: 'grab', color: '#94a3b8', display: 'flex', alignItems: 'center'
    },
    imgPreview: {
        width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px',
        marginTop: '8px', border: '1px solid #e2e8f0'
    },
    qrImg: {
        width: '160px', height: '160px', borderRadius: '12px', border: '2px solid #e2e8f0',
        background: '#fff', padding: '8px'
    },
    emptyState: {
        textAlign: 'center', padding: '48px 20px', color: '#94a3b8'
    },
    toast: (type) => ({
        position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px',
        borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '500',
        zIndex: 10001, display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        background: type === 'error' ? '#ef4444' : '#10b981'
    })
}

// ============================================================
// COMPONENT
// ============================================================
export default function MarketingDashboard() {
    const [activeTab, setActiveTab] = useState('settings')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    // Data
    const [settings, setSettings] = useState({ marketingEnabled: true })
    const [popups, setPopups] = useState([])
    const [promos, setPromos] = useState([])
    const [banners, setBanners] = useState([])
    const [qrVideos, setQrVideos] = useState([])

    // Modal
    const [modal, setModal] = useState(null) // { type: 'popup'|'promo'|'banner'|'qrvideo', data: {}, isEdit: bool }

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    // --------------------------------------------------------
    // FETCH DATA
    // --------------------------------------------------------
    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const [settingsRes, popupsRes, promosRes, bannersRes, qrRes] = await Promise.all([
                api.get('/marketing/settings'),
                api.get('/marketing/popups'),
                api.get('/marketing/promos'),
                api.get('/marketing/banners'),
                api.get('/marketing/qr-videos')
            ])
            setSettings(settingsRes.data.data)
            setPopups(popupsRes.data.data)
            setPromos(promosRes.data.data)
            setBanners(bannersRes.data.data)
            setQrVideos(qrRes.data.data)
        } catch (err) {
            console.error('[MKT Admin] fetch error:', err)
            showToast('Failed to load marketing data', 'error')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    // --------------------------------------------------------
    // SETTINGS
    // --------------------------------------------------------
    const toggleMaster = async () => {
        try {
            setSaving(true)
            const res = await api.put('/marketing/settings', {
                marketingEnabled: !settings.marketingEnabled
            })
            setSettings(res.data.data)
            showToast(res.data.data.marketingEnabled ? 'Marketing enabled' : 'Marketing disabled')
        } catch (err) {
            showToast('Failed to update settings', 'error')
        } finally {
            setSaving(false)
        }
    }

    // --------------------------------------------------------
    // GENERIC CRUD HELPERS
    // --------------------------------------------------------
    const handleCreate = async (endpoint, data, hasFile, fileField) => {
        setSaving(true)
        try {
            let payload = data
            if (hasFile && data._file) {
                payload = new FormData()
                Object.entries(data).forEach(([k, v]) => {
                    if (k === '_file') payload.append(fileField, v)
                    else if (v !== null && v !== undefined) payload.append(k, v)
                })
            }
            await api.post(`/marketing/${endpoint}`, payload)
            showToast('Created successfully')
            setModal(null)
            fetchAll()
        } catch (err) {
            showToast(err.response?.data?.message || 'Create failed', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdate = async (endpoint, id, data, hasFile, fileField) => {
        setSaving(true)
        try {
            let payload = data
            if (hasFile && data._file) {
                payload = new FormData()
                Object.entries(data).forEach(([k, v]) => {
                    if (k === '_file') payload.append(fileField, v)
                    else if (v !== null && v !== undefined) payload.append(k, v)
                })
            }
            await api.put(`/marketing/${endpoint}/${id}`, payload)
            showToast('Updated successfully')
            setModal(null)
            fetchAll()
        } catch (err) {
            showToast(err.response?.data?.message || 'Update failed', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (endpoint, id, resourceType = '') => {
        if (!window.confirm('Are you sure you want to delete this?')) return
        try {
            await api.delete(`/marketing/${endpoint}/${id}`)
            showToast('Deleted successfully')
            fetchAll()
        } catch (err) {
            showToast('Delete failed', 'error')
        }
    }

    const handleToggleActive = async (endpoint, id, currentActive) => {
        try {
            await api.put(`/marketing/${endpoint}/${id}`, { isActive: !currentActive })
            fetchAll()
        } catch (err) {
            showToast('Toggle failed', 'error')
        }
    }

    // --------------------------------------------------------
    // DRAG & DROP for Promo Sections
    // --------------------------------------------------------
    const [dragIdx, setDragIdx] = useState(null)

    const handleDragStart = (idx) => setDragIdx(idx)
    const handleDragOver = (e) => e.preventDefault()
    const handleDrop = async (targetIdx) => {
        if (dragIdx === null || dragIdx === targetIdx) return
        const reordered = [...promos]
        const [moved] = reordered.splice(dragIdx, 1)
        reordered.splice(targetIdx, 0, moved)
        setPromos(reordered)
        setDragIdx(null)
        try {
            await api.post('/marketing/promos/reorder', {
                orderedIds: reordered.map(p => p._id)
            })
            showToast('Order updated')
        } catch (err) {
            showToast('Reorder failed', 'error')
            fetchAll()
        }
    }

    // --------------------------------------------------------
    // COPY QR URL
    // --------------------------------------------------------
    const [copiedId, setCopiedId] = useState(null)
    const copyQrUrl = async (video) => {
        const url = video.qrCodeUrl
        if (url) {
            await navigator.clipboard.writeText(url)
            setCopiedId(video._id)
            setTimeout(() => setCopiedId(null), 2000)
        }
    }

    // --------------------------------------------------------
    // RENDER TABS
    // --------------------------------------------------------
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        )
    }

    return (
        <div style={STYLES.page}>
            {/* Header */}
            <div style={STYLES.header}>
                <h1 style={STYLES.title}>
                    <Megaphone size={28} color="#3b82f6" /> Marketing Module
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>Module Status:</span>
                    <button onClick={toggleMaster} style={{ ...STYLES.btn(settings.marketingEnabled ? 'success' : 'danger'), padding: '8px 20px' }} disabled={saving}>
                        {settings.marketingEnabled ? <><ToggleRight size={18} /> Enabled</> : <><ToggleLeft size={18} /> Disabled</>}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={STYLES.tabs}>
                {[
                    { key: 'settings', label: 'Overview', icon: <BarChart3 size={16} /> },
                    { key: 'popups', label: 'Pop-ups', icon: <Image size={16} /> },
                    { key: 'promos', label: 'Promo Sections', icon: <Megaphone size={16} /> },
                    { key: 'banners', label: 'Offer Banners', icon: <Gift size={16} /> },
                    { key: 'qrvideos', label: 'QR Videos', icon: <QrCode size={16} /> }
                ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={STYLES.tab(activeTab === t.key)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'settings' && <OverviewTab popups={popups} promos={promos} banners={banners} qrVideos={qrVideos} settings={settings} />}
            {activeTab === 'popups' && (
                <ListSection
                    title="Pop-up Banners" items={popups}
                    onAdd={() => setModal({ type: 'popup', data: {}, isEdit: false })}
                    onEdit={(item) => setModal({ type: 'popup', data: item, isEdit: true })}
                    onDelete={(id) => handleDelete('popups', id)}
                    onToggle={(id, active) => handleToggleActive('popups', id, active)}
                    renderItem={(item) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.title}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    {item.displayFrequency} • {item.delaySeconds}s delay
                                    {item.ctaLabel && ` • CTA: ${item.ctaLabel}`}
                                </div>
                            </div>
                        </div>
                    )}
                />
            )}
            {activeTab === 'promos' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Promo Sections</h2>
                        <button style={STYLES.btn('primary')} onClick={() => setModal({ type: 'promo', data: {}, isEdit: false })}>
                            <Plus size={16} /> Add Section
                        </button>
                    </div>
                    {promos.length === 0 ? (
                        <div style={STYLES.emptyState}><Megaphone size={48} /><p>No promo sections yet</p></div>
                    ) : (
                        promos.map((item, idx) => (
                            <div key={item._id} style={{ ...STYLES.card, display: 'flex', alignItems: 'center', gap: '12px' }}
                                draggable onDragStart={() => handleDragStart(idx)} onDragOver={handleDragOver} onDrop={() => handleDrop(idx)}>
                                <div style={STYLES.dragHandle}><GripVertical size={20} /></div>
                                {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.heading}</div>
                                    {item.subheading && <div style={{ fontSize: '13px', color: '#64748b' }}>{item.subheading}</div>}
                                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                        BG: <span style={STYLES.colorPreview(item.bgColor)}></span>
                                        {item.ctaLabel && ` • CTA: ${item.ctaLabel}`}
                                    </div>
                                </div>
                                <span style={STYLES.badge(item.isActive)}>{item.isActive ? 'Active' : 'Hidden'}</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button style={STYLES.btn('ghost')} onClick={() => handleToggleActive('promos', item._id, item.isActive)}>
                                        {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button style={STYLES.btn('ghost')} onClick={() => setModal({ type: 'promo', data: item, isEdit: true })}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button style={STYLES.btn('ghost')} onClick={() => handleDelete('promos', item._id)}>
                                        <Trash2 size={16} color="#ef4444" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>💡 Drag items to reorder</p>
                </div>
            )}
            {activeTab === 'banners' && (
                <ListSection
                    title="Offer/Discount Banners" items={banners}
                    onAdd={() => setModal({ type: 'banner', data: {}, isEdit: false })}
                    onEdit={(item) => setModal({ type: 'banner', data: item, isEdit: true })}
                    onDelete={(id) => handleDelete('banners', id)}
                    onToggle={(id, active) => handleToggleActive('banners', id, active)}
                    renderItem={(item) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: item.bgColor, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Gift size={18} color={item.textColor} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{item.text.substring(0, 60)}{item.text.length > 60 ? '...' : ''}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    {item.bannerType} {item.endDate && `• Expires: ${new Date(item.endDate).toLocaleDateString()}`}
                                </div>
                            </div>
                        </div>
                    )}
                />
            )}
            {activeTab === 'qrvideos' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>QR Code Promotional Videos</h2>
                        <button style={STYLES.btn('primary')} onClick={() => setModal({ type: 'qrvideo', data: {}, isEdit: false })}>
                            <Plus size={16} /> Add Video
                        </button>
                    </div>
                    {qrVideos.length === 0 ? (
                        <div style={STYLES.emptyState}><QrCode size={48} /><p>No QR videos yet</p></div>
                    ) : (
                        qrVideos.map(v => (
                            <div key={v._id} style={{ ...STYLES.card, display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                {v.qrCodeUrl && <img src={v.qrCodeUrl} alt="QR Code" style={STYLES.qrImg} />}
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '16px', color: '#1e293b' }}>{v.title}</div>
                                            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                                {v.videoType === 'upload' ? '📹 Uploaded Video' : v.videoType === 'youtube' ? '▶️ YouTube' : '🎬 Vimeo'} • Animation: {v.animationStyle}
                                            </div>
                                        </div>
                                        <span style={STYLES.badge(v.isActive)}>{v.isActive ? 'Active' : 'Inactive'}</span>
                                    </div>
                                    <div style={{ ...STYLES.grid3, marginTop: '16px' }}>
                                        <div style={STYLES.stat}><div style={STYLES.statValue}>{v.scanCount || 0}</div><div style={STYLES.statLabel}>QR Scans</div></div>
                                        <div style={STYLES.stat}><div style={STYLES.statValue}>{v.watchCount || 0}</div><div style={STYLES.statLabel}>Completions</div></div>
                                        <div style={STYLES.stat}><div style={STYLES.statValue}>{v.scanCount > 0 ? Math.round((v.watchCount / v.scanCount) * 100) : 0}%</div><div style={STYLES.statLabel}>Watch Rate</div></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                        <button style={STYLES.btn('outline')} onClick={() => copyQrUrl(v)}>
                                            {copiedId === v._id ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy QR URL</>}
                                        </button>
                                        <a href={`/qr/${v._id}`} target="_blank" rel="noopener noreferrer" style={{ ...STYLES.btn('outline'), textDecoration: 'none' }}>
                                            <ExternalLink size={14} /> Preview
                                        </a>
                                        <button style={STYLES.btn('ghost')} onClick={() => handleToggleActive('qr-videos', v._id, v.isActive)}>
                                            {v.isActive ? <EyeOff size={14} /> : <Eye size={14} />} {v.isActive ? 'Disable' : 'Enable'}
                                        </button>
                                        <button style={STYLES.btn('ghost')} onClick={() => setModal({ type: 'qrvideo', data: v, isEdit: true })}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button style={STYLES.btn('ghost')} onClick={() => handleDelete('qr-videos', v._id)}>
                                            <Trash2 size={14} color="#ef4444" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal */}
            {modal && (
                <ModalForm
                    modal={modal}
                    saving={saving}
                    onClose={() => setModal(null)}
                    onCreate={(data) => {
                        const map = { popup: 'popups', promo: 'promos', banner: 'banners', qrvideo: 'qr-videos' }
                        const fileFieldMap = { popup: 'image', promo: 'image', qrvideo: 'video' }
                        const hasFile = ['popup', 'promo', 'qrvideo'].includes(modal.type)
                        handleCreate(map[modal.type], data, hasFile, fileFieldMap[modal.type])
                    }}
                    onUpdate={(id, data) => {
                        const map = { popup: 'popups', promo: 'promos', banner: 'banners', qrvideo: 'qr-videos' }
                        const fileFieldMap = { popup: 'image', promo: 'image', qrvideo: 'video' }
                        const hasFile = ['popup', 'promo', 'qrvideo'].includes(modal.type)
                        handleUpdate(map[modal.type], id, data, hasFile, fileFieldMap[modal.type])
                    }}
                />
            )}

            {/* Toast */}
            {toast && (
                <div style={STYLES.toast(toast.type)}>
                    {toast.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
                    {toast.message}
                </div>
            )}
        </div>
    )
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function OverviewTab({ popups, promos, banners, qrVideos, settings }) {
    const totalScans = qrVideos.reduce((s, v) => s + (v.scanCount || 0), 0)
    const totalWatches = qrVideos.reduce((s, v) => s + (v.watchCount || 0), 0)

    return (
        <div>
            <div style={STYLES.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <Settings size={20} color="#3b82f6" />
                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Module Overview</h2>
                </div>
                <div style={{ ...STYLES.grid2, marginBottom: '16px' }}>
                    <div style={STYLES.stat}>
                        <div style={STYLES.statValue}>{popups.filter(p => p.isActive).length}</div>
                        <div style={STYLES.statLabel}>Active Pop-ups</div>
                    </div>
                    <div style={STYLES.stat}>
                        <div style={STYLES.statValue}>{promos.filter(p => p.isActive).length}</div>
                        <div style={STYLES.statLabel}>Active Promo Sections</div>
                    </div>
                    <div style={STYLES.stat}>
                        <div style={STYLES.statValue}>{banners.filter(b => b.isActive).length}</div>
                        <div style={STYLES.statLabel}>Active Banners</div>
                    </div>
                    <div style={STYLES.stat}>
                        <div style={STYLES.statValue}>{qrVideos.filter(v => v.isActive).length}</div>
                        <div style={STYLES.statLabel}>Active QR Videos</div>
                    </div>
                </div>
                <div style={STYLES.grid2}>
                    <div style={STYLES.stat}>
                        <div style={STYLES.statValue}>{totalScans}</div>
                        <div style={STYLES.statLabel}>Total QR Scans</div>
                    </div>
                    <div style={STYLES.stat}>
                        <div style={STYLES.statValue}>{totalWatches}</div>
                        <div style={STYLES.statLabel}>Total Video Completions</div>
                    </div>
                </div>
            </div>
            {!settings.marketingEnabled && (
                <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '10px', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={20} color="#d97706" />
                    <span style={{ color: '#92400e', fontWeight: '500' }}>Marketing module is currently disabled. Enable it from the toggle above to show content on your website.</span>
                </div>
            )}
        </div>
    )
}

function ListSection({ title, items, onAdd, onEdit, onDelete, onToggle, renderItem }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{title}</h2>
                <button style={STYLES.btn('primary')} onClick={onAdd}>
                    <Plus size={16} /> Add New
                </button>
            </div>
            {items.length === 0 ? (
                <div style={STYLES.emptyState}><Image size={48} /><p>No items yet</p></div>
            ) : (
                items.map(item => (
                    <div key={item._id} style={{ ...STYLES.card, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {renderItem(item)}
                        <span style={STYLES.badge(item.isActive)}>{item.isActive ? 'Active' : 'Inactive'}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button style={STYLES.btn('ghost')} onClick={() => onToggle(item._id, item.isActive)}>
                                {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button style={STYLES.btn('ghost')} onClick={() => onEdit(item)}>
                                <Edit2 size={16} />
                            </button>
                            <button style={STYLES.btn('ghost')} onClick={() => onDelete(item._id)}>
                                <Trash2 size={16} color="#ef4444" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}

function ModalForm({ modal, saving, onClose, onCreate, onUpdate }) {
    const [form, setForm] = useState(modal.data || {})
    const [filePreview, setFilePreview] = useState(modal.data?.imageUrl || modal.data?.videoSource || '')

    const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

    const handleFile = (e) => {
        const file = e.target.files[0]
        if (!file) return
        set('_file', file)
        setFilePreview(URL.createObjectURL(file))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (modal.isEdit) {
            onUpdate(form._id, form)
        } else {
            onCreate(form)
        }
    }

    const isVideo = modal.type === 'qrvideo'

    return (
        <div style={STYLES.modal} onClick={onClose}>
            <div style={STYLES.modalContent} onClick={e => e.stopPropagation()}>
                <div style={STYLES.modalHeader}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                        {modal.isEdit ? 'Edit' : 'Create'} {
                            { popup: 'Pop-up', promo: 'Promo Section', banner: 'Offer Banner', qrvideo: 'QR Video' }[modal.type]
                        }
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* === POPUP FORM === */}
                    {modal.type === 'popup' && (
                        <>
                            <div style={STYLES.formGroup}>
                                <label style={STYLES.label}>Title *</label>
                                <input style={STYLES.input} value={form.title || ''} onChange={e => set('title', e.target.value)} required placeholder="Popup internal name" />
                            </div>
                            <div style={STYLES.formGroup}>
                                <label style={STYLES.label}>Content</label>
                                <textarea style={STYLES.textarea} value={form.content || ''} onChange={e => set('content', e.target.value)} placeholder="Popup message text..." />
                            </div>
                            <div style={STYLES.formGroup}>
                                <label style={STYLES.label}>Image</label>
                                <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize: '13px' }} />
                                {filePreview && <img src={filePreview} alt="Preview" style={STYLES.imgPreview} />}
                            </div>
                            <div style={STYLES.grid2}>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>CTA Button Label</label>
                                    <input style={STYLES.input} value={form.ctaLabel || ''} onChange={e => set('ctaLabel', e.target.value)} placeholder="e.g. Learn More" />
                                </div>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>CTA URL</label>
                                    <input style={STYLES.input} value={form.ctaUrl || ''} onChange={e => set('ctaUrl', e.target.value)} placeholder="https://..." />
                                </div>
                            </div>
                            <div style={STYLES.grid3}>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Frequency</label>
                                    <select style={STYLES.select} value={form.displayFrequency || 'always'} onChange={e => set('displayFrequency', e.target.value)}>
                                        <option value="always">Always</option>
                                        <option value="session">Once per session</option>
                                        <option value="daily">Once per day</option>
                                    </select>
                                </div>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Delay (seconds)</label>
                                    <input type="number" style={STYLES.input} value={form.delaySeconds ?? 3} onChange={e => set('delaySeconds', parseInt(e.target.value) || 0)} min="0" />
                                </div>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Active</label>
                                    <select style={STYLES.select} value={form.isActive !== false ? 'true' : 'false'} onChange={e => set('isActive', e.target.value === 'true')}>
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                </div>
                            </div>
                            <div style={STYLES.grid2}>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Start Date</label>
                                    <input type="datetime-local" style={STYLES.input} value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 16) : ''} onChange={e => set('startDate', e.target.value || null)} />
                                </div>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>End Date</label>
                                    <input type="datetime-local" style={STYLES.input} value={form.endDate ? new Date(form.endDate).toISOString().slice(0, 16) : ''} onChange={e => set('endDate', e.target.value || null)} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* === PROMO SECTION FORM === */}
                    {modal.type === 'promo' && (
                        <>
                            <div style={STYLES.formGroup}>
                                <label style={STYLES.label}>Heading *</label>
                                <input style={STYLES.input} value={form.heading || ''} onChange={e => set('heading', e.target.value)} required placeholder="Section heading" />
                            </div>
                            <div style={STYLES.formGroup}>
                                <label style={STYLES.label}>Subheading</label>
                                <input style={STYLES.input} value={form.subheading || ''} onChange={e => set('subheading', e.target.value)} placeholder="Optional subheading" />
                            </div>
                            <div style={STYLES.formGroup}>
                                <label style={STYLES.label}>Body</label>
                                <textarea style={STYLES.textarea} value={form.body || ''} onChange={e => set('body', e.target.value)} placeholder="Section body content..." />
                            </div>
                            <div style={STYLES.formGroup}>
                                <label style={STYLES.label}>Image</label>
                                <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize: '13px' }} />
                                {filePreview && <img src={filePreview} alt="Preview" style={STYLES.imgPreview} />}
                            </div>
                            <div style={STYLES.grid3}>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Background Color</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="color" value={form.bgColor || '#ffffff'} onChange={e => set('bgColor', e.target.value)} style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer' }} />
                                        <input style={{ ...STYLES.input, width: '100px' }} value={form.bgColor || '#ffffff'} onChange={e => set('bgColor', e.target.value)} />
                                    </div>
                                </div>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>CTA Label</label>
                                    <input style={STYLES.input} value={form.ctaLabel || ''} onChange={e => set('ctaLabel', e.target.value)} placeholder="e.g. Enroll Now" />
                                </div>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>CTA URL</label>
                                    <input style={STYLES.input} value={form.ctaUrl || ''} onChange={e => set('ctaUrl', e.target.value)} placeholder="https://..." />
                                </div>
                            </div>
                        </>
                    )}

                    {/* === OFFER BANNER FORM === */}
                    {modal.type === 'banner' && (
                        <>
                            <div style={STYLES.formGroup}>
                                <label style={STYLES.label}>Banner Text *</label>
                                <textarea style={STYLES.textarea} value={form.text || ''} onChange={e => set('text', e.target.value)} required placeholder="🎉 Special offer! 50% off all courses..." />
                            </div>
                            <div style={STYLES.grid3}>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Banner Type</label>
                                    <select style={STYLES.select} value={form.bannerType || 'ticker'} onChange={e => set('bannerType', e.target.value)}>
                                        <option value="ticker">Scrolling Ticker</option>
                                        <option value="sticky_top">Sticky Top Bar</option>
                                        <option value="sticky_bottom">Sticky Bottom Bar</option>
                                    </select>
                                </div>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Background Color</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="color" value={form.bgColor || '#ff6b35'} onChange={e => set('bgColor', e.target.value)} style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer' }} />
                                        <input style={{ ...STYLES.input, width: '80px' }} value={form.bgColor || '#ff6b35'} onChange={e => set('bgColor', e.target.value)} />
                                    </div>
                                </div>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Text Color</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="color" value={form.textColor || '#ffffff'} onChange={e => set('textColor', e.target.value)} style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer' }} />
                                        <input style={{ ...STYLES.input, width: '80px' }} value={form.textColor || '#ffffff'} onChange={e => set('textColor', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div style={STYLES.formGroup}>
                                <label style={STYLES.label}>Link URL (optional)</label>
                                <input style={STYLES.input} value={form.linkUrl || ''} onChange={e => set('linkUrl', e.target.value)} placeholder="https://..." />
                            </div>
                            <div style={STYLES.grid2}>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Start Date</label>
                                    <input type="datetime-local" style={STYLES.input} value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 16) : ''} onChange={e => set('startDate', e.target.value || null)} />
                                </div>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>End Date</label>
                                    <input type="datetime-local" style={STYLES.input} value={form.endDate ? new Date(form.endDate).toISOString().slice(0, 16) : ''} onChange={e => set('endDate', e.target.value || null)} />
                                </div>
                            </div>
                            <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '8px', fontSize: '13px', color: '#0369a1' }}>
                                💡 Preview: <span style={{ background: form.bgColor || '#ff6b35', color: form.textColor || '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px' }}>{form.text || 'Your banner text here'}</span>
                            </div>
                        </>
                    )}

                    {/* === QR VIDEO FORM === */}
                    {modal.type === 'qrvideo' && (
                        <>
                            <div style={STYLES.formGroup}>
                                <label style={STYLES.label}>Title *</label>
                                <input style={STYLES.input} value={form.title || ''} onChange={e => set('title', e.target.value)} required placeholder="Campaign title" />
                            </div>
                            <div style={STYLES.formGroup}>
                                <label style={STYLES.label}>Video Type</label>
                                <select style={STYLES.select} value={form.videoType || 'upload'} onChange={e => set('videoType', e.target.value)}>
                                    <option value="upload">Upload MP4</option>
                                    <option value="youtube">YouTube URL</option>
                                    <option value="vimeo">Vimeo URL</option>
                                </select>
                            </div>
                            {(form.videoType || 'upload') === 'upload' ? (
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Video File (MP4, max 100MB)</label>
                                    <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleFile} style={{ fontSize: '13px' }} />
                                    {filePreview && form._file && (
                                        <video src={filePreview} controls style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', marginTop: '8px' }} />
                                    )}
                                    {!form._file && form.videoSource && form.videoType === 'upload' && (
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Current: {form.videoSource.substring(0, 60)}...</div>
                                    )}
                                </div>
                            ) : (
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Video URL *</label>
                                    <input style={STYLES.input} value={form.videoSource || ''} onChange={e => set('videoSource', e.target.value)} required placeholder={form.videoType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://vimeo.com/...'} />
                                </div>
                            )}
                            <div style={STYLES.grid2}>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Post-Video Animation</label>
                                    <select style={STYLES.select} value={form.animationStyle || 'confetti'} onChange={e => set('animationStyle', e.target.value)}>
                                        <option value="confetti">🎉 Confetti</option>
                                        <option value="logo">⭐ Logo Reveal</option>
                                        <option value="ripple">🌊 Ripple</option>
                                        <option value="zoom">🔍 Zoom Out</option>
                                    </select>
                                </div>
                                <div style={STYLES.formGroup}>
                                    <label style={STYLES.label}>Redirect URL (after video)</label>
                                    <input style={STYLES.input} value={form.redirectUrl || '/'} onChange={e => set('redirectUrl', e.target.value)} placeholder="/" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Submit */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                        <button type="button" onClick={onClose} style={STYLES.btn('outline')}>Cancel</button>
                        <button type="submit" style={STYLES.btn('primary')} disabled={saving}>
                            {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : modal.isEdit ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
