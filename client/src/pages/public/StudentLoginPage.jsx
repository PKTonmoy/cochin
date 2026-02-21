import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Lock, User, ArrowRight, GraduationCap, BookOpen, Trophy, CheckCircle } from 'lucide-react'
import LoginSkeleton from '../../components/skeletons/LoginSkeleton'

// ... imports
import { useSettings } from '../../contexts/SettingsContext' // Import useSettings

const StudentLoginPage = () => {
    const navigate = useNavigate()
    const { studentLogin } = useAuth()
    const { getLogo, getSiteName, isLoading } = useSettings() // Get settings
    const [formData, setFormData] = useState({ roll: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [rememberRoll, setRememberRoll] = useState(false)
    const [searchParams] = useSearchParams()

    // Load roll number on mount: URL param > sessionStorage > localStorage
    useEffect(() => {
        const urlRoll = searchParams.get('roll')
        const sessionRoll = sessionStorage.getItem('qr_roll')
        const savedRoll = localStorage.getItem('remembered_roll')

        const rollToUse = urlRoll || sessionRoll || savedRoll
        if (rollToUse) {
            setFormData(prev => ({ ...prev, roll: rollToUse }))
            if (savedRoll) setRememberRoll(true)
        }

        // Clear sessionStorage after reading (one-time use from QR)
        if (sessionRoll) sessionStorage.removeItem('qr_roll')
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    if (isLoading) {
        return <LoginSkeleton />
    }

    const logoUrl = getLogo()
    const siteName = getSiteName()

    const handleSubmit = async (e) => {
        // ... (existing submit logic)
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await studentLogin(formData.roll, formData.password)

        setLoading(false)

        if (result.success) {
            // Save or clear remembered roll number
            if (rememberRoll) {
                localStorage.setItem('remembered_roll', formData.roll)
            } else {
                localStorage.removeItem('remembered_roll')
            }
            // Trigger PWA install prompt after successful login
            window.dispatchEvent(new Event('pwa-show-install'))
            navigate('/student')
        } else {
            setError(result.error)
        }
    }

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left side - Clean illustration area */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2E86AB] to-[#1a5276] relative overflow-hidden items-center justify-center p-12">
                {/* ... (background patterns) */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />

                {/* Soft glow effects */}
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-[#F5A623]/10 rounded-full blur-[80px]" />

                {/* Content */}
                <div className="relative z-10 text-center text-white max-w-md">
                    {/* Logo */}
                    <div className="mb-10">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white flex items-center justify-center shadow-xl p-2">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={siteName}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <span className="text-3xl font-bold text-[#2E86AB]">
                                    {siteName.charAt(0)}
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold mb-3">Student Portal</h2>
                        <p className="text-white/70 text-lg">
                            Access your academic dashboard and track your progress
                        </p>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-4 text-left">
                        {[
                            'View class schedules',
                            'Check exam results',
                            'Track your progress',
                            'Access study materials'
                        ].map((text, index) => (
                            <div key={index} className="flex items-center gap-3 text-white/90">
                                <div className="w-6 h-6 rounded-full bg-[#F5A623] flex items-center justify-center flex-shrink-0">
                                    <CheckCircle size={14} />
                                </div>
                                <span>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile header */}
                    <div className="lg:hidden text-center mb-8">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={siteName}
                                className="h-16 mx-auto mb-4 object-contain"
                            />
                        ) : (
                            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#2E86AB] flex items-center justify-center text-white font-bold text-2xl">
                                {siteName.charAt(0)}
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-[#1e3a5f]">Student Login</h1>
                    </div>

                    {/* Desktop header */}
                    <div className="hidden lg:block mb-8">
                        <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">Welcome Back!</h1>
                        <p className="text-gray-500">Enter your roll number to continue</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Roll Number
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    name="roll_no_autofill"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-[#2E86AB] focus:bg-white focus:outline-none transition-all uppercase font-mono"
                                    placeholder=""
                                    value={formData.roll}
                                    onChange={(e) => setFormData({ ...formData, roll: e.target.value.toUpperCase() })}
                                    required
                                    autoComplete="off"
                                    data-lpignore="true"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password_no_autofill"
                                    className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-[#2E86AB] focus:bg-white focus:outline-none transition-all"
                                    placeholder=""
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    autoComplete="new-password"
                                    data-lpignore="true"
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Your initial password is your registered phone number
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl font-semibold text-white bg-[#2E86AB] hover:bg-[#1a5276] shadow-lg shadow-[#2E86AB]/25 hover:shadow-xl hover:shadow-[#2E86AB]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                        {/* Remember Roll Number */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="rememberRoll"
                                checked={rememberRoll}
                                onChange={(e) => setRememberRoll(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-[#2E86AB] focus:ring-[#2E86AB] cursor-pointer"
                            />
                            <label htmlFor="rememberRoll" className="text-sm text-gray-600 cursor-pointer select-none">
                                Remember my Roll Number
                            </label>
                        </div>

                    </form>



                    {/* Footer links */}
                    <div className="mt-8 text-center text-sm text-gray-500">
                        <p>
                            Forgot your password?{' '}
                            <a href="#" className="text-[#2E86AB] font-medium hover:underline">
                                Contact support
                            </a>
                        </p>
                        <p className="mt-2">
                            <Link to="/" className="text-[#2E86AB] font-medium hover:underline">
                                ← Back to Homepage
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentLoginPage
