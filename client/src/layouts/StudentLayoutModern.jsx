/**
 * Modern Student Layout
 * Futuristic, dark-mode enabled layout for student portal
 * With advanced PWA features: offline detection, pull-to-refresh,
 * app update prompt, smart prefetching, haptic feedback
 */

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    LayoutDashboard,
    FileText,
    User,
    LogOut,
    Menu,
    X,
    Calendar,
    Home,
    ChevronRight,
    Settings,
    BookOpen,
    Award,
    ClipboardCheck,
    Bell
} from 'lucide-react'
import NotificationBell from '../components/NotificationBell'
import { useSocketUpdates } from '../hooks/useSocketUpdates'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useAppUpdate } from '../hooks/useAppUpdate'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { usePrefetch } from '../hooks/usePrefetch'
import { useHaptics } from '../hooks/useHaptics'
import { useAdaptiveLoading } from '../hooks/useAdaptiveLoading'
import { NetworkStatusBanner, AppUpdateBanner, PullToRefreshIndicator } from '../components/PWAFeatures'
import api from '../lib/api'

const StudentLayoutModern = () => {
    const { user, logout } = useAuth()
    const { settings } = useSettings()
    const siteName = settings?.siteInfo?.name || 'Institute'
    const logoUrl = settings?.siteInfo?.logo?.url || ''
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Initialize real-time updates via Socket.IO for the entire student session
    useSocketUpdates(user?.id, user?.class, user?.section)

    // ─── Advanced PWA Hooks ─────────────────────────────────────
    const networkStatus = useNetworkStatus()
    const { updateAvailable, applyUpdate, dismissUpdate } = useAppUpdate()
    const haptics = useHaptics()
    const { enablePrefetch, enableAnimations } = useAdaptiveLoading()
    const { pullProgress, isRefreshing, showIndicator } = usePullToRefresh()
    usePrefetch({
        enabled: enablePrefetch && networkStatus.isOnline,
        userRoll: user?.roll,
        userClass: user?.class,
        userId: user?.id,
    })

    const menuItems = [
        { path: '/student', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { path: '/student/schedule', icon: Calendar, label: 'My Schedule' },
        { path: '/student/results', icon: FileText, label: 'My Results' },
        { path: '/student/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { path: '/student/notices', icon: Bell, label: 'Notices' },
        { path: '/student/profile', icon: User, label: 'Profile' },
    ]

    const [localReadIds, setLocalReadIds] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('read-broadcast-notices') || '[]')) }
        catch { return new Set() }
    })

    // Fetch notifications to calculate true unread count (shared with NotificationBell)
    const { data: noticesData } = useQuery({
        queryKey: ['notifications', true],
        queryFn: async () => {
            const res = await api.get('/notifications/student-notices?limit=20')
            return res.data?.data
        },
        refetchInterval: 60000
    })

    useEffect(() => {
        try { setLocalReadIds(new Set(JSON.parse(localStorage.getItem('read-broadcast-notices') || '[]'))) } catch { }
    }, [noticesData])

    const rawNotices = noticesData?.notifications || []
    const unreadCount = rawNotices.filter(n => {
        if (['all', 'class'].includes(n.recipientType)) {
            return !localReadIds.has(n._id)
        }
        return !n.isRead
    }).length

    const isActive = (path, exact) => {
        if (exact) return location.pathname === path
        return location.pathname.startsWith(path)
    }

    const handleLogout = async () => {
        await logout()
        navigate('/student-login')
    }

    // Bottom nav tap handler with haptic feedback
    const handleNavTap = (path) => {
        haptics.tap()
    }

    return (
        <div className="min-h-screen bg-[var(--light)]">
            {/* ─── PWA Network Status Banner ─── */}
            <NetworkStatusBanner
                isOnline={networkStatus.isOnline}
                wasOffline={networkStatus.wasOffline}
                isSlowConnection={networkStatus.isSlowConnection}
            />

            {/* ─── Pull-to-Refresh Indicator ─── */}
            <PullToRefreshIndicator
                pullProgress={pullProgress}
                isRefreshing={isRefreshing}
                showIndicator={showIndicator}
            />

            {/* ─── App Update Banner ─── */}
            {updateAvailable && (
                <AppUpdateBanner
                    onUpdate={applyUpdate}
                    onDismiss={dismissUpdate}
                />
            )}
            {/* Mobile Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 md:hidden transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-md' : 'bg-white shadow-sm'
                }`}>
                <div className="flex items-center justify-between px-4 py-3">
                    <Link to="/student" className="flex items-center gap-2">
                        {logoUrl ? (
                            <img src={logoUrl} alt={siteName} className="w-8 h-8 rounded-lg object-contain" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center font-bold text-white">
                                {siteName.charAt(0)}
                            </div>
                        )}
                        <span className="font-bold text-[var(--primary)]">{siteName}</span>
                    </Link>

                    <NotificationBell />
                </div>
            </header>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-[var(--primary)] z-50">
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <Link to="/student" className="flex items-center gap-3">
                        {logoUrl ? (
                            <img src={logoUrl} alt={siteName} className="w-10 h-10 rounded-xl object-contain bg-white/20 p-1 shadow-lg" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg text-white shadow-lg">
                                {siteName.charAt(0)}
                            </div>
                        )}
                        <div>
                            <span className="font-bold text-lg text-white block">{siteName}</span>
                            <span className="text-xs text-white/70">Student Portal</span>
                        </div>
                    </Link>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-white">
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{user?.name}</p>
                            <p className="text-xs text-white/70">Roll: {user?.roll}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(item.path, item.exact)
                                ? 'bg-white/20 text-white shadow-lg'
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                            {isActive(item.path, item.exact) && (
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/10 space-y-2">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                        <Home className="w-5 h-5" />
                        <span>Back to Home</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar - Removed hamburger, so this is accessed differently or removed */}
            {sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[var(--primary)] z-50 md:hidden animate-slideIn">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                {logoUrl ? (
                                    <img src={logoUrl} alt={siteName} className="w-8 h-8 rounded-lg object-contain bg-white/20 p-0.5" />
                                ) : (
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white">
                                        {siteName.charAt(0)}
                                    </div>
                                )}
                                <span className="font-bold text-white">{siteName}</span>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Mobile User Info */}
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-white text-lg">
                                    {user?.name?.charAt(0) || 'S'}
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{user?.name}</p>
                                    <p className="text-sm text-white/70">Roll: {user?.roll}</p>
                                    <p className="text-xs text-white/60">{user?.class}</p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Navigation */}
                        <nav className="p-4 space-y-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path, item.exact)
                                        ? 'bg-white/20 text-white'
                                        : 'text-white/70 hover:text-white hover:bg-white/10'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}

                            <div className="pt-4 mt-4 border-t border-white/10">
                                <Link
                                    to="/"
                                    className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white rounded-xl"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Home className="w-5 h-5" />
                                    <span>Back to Home</span>
                                </Link>
                                <button
                                    onClick={() => { setSidebarOpen(false); handleLogout(); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:text-red-200 rounded-xl"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </nav>
                    </aside>
                </>
            )}

            {/* Main Content - Added pb-24 for mobile bottom nav spacing */}
            <main className="md:ml-64 min-h-screen pt-16 md:pt-0 pb-24 md:pb-0">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 md:hidden z-40 safe-area-bottom">
                <div className="flex items-center justify-around px-1 py-1.5">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => handleNavTap(item.path)}
                            className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1.5 rounded-lg transition-all ${isActive(item.path, item.exact)
                                ? 'text-[var(--primary)]'
                                : 'text-gray-400'
                                }`}
                        >
                            <item.icon className="w-[18px] h-[18px] shrink-0" />
                            <span className="text-[10px] font-medium leading-tight truncate max-w-full px-0.5">{item.label.split(' ').pop()}</span>
                            {/* Unread badge for Notices */}
                            {item.path === '/student/notices' && unreadCount > 0 && (
                                <span className="absolute -top-0.5 right-1/4 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Custom Animations */}
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }

                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slideUp {
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    )
}

export default StudentLayoutModern
