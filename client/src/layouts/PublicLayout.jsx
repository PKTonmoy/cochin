import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { Phone, GraduationCap, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'

const PublicLayout = () => {
    const { isAuthenticated, user } = useAuth()
    const { getSiteName, getTagline, getLogo, getPrimaryPhone } = useSettings()
    const [scrolled, setScrolled] = useState(false)
    const location = useLocation()
    const isHomePage = location.pathname === '/'

    const siteName = getSiteName()
    const tagline = getTagline()
    const logoUrl = getLogo()
    const phone = getPrimaryPhone()

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* ===== LIGHT GLASS HEADER (Desktop Only) ===== */}
            <header className={`hidden lg:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-4'
                }`}>
                {/* Glass background */}
                <div className={`absolute inset-0 transition-all duration-500 ${scrolled
                    ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm'
                    : 'bg-transparent'
                    }`} />

                {/* Gradient line */}
                <div className={`absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent transition-opacity ${scrolled ? 'opacity-100' : 'opacity-0'
                    }`} />

                <div className="relative max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="relative">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt={siteName}
                                        className="w-12 h-12 rounded-xl object-contain shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                                        <GraduationCap size={28} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className="font-bold text-xl tracking-tight gradient-text">
                                    {siteName}
                                </span>
                                <span className="block text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                                    {tagline || 'Excellence in Education'}
                                </span>
                            </div>
                        </Link>

                        {/* Navigation */}
                        <nav className={`flex items-center gap-1 rounded-full p-1.5 transition-all ${scrolled
                            ? 'bg-gray-100 border border-gray-200'
                            : 'bg-white/80 backdrop-blur-sm border border-gray-200'
                            }`}>
                            <Link to="/" className="nav-link-cyber">Home</Link>
                            <Link to="/programs" className="nav-link-cyber font-bangla">প্রোগ্রাম</Link>
                            <Link to="/stories" className="nav-link-cyber font-bangla">সাফল্য</Link>
                            <a href="#contact" className="nav-link-cyber font-bangla">যোগাযোগ</a>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <a
                                href={`tel:${phone}`}
                                className="flex items-center gap-3 bg-white rounded-full px-4 py-2 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center shadow-sm">
                                    <Phone size={16} className="text-white" />
                                </div>
                                <div className="hidden xl:block">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Helpline</p>
                                    <p className="font-bold text-sm text-gray-900">{phone}</p>
                                </div>
                            </a>

                            {isAuthenticated ? (
                                <Link
                                    to={user.role === 'student' ? '/student' : '/admin'}
                                    className="btn-cyber py-2.5"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link to="/student-login" className="btn-cyber py-2.5">
                                    <Sparkles size={16} />
                                    Student Portal
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Minimal Footer for non-landing pages */}
            {!isHomePage && (
                <footer className="footer-cyber">
                    <div className="container-cyber">
                        <div className="border-t border-gray-200 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
                                {logoUrl ? (
                                    <img src={logoUrl} alt={siteName} className="w-6 h-6 object-contain" />
                                ) : (
                                    <GraduationCap size={24} className="text-blue-500" />
                                )}
                                <span className="font-bold gradient-text">{siteName}</span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                © {new Date().getFullYear()} {siteName}. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    )
}

export default PublicLayout
