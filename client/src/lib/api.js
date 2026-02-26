import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor to add auth token and handle FormData
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // Remove Content-Type for FormData - let axios set it with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type']
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Do not attempt token refresh for login requests
        const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/student-login')
        if (error.response?.status === 401 && isAuthRequest) {
            return Promise.reject(error)
        }

        // If token expired and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')
                if (!refreshToken) {
                    throw new Error('No refresh token')
                }

                const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                    refreshToken
                })

                const { accessToken, refreshToken: newRefreshToken } = response.data.data

                // Update tokens in the storage that was used
                if (localStorage.getItem('refreshToken')) {
                    localStorage.setItem('accessToken', accessToken)
                    localStorage.setItem('refreshToken', newRefreshToken)
                } else {
                    sessionStorage.setItem('accessToken', accessToken)
                    sessionStorage.setItem('refreshToken', newRefreshToken)
                }

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                sessionStorage.removeItem('accessToken')
                sessionStorage.removeItem('refreshToken')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api

// API helper functions
export const apiGet = (url, config) => api.get(url, config)
export const apiPost = (url, data, config) => api.post(url, data, config)
export const apiPut = (url, data, config) => api.put(url, data, config)
export const apiDelete = (url, config) => api.delete(url, config)

// Multipart form data helper
export const apiUpload = (url, formData, onProgress) => {
    return api.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
            if (onProgress) {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                )
                onProgress(percentCompleted)
            }
        }
    })
}
