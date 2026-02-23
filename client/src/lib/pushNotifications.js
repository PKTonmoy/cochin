/**
 * Push Notifications Utility
 * Client-side Web Push subscription management
 * Handles permission requests, subscription creation, and backend sync
 */

import api from './api'

const VAPID_KEY_CACHE_KEY = 'vapid_public_key'

/**
 * Check if push notifications are supported in this browser
 */
export function isPushSupported() {
    return 'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
}

/**
 * Get the current notification permission status
 * @returns {'granted' | 'denied' | 'default'}
 */
export function getPermissionStatus() {
    if (!('Notification' in window)) return 'denied'
    return Notification.permission
}

/**
 * Check if push notifications are currently subscribed
 */
export async function isPushSubscribed() {
    if (!isPushSupported()) return false

    try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        return !!subscription
    } catch {
        return false
    }
}

/**
 * Fetch VAPID public key from the server
 */
async function getVapidPublicKey() {
    // Check cache first
    const cached = sessionStorage.getItem(VAPID_KEY_CACHE_KEY)
    if (cached) return cached

    try {
        const response = await api.get('/notifications/vapid-public-key')
        const key = response.data?.data?.vapidPublicKey
        if (key) {
            sessionStorage.setItem(VAPID_KEY_CACHE_KEY, key)
        }
        return key
    } catch (error) {
        console.error('[Push] Failed to fetch VAPID key:', error)
        // Fallback to env variable
        return import.meta.env.VITE_VAPID_PUBLIC_KEY || null
    }
}

/**
 * Convert URL-safe base64 string to Uint8Array (for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

/**
 * Request push notification permission and subscribe
 * @returns {{ success: boolean, subscription?: object, error?: string }}
 */
export async function subscribeToPush() {
    if (!isPushSupported()) {
        return { success: false, error: 'Push notifications are not supported in this browser' }
    }

    try {
        // Request notification permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
            return { success: false, error: 'Notification permission denied' }
        }

        // Get VAPID public key
        const vapidPublicKey = await getVapidPublicKey()
        if (!vapidPublicKey) {
            return { success: false, error: 'VAPID key not available. Push notifications not configured.' }
        }

        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription()

        if (!subscription) {
            // Create new subscription
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            })
        }

        // Send subscription to backend
        await api.post('/notifications/push-subscription', {
            subscription: subscription.toJSON()
        })

        console.log('[Push] ✅ Push subscription saved')
        return { success: true, subscription }
    } catch (error) {
        console.error('[Push] ❌ Subscription error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
    if (!isPushSupported()) return { success: false }

    try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
            // Notify backend
            await api.delete('/notifications/push-subscription', {
                data: { endpoint: subscription.endpoint }
            })

            // Unsubscribe from push manager
            await subscription.unsubscribe()
        }

        return { success: true }
    } catch (error) {
        console.error('[Push] Unsubscribe error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Request permission and subscribe — call this after student login
 * Silent: won't show errors to user, just logs
 */
export async function initPushNotifications() {
    if (!isPushSupported()) {
        console.log('[Push] Push not supported in this browser')
        return
    }

    // Don't prompt if already denied
    if (Notification.permission === 'denied') {
        console.log('[Push] Notification permission already denied')
        return
    }

    // If already granted, just make sure subscription is saved
    if (Notification.permission === 'granted') {
        const result = await subscribeToPush()
        if (!result.success) {
            console.log('[Push] Re-subscribe failed:', result.error)
        }
        return
    }

    // Permission is 'default' — prompt the user
    // Small delay to not overwhelm user right after login
    setTimeout(async () => {
        await subscribeToPush()
    }, 3000)
}

export default {
    isPushSupported,
    getPermissionStatus,
    isPushSubscribed,
    subscribeToPush,
    unsubscribeFromPush,
    initPushNotifications
}
