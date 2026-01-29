import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Phone, Mail, Facebook, Youtube, Instagram, Linkedin, MapPin, Home, BookOpen, Star, PhoneCall, User, Menu, X, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '../lib/api'

const PublicLayout = () => {
    const { isAuthenticated, user } = useAuth()
    const [headerContent, setHeaderContent] = useState({})
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const location = useLocation()

    useEffect(() => {
        const fetchHeader = async () => {
            try {
                const response = await api.get('/site-content/header')
                setHeaderContent(response.data.data?.content || {})
            } catch (error) {
                console.error('Failed to fetch header:', error)
            }
        }
        fetchHeader()
    }, [])

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Check if current path matches for mobile nav highlighting
    const isActive = (path) => {
        if (path === '/') return location.pathname === '/'
        return location.pathname.startsWith(path)
    }

    // Mobile floating nav items
    const mobileNavItems = [
        { path: '/', icon: Home, label: 'Home', isHash: false },
        { path: '#programs', icon: BookOpen, label: 'প্রোগ্রাম', isHash: true },
        { path: '#features', icon: Star, label: 'বৈশিষ্ট্য', isHash: true },
        { path: '#contact', icon: PhoneCall, label: 'যোগাযোগ', isHash: true },
        { path: isAuthenticated ? (user?.role === 'student' ? '/student' : '/admin') : '/student-login', icon: User, label: 'Portal', isHash: false, isCta: true },
    ]

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* ===== FUTURISTIC DESKTOP HEADER ===== */}
            <header className={`hidden lg:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? 'py-2'
                : 'py-4'}`}>

                {/* Glassmorphism background */}
                <div className={`absolute inset-0 transition-all duration-500 ${scrolled
                    ? 'bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-100'
                    : 'bg-gradient-to-r from-[var(--primary-dark)]/95 via-[var(--primary)]/90 to-[var(--primary-dark)]/95 backdrop-blur-md'}`}
                />

                {/* Animated gradient line */}
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--secondary)] to-transparent transition-opacity duration-300 ${scrolled ? 'opacity-60' : 'opacity-0'}`} />

                <div className="relative w-full px-4 lg:px-8 mx-auto" style={{ maxWidth: '1400px' }}>
                    <div className="flex items-center justify-between">

                        {/* Logo Section */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="relative flex-shrink-0">
                                <div className={`absolute -inset-2 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${scrolled ? 'bg-[var(--primary)]/20' : 'bg-white/20'}`} />
                                <img
                                    src={headerContent.logo || "/assets/logo.png"}
                                    alt="Paragon Logo"
                                    className="relative h-12 lg:h-14 w-auto object-contain rounded-xl shadow-lg border border-white/20 bg-white p-1"
                                    onError={(e) => {
                                        e.target.onerror = null
                                        if (headerContent.logo && e.target.src !== window.location.origin + "/assets/logo.png") {
                                            e.target.src = "/assets/logo.png"
                                        } else {
                                            e.target.style.display = 'none'
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-extrabold text-xl lg:text-2xl tracking-tight leading-none transition-colors ${scrolled ? 'text-[var(--dark)]' : 'text-white'}`}>
                                    {headerContent.name || 'PARAGON'}
                                </span>
                                <span className={`text-[10px] lg:text-xs font-semibold tracking-widest uppercase mt-0.5 ${scrolled ? 'text-[var(--primary)]' : 'text-[var(--secondary)]'}`}>
                                    Excellence in Education
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className={`flex items-center gap-1 rounded-full p-1.5 transition-all duration-300 ${scrolled
                            ? 'bg-gray-100/80 border border-gray-200'
                            : 'bg-white/10 backdrop-blur-sm border border-white/20'}`}>
                            <Link to="/" className={`nav-link-futuristic ${scrolled ? 'text-[var(--dark)] hover:bg-[var(--primary)] hover:text-white' : 'text-white hover:bg-white/20'}`}>
                                Home
                            </Link>
                            <a href="#programs" className={`nav-link-futuristic font-bangla ${scrolled ? 'text-[var(--dark)] hover:bg-[var(--primary)] hover:text-white' : 'text-white hover:bg-white/20'}`}>
                                প্রোগ্রাম
                            </a>
                            <a href="#features" className={`nav-link-futuristic font-bangla ${scrolled ? 'text-[var(--dark)] hover:bg-[var(--primary)] hover:text-white' : 'text-white hover:bg-white/20'}`}>
                                বৈশিষ্ট্য
                            </a>
                            <a href="#contact" className={`nav-link-futuristic font-bangla ${scrolled ? 'text-[var(--dark)] hover:bg-[var(--primary)] hover:text-white' : 'text-white hover:bg-white/20'}`}>
                                যোগাযোগ
                            </a>
                            <Link to="/stories" className={`nav-link-futuristic font-bangla ${scrolled ? 'text-[var(--dark)] hover:bg-[var(--primary)] hover:text-white' : 'text-white hover:bg-white/20'}`}>
                                সাফল্য
                            </Link>
                        </nav>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3">
                            {/* Phone CTA */}
                            <a
                                href={`tel:${headerContent.phone || '09666775566'}`}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 ${scrolled
                                    ? 'bg-white border border-gray-200 text-[var(--dark)] hover:border-[var(--primary)] hover:shadow-lg'
                                    : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20'}`}
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${scrolled ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-white' : 'bg-white/20 text-white'}`}>
                                    <Phone size={16} />
                                </div>
                                <div className="hidden xl:block">
                                    <p className={`text-[10px] font-medium uppercase tracking-wider ${scrolled ? 'text-gray-400' : 'text-white/60'}`}>Helpline</p>
                                    <p className="font-bold text-sm">{headerContent.phone || '+880 1XXX-XXXXXX'}</p>
                                </div>
                            </a>

                            {/* Auth Button */}
                            {isAuthenticated ? (
                                <Link
                                    to={user.role === 'student' ? '/student' : '/admin'}
                                    className="px-6 py-2.5 rounded-full font-semibold text-white bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] hover:shadow-lg hover:shadow-[var(--primary)]/30 hover:scale-[1.02] transition-all"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    to="/student-login"
                                    className="group relative px-6 py-2.5 rounded-full font-semibold text-white overflow-hidden"
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-[var(--secondary)] to-[var(--accent)]" />
                                    <span className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="relative flex items-center gap-2">
                                        <Sparkles size={16} />
                                        Student Portal
                                    </span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content - No spacer needed, hero section handles it */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* ===== FUTURISTIC MOBILE FLOATING NAVBAR ===== */}
            <nav className="mobile-nav-futuristic">
                <div className="mobile-nav-glow" />
                <div className="mobile-nav-container">
                    {mobileNavItems.map((item, index) => {
                        const Icon = item.icon
                        const isCurrentActive = !item.isHash && isActive(item.path)

                        if (item.isHash) {
                            return (
                                <a
                                    key={index}
                                    href={item.path}
                                    className="mobile-nav-item font-bangla"
                                >
                                    <Icon strokeWidth={2} size={20} />
                                    <span>{item.label}</span>
                                </a>
                            )
                        }

                        return (
                            <Link
                                key={index}
                                to={item.path}
                                className={`mobile-nav-item ${isCurrentActive ? 'active' : ''} ${item.isCta ? 'cta' : ''}`}
                            >
                                <Icon strokeWidth={2} size={20} />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Footer */}
            <footer className="bg-[var(--dark)] text-white pt-16 pb-28 lg:pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
                        {/* Column 1 - Logo & About */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-3 mb-4">
                                <img
                                    src={headerContent.logo || "/assets/logo.png"}
                                    alt="Paragon Logo"
                                    className="h-14 w-auto rounded-xl bg-white p-1.5 shadow-lg border border-gray-200 object-contain"
                                    onError={(e) => {
                                        e.target.onerror = null
                                        if (headerContent.logo && e.target.src !== window.location.origin + "/assets/logo.png") {
                                            e.target.src = "/assets/logo.png"
                                        } else {
                                            e.target.style.display = 'none'
                                        }
                                    }}
                                />
                                <div>
                                    <span className="font-bold text-2xl tracking-tight block leading-none mb-1">{headerContent.name || 'PARAGON'}</span>
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Coaching Center</span>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                {headerContent.footerDescription || 'An eminent center for admission preparation. Helping students achieve their dreams since 2010.'}
                            </p>
                            <div className="flex gap-3">
                                {[
                                    { icon: Facebook, link: headerContent.socialLinks?.facebook || '#' },
                                    { icon: Youtube, link: headerContent.socialLinks?.youtube || '#' },
                                    { icon: Instagram, link: headerContent.socialLinks?.instagram || '#' },
                                    { icon: Linkedin, link: headerContent.socialLinks?.linkedin || '#' }
                                ].map(({ icon: Icon, link }, index) => (
                                    <a
                                        key={index}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[var(--primary)] transition-all"
                                    >
                                        <Icon size={18} />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Column 2 - Quick Links */}
                        <div>
                            <h4 className="font-bold text-lg mb-6 text-white">Quick Links</h4>
                            <ul className="space-y-3">
                                {[
                                    { label: 'About Us', href: '#about' },
                                    { label: 'Our Programs', href: '#programs' },
                                    { label: 'Success Stories', href: '/stories' },
                                    { label: 'Contact Us', href: '#contact' }
                                ].map((item, index) => (
                                    <li key={index}>
                                        {item.href.startsWith('/') ? (
                                            <Link to={item.href} className="text-gray-400 hover:text-[var(--secondary)] transition-colors text-sm">
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <a href={item.href} className="text-gray-400 hover:text-[var(--secondary)] transition-colors text-sm">
                                                {item.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 3 - Programs */}
                        <div>
                            <h4 className="font-bold text-lg mb-6 text-white">Programs</h4>
                            <ul className="space-y-3">
                                {[
                                    { label: 'Medical Admission', href: '#programs' },
                                    { label: 'Engineering Admission', href: '#programs' },
                                    { label: 'University Admission', href: '#programs' },
                                    { label: 'HSC Program', href: '#programs' }
                                ].map((item, index) => (
                                    <li key={index}>
                                        <a href={item.href} className="text-gray-400 hover:text-[var(--secondary)] transition-colors text-sm">
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 4 - Contact */}
                        <div>
                            <h4 className="font-bold text-lg mb-6 text-white">Contact</h4>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <MapPin size={18} className="text-[var(--secondary)] shrink-0 mt-1" />
                                    <span className="text-gray-400 text-sm font-bangla">
                                        {headerContent.address || '78, Green Road (3rd Floor), Farmgate, Dhaka-1205'}
                                    </span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone size={18} className="text-[var(--secondary)] shrink-0" />
                                    <a href={`tel:${headerContent.phone || '09666775566'}`} className="text-gray-400 hover:text-white transition-colors text-sm font-semibold">
                                        {headerContent.phone || '09666775566'}
                                    </a>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail size={18} className="text-[var(--secondary)] shrink-0" />
                                    <a href={`mailto:${headerContent.email || 'info@paragon.com'}`} className="text-gray-400 hover:text-white transition-colors text-sm">
                                        {headerContent.email || 'info@paragon.com'}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} {headerContent.name || 'PARAGON Coaching Center'}. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <a href="/privacy" className="hover:text-[var(--secondary)] transition-colors">Privacy</a>
                            <a href="/terms" className="hover:text-[var(--secondary)] transition-colors">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default PublicLayout
