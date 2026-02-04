import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, Trophy, MessageCircle, User } from 'lucide-react'

const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'programs', icon: BookOpen, label: 'Programs', path: '/programs' },
    { id: 'results', icon: Trophy, label: 'Results', path: '/stories' },
    { id: 'contact', icon: MessageCircle, label: 'Contact', path: '/#contact' },
    { id: 'login', icon: User, label: 'Login', path: '/student-login' },
]

export default function FloatingNav() {
    const [activeId, setActiveId] = useState('home')
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        const path = location.pathname + location.hash
        const item = navItems.find(item =>
            item.path === path ||
            (item.path === '/' && location.pathname === '/') ||
            (item.path.includes('#') && path.includes(item.path.split('#')[1]))
        )
        if (item) setActiveId(item.id)
    }, [location])

    const handleNavClick = (item) => {
        setActiveId(item.id)

        if (item.path.includes('#')) {
            const [pathname, hash] = item.path.split('#')
            if (location.pathname === pathname || pathname === '/') {
                const element = document.getElementById(hash)
                if (element) element.scrollIntoView({ behavior: 'smooth' })
            } else {
                navigate(item.path)
            }
        } else {
            navigate(item.path)
        }

        if (navigator.vibrate) navigator.vibrate(10)
    }

    return (
        <nav className="floating-nav lg:hidden">
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeId === item.id

                return (
                    <button
                        key={item.id}
                        onClick={() => handleNavClick(item)}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        aria-label={item.label}
                    >
                        <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                    </button>
                )
            })}
        </nav>
    )
}

