import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import PWAInstallGuide from '../../components/PWAInstallGuide'
import api from '../../lib/api'

/**
 * PortalEntryPage — Smart Redirect Landing Page
 * Route: /portal-entry?roll=12345
 *
 * Flow:
 *   1. Beautiful loading animation
 *   2. Fetches public PWA settings
 *   3. Tracks scan via /api/qr/track-scan
 *   4. PWA installed? → redirect to login with roll pre-filled
 *   5. Desktop? → redirect to login directly
 *   6. Mobile + no PWA? → show PWAInstallGuide, then skip to login
 */

// ─── PWA Detection ───────────────────────────────────────────────
function isPWAInstalled() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        localStorage.getItem('pwa-installed') === 'true'
    )
}

function getDeviceType() {
    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'
    if (/Android/i.test(ua)) return 'android'
    return 'desktop'
}

function getBrowserName() {
    const ua = navigator.userAgent
    if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) return 'chrome'
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'safari'
    if (/Firefox/i.test(ua)) return 'firefox'
    if (/SamsungBrowser/i.test(ua)) return 'samsung'
    if (/Edge/i.test(ua)) return 'edge'
    return 'other'
}

const PortalEntryPage = () => {
    const navigate = useNavigate()
    const { isAuthenticated, isStudent, isAdmin, isStaff } = useAuth()
    const [searchParams] = useSearchParams()
    const roll = searchParams.get('roll') || ''
    const source = searchParams.get('source') || 'qr'

    const [phase, setPhase] = useState('loading') // 'loading' | 'guide' | 'redirect'
    const [pwaSettings, setPwaSettings] = useState(null)
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const hasTracked = useRef(false)

    const deviceType = useRef(getDeviceType()).current
    const browser = useRef(getBrowserName()).current
    const pwaInstalled = useRef(isPWAInstalled()).current

    // ── Capture beforeinstallprompt ──
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }
        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    // ── Main flow: fetch settings → detect → route ──
    useEffect(() => {
        async function run() {
            // 1. Store roll number for later use
            if (roll) {
                sessionStorage.setItem('qr_roll', roll)
                localStorage.setItem('remembered_roll', roll)
            }

            // 2. Fetch PWA settings
            let settings = null
            try {
                const res = await api.get('/pwa-settings/public')
                settings = res.data?.data
                setPwaSettings(settings)
            } catch (e) {
                console.warn('[PortalEntry] Failed to fetch PWA settings:', e)
            }

            // 3. Track scan event (don't await — non-blocking)
            if (!hasTracked.current) {
                hasTracked.current = true
                api.post('/qr/track-scan', {
                    roll,
                    device: deviceType,
                    browser,
                    pwaInstalled,
                    guideShown: false,
                    source
                }).catch(() => { })
            }

            const redirect = settings?.redirectSettings || {}
            const guideVisibility = settings?.guideVisibility || {}

            // 4. Decision tree

            // If already logged in, skip everything and go to dashboard
            if (isAuthenticated) {
                if (isStudent) {
                    navigateToLogin('/student')
                    return
                }
                if (isAdmin || isStaff) {
                    navigateToLogin('/admin')
                    return
                }
            }

            if (!redirect.enabled) {
                // Redirect disabled — go straight to login
                navigateToLogin(redirect.nonPwaRedirectUrl || '/student-login')
                return
            }

            if (pwaInstalled) {
                // PWA is installed → redirect immediately
                navigateToLogin(redirect.pwaRedirectUrl || '/student-login')
                return
            }

            if (deviceType === 'desktop') {
                // Desktop → skip guide, redirect to login
                navigateToLogin(redirect.desktopRedirectUrl || '/student-login')
                return
            }

            // Mobile + no PWA → show install guide (if enabled)
            if (guideVisibility.showOnQRScan !== false) {
                // Track that guide was shown
                api.post('/qr/track-scan', {
                    roll, device: deviceType, browser, pwaInstalled: false,
                    guideShown: true, source
                }).catch(() => { })

                // Small delay for smooth transition from loading
                setTimeout(() => setPhase('guide'), 600)
            } else {
                navigateToLogin(redirect.nonPwaRedirectUrl || '/student-login')
            }
        }

        run()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Navigate to login with roll pre-filled ──
    function navigateToLogin(path = '/student-login') {
        const url = roll ? `${path}?roll=${encodeURIComponent(roll)}` : path
        setPhase('redirect')
        setTimeout(() => navigate(url, { replace: true }), 300)
    }

    // ── Guide dismissed or completed ──
    function handleGuideClose() {
        navigateToLogin(pwaSettings?.redirectSettings?.nonPwaRedirectUrl || '/student-login')
    }

    function handleInstallComplete() {
        // Track completion
        api.post('/qr/track-scan', {
            roll, device: deviceType, browser,
            pwaInstalled: true, guideCompleted: true, installTriggered: true, source
        }).catch(() => { })
        localStorage.setItem('pwa-installed', 'true')
    }

    // ── Loading Screen ──
    if (phase === 'loading' || phase === 'redirect') {
        return (
            <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]">
                {/* Background gradients */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(249,115,22,0.04) 0%, transparent 50%)'
                }} />

                <div className="relative z-10 flex flex-col items-center">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg shadow-blue-500/25" style={{ animation: 'float 3s ease-in-out infinite' }}>
                        P
                    </div>

                    {/* Spinner */}
                    <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4" style={{ borderWidth: '3px' }} />

                    <p className="text-sm text-gray-500 font-medium">
                        {phase === 'redirect' ? 'Redirecting...' : 'Loading portal...'}
                    </p>

                    {roll && (
                        <p className="text-xs text-gray-400 mt-2">
                            Roll: <span className="font-mono font-bold text-gray-600">{roll}</span>
                        </p>
                    )}
                </div>

                <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
            </div>
        )
    }

    // ── Guide Screen ──
    if (phase === 'guide') {
        return (
            <div className="fixed inset-0 z-[9999]">
                {/* Show the login page behind the guide overlay */}
                <div className="absolute inset-0 bg-white" />
                <PWAInstallGuide
                    settings={pwaSettings}
                    onClose={handleGuideClose}
                    onInstallComplete={handleInstallComplete}
                    deferredPrompt={deferredPrompt}
                    rollNumber={roll}
                />
            </div>
        )
    }

    return null
}

export default PortalEntryPage
