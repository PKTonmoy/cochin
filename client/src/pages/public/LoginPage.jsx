import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Shield, CheckCircle } from 'lucide-react'
import LoginSkeleton from '../../components/skeletons/LoginSkeleton'

// ... imports
import { useSettings } from '../../contexts/SettingsContext' // Import useSettings

const LoginPage = () => {
    const navigate = useNavigate()
    const { login } = useAuth()
    const { getLogo, getSiteName, isLoading } = useSettings() // Get settings
    const savedRemember = localStorage.getItem('rememberMe') === 'true'
    const savedEmail = savedRemember ? localStorage.getItem('savedEmail') || '' : ''
    const [formData, setFormData] = useState({ email: savedEmail, password: '' })
    const [rememberMe, setRememberMe] = useState(savedRemember)
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

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

        const result = await login(formData.email, formData.password, rememberMe)

        setLoading(false)

        if (result.success) {
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true')
                localStorage.setItem('savedEmail', formData.email)
            } else {
                localStorage.removeItem('rememberMe')
                localStorage.removeItem('savedEmail')
            }
            navigate('/admin')
        } else {
            setError(result.error)
        }
    }

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left side - Clean illustration area */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1e3a5f] to-[#0d2137] relative overflow-hidden items-center justify-center p-12">
                {/* ... (background patterns) */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />

                {/* Soft glow effects */}
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#2E86AB]/20 rounded-full blur-[100px]" />
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
                        <h2 className="text-3xl font-bold mb-3">Admin Dashboard</h2>
                        <p className="text-white/70 text-lg">
                            Manage your coaching center with powerful tools
                        </p>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-4 text-left">
                        {[
                            'Manage students & enrollments',
                            'Track exam results & analytics',
                            'Handle payments & receipts',
                            'Control site content'
                        ].map((text, index) => (
                            <div key={index} className="flex items-center gap-3 text-white/90">
                                <div className="w-6 h-6 rounded-full bg-[#2E86AB] flex items-center justify-center flex-shrink-0">
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
                            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-2xl">
                                {siteName.charAt(0)}
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-[#1e3a5f]">Admin Login</h1>
                    </div>

                    {/* Desktop header */}
                    <div className="hidden lg:block mb-8">
                        <h1 className="text-3xl font-bold text-[#1e3a5f] mb-2">Welcome Back!</h1>
                        <p className="text-gray-500">Sign in to access the admin dashboard</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-[#2E86AB] focus:bg-white focus:outline-none transition-all"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
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
                                    className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-[#2E86AB] focus:bg-white focus:outline-none transition-all"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-[#2E86AB] focus:ring-[#2E86AB]"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="text-sm text-gray-600">Remember me</span>
                            </label>

                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl font-semibold text-white bg-[#1e3a5f] hover:bg-[#0d2137] shadow-lg shadow-[#1e3a5f]/25 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">or</span>
                        </div>
                    </div>

                    {/* Student login link */}
                    <Link
                        to="/student-login"
                        className="w-full py-4 rounded-xl font-semibold text-[#2E86AB] border-2 border-gray-200 hover:border-[#2E86AB] hover:bg-[#2E86AB]/5 transition-all flex items-center justify-center gap-2"
                    >
                        Student Login
                        <ArrowRight size={18} />
                    </Link>

                    {/* Footer links */}
                    <div className="mt-8 text-center text-sm text-gray-500">
                        <Link to="/" className="text-[#2E86AB] font-medium hover:underline">
                            ← Back to Homepage
                        </Link>
                    </div>


                </div>
            </div>
        </div>
    )
}

export default LoginPage
