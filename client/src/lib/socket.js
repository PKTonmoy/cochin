/**
 * Socket.io Client
 * Real-time communication with the server
 */

import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.PROD ? '/' : (import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:5000`)

let socket = null
let connectionAttempts = 0
const MAX_ATTEMPTS = 5

/**
 * Initialize socket connection
 */
export function initSocket(authData) {
    if (socket?.connected) {
        return socket
    }

    socket = io(SOCKET_URL, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: MAX_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
    })

    socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id)
        connectionAttempts = 0

        // Send authentication data
        if (authData) {
            socket.emit('authenticate', authData)
        }
    })

    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
        connectionAttempts++
        console.error('🔌 Socket connection error:', error.message)

        if (connectionAttempts >= MAX_ATTEMPTS) {
            console.error('🔌 Max connection attempts reached')
        }
    })

    socket.connect()

    return socket
}

/**
 * Get the socket instance
 */
export function getSocket() {
    return socket
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}

/**
 * Subscribe to notifications
 */
export function onNotification(callback) {
    if (!socket) return () => { }

    socket.on('notification', callback)

    return () => {
        socket.off('notification', callback)
    }
}

/**
 * Subscribe to schedule updates
 */
export function onScheduleUpdate(callback) {
    if (!socket) return () => { }

    socket.on('schedule-update', callback)

    return () => {
        socket.off('schedule-update', callback)
    }
}

/**
 * Join a specific room
 */
export function joinRoom(room) {
    if (socket?.connected) {
        socket.emit('join-room', room)
    }
}

/**
 * Leave a room
 */
export function leaveRoom(room) {
    if (socket?.connected) {
        socket.emit('leave-room', room)
    }
}

/**
 * Check if socket is connected
 */
export function isConnected() {
    return socket?.connected || false
}

export default {
    initSocket,
    getSocket,
    disconnectSocket,
    onNotification,
    onScheduleUpdate,
    joinRoom,
    leaveRoom,
    isConnected
}
