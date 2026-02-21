/**
 * Student Profile Page
 * Premium centered layout with avatar, action buttons, and section cards
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
    User,
    Phone,
    Mail,
    MapPin,
    School,
    Lock,
    Eye,
    EyeOff,
    LayoutDashboard,
    LogOut,
    Shield,
    Users,
    Calendar,
    CreditCard,
    ChevronRight
} from 'lucide-react'
import ProfileSkeleton from '../../components/skeletons/ProfileSkeleton'

const StudentProfile = () => {
    const navigate = useNavigate()
    const { user, logout, changePassword, isLoading } = useAuth()
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })

    const handlePasswordChange = async (e) => {
        e.preventDefault()

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        const result = await changePassword(passwordData.currentPassword, passwordData.newPassword)
        if (result.success) {
            setShowChangePassword(false)
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        }
    }

    const handleLogout = async () => {
        await logout()
        navigate('/student-login')
    }

    if (isLoading) {
        return <ProfileSkeleton />
    }

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 animate-fadeIn">
            {/* Header - Centered */}
            <div className="text-center pt-2">
                <h1 className="text-2xl font-bold text-[var(--primary)]">Profile</h1>
            </div>

            {/* Avatar Section - Centered */}
            <div className="text-center">
                {/* Large Avatar with Ring */}
                <div className="inline-block relative mb-4">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-4xl font-bold ring-4 ring-[var(--primary)]/20 ring-offset-4 ring-offset-white shadow-xl">
                        {user?.name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    {/* Status Indicator */}
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                </div>

                {/* Name & Email */}
                <h2 className="text-2xl font-bold text-[var(--dark)]">{user?.name}</h2>
                <p className="text-gray-500 mt-1">
                    {user?.email || `Roll: ${user?.roll}`}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => navigate('/student')}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-[var(--dark)] transition-colors"
                >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-[var(--dark)] transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>

            {/* Student Information Section */}
            <div className="card overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Student Information
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    <ProfileInfoRow
                        icon={School}
                        label="Class"
                        value={`${user?.class}${user?.section ? ` - ${user.section}` : ''}`}
                    />
                    <ProfileInfoRow
                        icon={Users}
                        label="Group"
                        value={user?.group || 'N/A'}
                    />
                    <ProfileInfoRow
                        icon={Calendar}
                        label="Roll Number"
                        value={user?.roll}
                    />
                    <ProfileInfoRow
                        icon={Shield}
                        label="Status"
                        value={
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                Active Student
                            </span>
                        }
                        isComponent
                    />
                </div>
            </div>

            {/* Contact Details Section */}
            <div className="card overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Contact Details
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    <ProfileInfoRow
                        icon={Phone}
                        label="Phone"
                        value={user?.phone || 'Not provided'}
                        sublabel={user?.phone ? 'Primary Contact' : null}
                    />
                    <ProfileInfoRow
                        icon={Mail}
                        label="Email"
                        value={user?.email || 'Not provided'}
                    />
                    {user?.address && (
                        <ProfileInfoRow
                            icon={MapPin}
                            label="Address"
                            value={user.address}
                        />
                    )}
                </div>
            </div>

        </div>
    )
}

// Profile Info Row Component
function ProfileInfoRow({ icon: Icon, label, value, sublabel, isComponent = false }) {
    return (
        <div className="flex items-center gap-4 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div className="flex-1 min-w-0">
                {isComponent ? (
                    <>
                        <p className="text-sm text-gray-500">{label}</p>
                        <div className="mt-0.5">{value}</div>
                    </>
                ) : (
                    <>
                        <p className="font-medium text-[var(--dark)] truncate">{value}</p>
                        <p className="text-sm text-gray-500">{sublabel || label}</p>
                    </>
                )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
        </div>
    )
}

export default StudentProfile
