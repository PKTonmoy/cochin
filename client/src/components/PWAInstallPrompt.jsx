import { useState, useEffect, useCallback } from 'react'
import { X, Download, Share, Plus, ArrowUp } from 'lucide-react'
import api from '../lib/api'

/**
 * PWAInstallPrompt Component
 * ===========================
 * Custom "Add to Home Screen" banner for the PARAGON Student Portal.
 * 
 * Features:
 * - Captures the beforeinstallprompt event (Chrome/Edge/Android)
 * - Shows after 2+ visits OR after successful login
 * - iOS detection: shows separate instruction modal
 * - Dismiss stores state in localStorage for 7 days
 * - Matches the glassmorphic PARAGON design theme
 */

// ─── Constants ───────────────────────────────────────────────────
const DISMISS_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
const VISIT_COUNT_KEY = 'pwa-visit-count'
const MIN_VISITS = 2

// ─── iOS Detection ───────────────────────────────────────────────
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
}

function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

const PWAInstallPrompt = () => {
    const [showBanner, setShowBanner] = useState(false)
    const [showIOSModal, setShowIOSModal] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [isInstalling, setIsInstalling] = useState(false)
    const [settings, setSettings] = useState(null)

    // ─── Fetch Settings ──────────────────────────────────────────────
    useEffect(() => {
        api.get('/pwa-settings/public')
            .then(res => setSettings(res.data?.data))
            .catch(err => console.error('Failed to fetch PWA settings', err))
    }, [])

    // ─── Check if we should show the banner ──────────────────────
    const shouldShowBanner = useCallback(() => {
        // Obey admin settings if loaded
        if (settings?.guideVisibility?.showToNewVisitors === false) return false

        // Don't show if already installed as PWA
        if (isInStandaloneMode()) return false

        // Check if dismissed recently
        const dismissedAt = localStorage.getItem(DISMISS_KEY)
        if (dismissedAt) {
            const elapsed = Date.now() - parseInt(dismissedAt, 10)
            if (elapsed < DISMISS_DURATION) return false
        }

        // Check visit count
        const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10)
        return visitCount >= MIN_VISITS
    }, [settings])

    // ─── Track visits ────────────────────────────────────────────
    useEffect(() => {
        const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10)
        localStorage.setItem(VISIT_COUNT_KEY, String(count + 1))
    }, [])

    // ─── Listen for beforeinstallprompt (Android/Chrome) ─────────
    useEffect(() => {
        const handler = (e) => {
            // Prevent Chrome's mini-infobar
            e.preventDefault()
            setDeferredPrompt(e)
            if (shouldShowBanner()) {
                setShowBanner(true)
            }
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Also listen for successful login events
        const loginHandler = () => {
            if (shouldShowBanner() && (deferredPrompt || isIOS())) {
                if (isIOS() && isSafari()) {
                    setShowIOSModal(true)
                } else if (deferredPrompt) {
                    setShowBanner(true)
                }
            }
        }
        window.addEventListener('pwa-show-install', loginHandler)

        // For iOS Safari — show after visit count threshold
        if (isIOS() && isSafari() && !isInStandaloneMode()) {
            if (shouldShowBanner()) {
                setShowIOSModal(true)
            }
        }

        // Listen for app installed
        const installedHandler = () => {
            setShowBanner(false)
            setShowIOSModal(false)
            setDeferredPrompt(null)
        }
        window.addEventListener('appinstalled', installedHandler)

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
            window.removeEventListener('pwa-show-install', loginHandler)
            window.removeEventListener('appinstalled', installedHandler)
        }
    }, [shouldShowBanner, deferredPrompt])

    // ─── Install handler (Android/Chrome) ────────────────────────
    const handleInstall = async () => {
        if (!deferredPrompt) return

        setIsInstalling(true)
        try {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                setShowBanner(false)
            }
        } catch (err) {
            console.error('Install prompt error:', err)
        } finally {
            setIsInstalling(false)
            setDeferredPrompt(null)
        }
    }

    // ─── Dismiss handler ────────────────────────────────────────
    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()))
        setShowBanner(false)
        setShowIOSModal(false)
    }

    // ─── Android/Chrome Install Banner ──────────────────────────
    if (showBanner) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-slide-up" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                <div className="max-w-lg mx-auto bg-white/95 backdrop-blur-xl border border-black/8 rounded-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.12)] p-5 relative overflow-hidden">
                    {/* Gradient accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#f97316]" />

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                        aria-label="Dismiss"
                    >
                        <X size={18} />
                    </button>

                    {/* Content */}
                    <div className="flex items-start gap-4 pr-6">
                        {/* App icon */}
                        <div className="w-14 h-14 flex-shrink-0 rounded-[14px] bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <span className="text-white font-bold text-xl">P</span>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 leading-tight">
                                {settings?.guideContent?.welcomeHeading || 'Install App'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                {settings?.guideContent?.welcomeSubtext || 'Access your portal faster — works offline too!'}
                            </p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all min-h-[44px]"
                        >
                            Not Now
                        </button>
                        <button
                            onClick={handleInstall}
                            disabled={isInstalling}
                            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-70"
                        >
                            {isInstalling ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Download size={16} />
                                    Install
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ─── iOS Instruction Modal ──────────────────────────────────
    if (showIOSModal) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={handleDismiss}>
                <div
                    className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-8 animate-slide-up"
                    style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Handle bar */}
                    <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Install App</h3>
                            <p className="text-sm text-gray-500">Add to your home screen</p>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-4 mb-6">
                        {/* Step 1 */}
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                1
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">
                                    Tap the <Share size={16} className="inline text-blue-500 -mt-0.5" /> Share button
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">At the bottom of Safari</p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                2
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">
                                    Scroll down and tap <Plus size={14} className="inline text-gray-600 -mt-0.5" /> <span className="text-blue-600">Add to Home Screen</span>
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                3
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">
                                    Tap <span className="text-blue-600 font-bold">Add</span> to confirm
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">The app will appear on your home screen</p>
                            </div>
                        </div>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={handleDismiss}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all min-h-[48px]"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        )
    }

    return null
}

export default PWAInstallPrompt
