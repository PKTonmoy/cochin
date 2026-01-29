import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load user from token on mount
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('accessToken')
            if (!token) {
                setIsLoading(false)
                return
            }

            try {
                const response = await api.get('/auth/me')
                setUser(response.data.data)
            } catch (error) {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
            } finally {
                setIsLoading(false)
            }
        }

        loadUser()
    }, [])

    // Admin/Staff login
    const login = useCallback(async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password })
            const { user: userData, accessToken, refreshToken } = response.data.data

            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)
            setUser(userData)

            toast.success(`Welcome back, ${userData.name}!`)
            return { success: true, user: userData }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed'
            toast.error(message)
            return { success: false, error: message }
        }
    }, [])

    // Student login
    const studentLogin = useCallback(async (roll, password) => {
        try {
            const response = await api.post('/auth/student-login', { roll, password })
            const { student, accessToken, refreshToken } = response.data.data

            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)
            setUser({ ...student, role: 'student' })

            toast.success(`Welcome, ${student.name}!`)
            return { success: true, user: student }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed'
            toast.error(message)
            return { success: false, error: message }
        }
    }, [])

    // Logout
    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout')
        } catch (error) {
            // Ignore logout errors
        } finally {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            setUser(null)
            toast.success('Logged out successfully')
        }
    }, [])

    // Change password
    const changePassword = useCallback(async (currentPassword, newPassword) => {
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword })
            toast.success('Password changed successfully')

            // Update user to remove mustChangePassword flag
            setUser(prev => ({ ...prev, mustChangePassword: false }))

            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Password change failed'
            toast.error(message)
            return { success: false, error: message }
        }
    }, [])

    // Refresh token
    const refreshToken = useCallback(async () => {
        try {
            const token = localStorage.getItem('refreshToken')
            if (!token) throw new Error('No refresh token')

            const response = await api.post('/auth/refresh-token', { refreshToken: token })
            const { accessToken, refreshToken: newRefreshToken } = response.data.data

            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', newRefreshToken)

            return accessToken
        } catch (error) {
            logout()
            throw error
        }
    }, [logout])

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff',
        isStudent: user?.role === 'student',
        login,
        studentLogin,
        logout,
        changePassword,
        refreshToken
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
