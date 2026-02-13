import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useState, useEffect, useRef } from 'react'
import {
    LayoutDashboard,
    FileText,
    User,
    LogOut,
    Menu,
    X,
    Home,
    Calendar,
    Bell,
    ChevronRight,
    Sparkles
} from 'lucide-react'
import NotificationBell from '../components/NotificationBell'

const StudentLayout = () => {
    const { user, logout } = useAuth()
    const { settings } = useSettings()
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const sidebarRef = useRef(null)

    const siteName = settings?.siteInfo?.name || 'PARAGON'

    const menuItems = [
        { path: '/student', icon: LayoutDashboard, label: 'Dashboard', exact: true, color: '#3b82f6' },
        { path: '/student/schedule', icon: Calendar, label: 'My Schedule', color: '#8b5cf6' },
        { path: '/student/results', icon: FileText, label: 'My Results', color: '#f97316' },
        { path: '/student/profile', icon: User, label: 'Profile', color: '#06b6d4' },
    ]

    const isActive = (path, exact) => {
        if (exact) return location.pathname === path
        return location.pathname.startsWith(path)
    }

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname])

    // Close sidebar on outside click (mobile)
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setSidebarOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [sidebarOpen])

    const currentPage = menuItems.find(item => isActive(item.path, item.exact))?.label || 'Student Portal'

    return (
        <div className="min-h-screen bg-[var(--bg-light)]">
            {/* ===== SIDEBAR ===== */}
            <aside
                ref={sidebarRef}
                className={`student-sidebar ${sidebarOpen ? 'open' : ''}`}
            >
                {/* Brand */}
                <div className="p-5 pb-4">
                    <Link to="/student" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg group-hover:shadow-blue-200 transition-all duration-300">
                            {siteName.charAt(0)}
                        </div>
                        <div>
                            <span className="font-bold text-lg text-[var(--text-dark)] block leading-tight">{siteName}</span>
                            <span className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider uppercase">Student Portal</span>
                        </div>
                    </Link>
                </div>

                {/* Student Profile Card */}
                <div className="mx-4 mb-5">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] p-4 text-white shadow-lg shadow-blue-200/50">
                        {/* Decorative circles */}
                        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

                        <div className="relative flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xl ring-2 ring-white/30">
                                {user?.name?.charAt(0) || 'S'}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{user?.name}</p>
                                <p className="text-[11px] text-white/70 mt-0.5">Roll: {user?.roll}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-medium backdrop-blur-sm">
                                        Class {user?.class}
                                    </span>
                                    {user?.section && (
                                        <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-medium backdrop-blur-sm">
                                            Sec {user.section}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="px-3 flex-1">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-2">Menu</p>
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const active = isActive(item.path, item.exact)
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`student-nav-link ${active ? 'active' : ''}`}
                                >
                                    <div
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${active
                                            ? 'bg-[var(--primary)] text-white shadow-md shadow-blue-200'
                                            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                                            }`}
                                    >
                                        <item.icon size={18} />
                                    </div>
                                    <span className="flex-1 font-medium text-[13px]">{item.label}</span>
                                    {active && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>

                    <div className="my-4 mx-3 border-t border-gray-100" />

                    <Link
                        to="/"
                        className="student-nav-link"
                    >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 text-gray-500">
                            <Home size={18} />
                        </div>
                        <span className="flex-1 font-medium text-[13px]">Back to Home</span>
                        <ChevronRight size={14} className="text-gray-400" />
                    </Link>
                </nav>

                {/* Logout */}
                <div className="p-4 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200 group"
                    >
                        <LogOut size={18} className="group-hover:rotate-[-12deg] transition-transform duration-200" />
                        <span className="font-medium text-[13px]">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ===== MAIN CONTENT ===== */}
            <div className="md:ml-[260px]">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
                    <div className="flex items-center justify-between px-4 md:px-6 py-3">
                        {/* Left: Menu + Title */}
                        <div className="flex items-center gap-3">
                            <button
                                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-[var(--text-dark)]">
                                    {currentPage}
                                </h1>
                                <p className="text-xs text-[var(--text-muted)] hidden md:block">
                                    Welcome back, {user?.name?.split(' ')[0]}
                                </p>
                            </div>
                        </div>

                        {/* Right: Notification + Avatar */}
                        <div className="flex items-center gap-2">
                            <NotificationBell />
                            <Link
                                to="/student/profile"
                                className="flex items-center gap-2 pl-2 md:pl-3 pr-1 py-1 rounded-full hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex flex-col items-end mr-1">
                                    <span className="text-xs md:text-sm font-medium text-[var(--text-primary)] max-w-[80px] md:max-w-none truncate leading-tight">
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                    {user?.name?.charAt(0) || 'S'}
                                </div>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default StudentLayout
