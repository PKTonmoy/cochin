import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import {
    LayoutDashboard,
    Users,
    CreditCard,
    FileText,
    Upload,
    LogOut,
    Menu,
    X,
    ChevronDown,
    ClipboardList,
    Database,
    Calendar,
    BookOpen,
    Layout
} from 'lucide-react'
import NotificationBell from '../components/NotificationBell'

const AdminLayout = () => {
    const { user, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

    const menuItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { path: '/admin/students', icon: Users, label: 'Students' },
        { path: '/admin/classes', icon: BookOpen, label: 'Classes' },
        { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
        { path: '/admin/receipts', icon: FileText, label: 'Receipts' },
        { path: '/admin/tests', icon: ClipboardList, label: 'Tests' },
        { path: '/admin/results', icon: FileText, label: 'Results' },
        { path: '/admin/attendance', icon: Calendar, label: 'Attendance' },
        { path: '/admin/upload', icon: Upload, label: 'Upload Results' },
        { path: '/admin/batches', icon: Database, label: 'Upload History' },
        { path: '/admin/cms', icon: Layout, label: 'Content Management' },
    ]

    const isActive = (path, exact) => {
        if (exact) return location.pathname === path
        return location.pathname.startsWith(path)
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <Link to="/admin" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
                            P
                        </div>
                        <span className="font-bold text-xl">PARAGON</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="py-4">
                    {menuItems.map((item) => {
                        if (item.adminOnly && user.role !== 'admin') return null

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`sidebar-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-left"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="md:ml-[260px]">
                {/* Header */}
                <header className="bg-white shadow-sm sticky top-0 z-30">
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Mobile menu button */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Page title */}
                        <h1 className="text-lg font-semibold text-gray-800 hidden md:block">
                            {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Dashboard'}
                        </h1>

                        {/* Right side */}
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <NotificationBell />

                            {/* Profile dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-medium text-sm">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium">
                                        {user?.name}
                                    </span>
                                    <ChevronDown size={16} />
                                </button>

                                {profileDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 animate-fadeIn">
                                        <div className="px-4 py-2 border-b">
                                            <p className="font-medium">{user?.name}</p>
                                            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
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

export default AdminLayout
