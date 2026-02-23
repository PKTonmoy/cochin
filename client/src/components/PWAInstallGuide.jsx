import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, Download, Share, Plus, Check, Smartphone, MoreVertical, ArrowUp, ExternalLink, Globe } from 'lucide-react'

/**
 * PWAInstallGuide Component
 * Single-button install with automatic fallback to device-specific manual guide.
 *
 * Flow:
 *   1. Shows a big "Install App" button
 *   2. On click: tries native beforeinstallprompt (Chrome/Edge/Samsung/Opera)
 *   3. If native prompt unavailable → shows device-specific manual instructions
 *   4. On success → shows success screen with confetti
 *
 * Works on: Android (Chrome, Edge, Samsung, Opera, Firefox), iOS (Safari), Desktop
 */

// ─── Device & Browser Detection ──────────────────────────────────
const getDeviceType = () => {
    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'
    if (/Android/i.test(ua)) return 'android'
    return 'desktop'
}

const getBrowserName = () => {
    const ua = navigator.userAgent
    if (navigator.brave !== undefined || /Brave/i.test(ua)) return 'brave'
    if (/SamsungBrowser/i.test(ua)) return 'samsung'
    if (/OPR|Opera/i.test(ua)) return 'opera'
    if (/Firefox/i.test(ua)) return 'firefox'
    if (/Edg/i.test(ua)) return 'edge'
    if (/CriOS/i.test(ua)) return 'chrome-ios'
    if (/Chrome/i.test(ua)) return 'chrome'
    if (/Safari/i.test(ua)) return 'safari'
    return 'other'
}

const isSafariBrowser = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

const ANIMATION_SPEEDS = { slow: '0.8s', normal: '0.5s', fast: '0.3s', none: '0s' }

// ─── Built-in fallback instructions per device/browser ───────────
const getDefaultSteps = (device, browser) => {
    if (device === 'ios') {
        if (browser !== 'safari') {
            return {
                notice: 'PWA installation on iOS requires Safari. Please open this page in Safari.',
                steps: [
                    { icon: 'globe', title: 'Open in Safari', description: 'Copy this page URL and open it in Safari browser' },
                    { icon: 'share', title: 'Tap the Share button', description: 'Tap the share icon (□↑) at the bottom of Safari' },
                    { icon: 'plus', title: 'Add to Home Screen', description: 'Scroll down and tap "Add to Home Screen"' },
                    { icon: 'check', title: 'Tap "Add"', description: 'Confirm by tapping "Add" in the top-right corner' }
                ]
            }
        }
        return {
            steps: [
                { icon: 'share', title: 'Tap the Share button', description: 'Tap the share icon (□↑) at the bottom of Safari' },
                { icon: 'plus', title: 'Add to Home Screen', description: 'Scroll down and tap "Add to Home Screen"' },
                { icon: 'check', title: 'Tap "Add"', description: 'Confirm by tapping "Add" in the top-right corner' }
            ]
        }
    }

    if (device === 'android') {
        if (browser === 'firefox') {
            return {
                steps: [
                    { icon: 'menu', title: 'Tap ⋮ Menu', description: 'Tap the three-dot menu at the top-right' },
                    { icon: 'plus', title: 'Tap "Install"', description: 'Tap "Install" or "Add to Home screen"' },
                    { icon: 'check', title: 'Confirm', description: 'Tap "Add" to install the app' }
                ]
            }
        }
        if (browser === 'brave') {
            return {
                steps: [
                    { icon: 'menu', title: 'Tap ⋮ Menu', description: 'Tap the three-dot menu (bottom-right or top-right)' },
                    { icon: 'download', title: 'Tap "Install App"', description: 'Look for "Install app" or "Add to Home screen"' },
                    { icon: 'check', title: 'Confirm', description: 'Tap "Install" to add the app to your home screen' }
                ]
            }
        }
        if (browser === 'samsung') {
            return {
                steps: [
                    { icon: 'menu', title: 'Tap ☰ Menu', description: 'Tap the menu icon at the bottom-right' },
                    { icon: 'plus', title: 'Tap "Add page to"', description: 'Select "Add page to" → "Home screen"' },
                    { icon: 'check', title: 'Confirm', description: 'Tap "Add" to place the app on your home screen' }
                ]
            }
        }
        // Chrome, Edge, Opera — similar flow
        return {
            steps: [
                { icon: 'menu', title: 'Tap ⋮ Menu', description: 'Tap the three-dot menu at the top-right of your browser' },
                { icon: 'download', title: 'Tap "Install App"', description: 'Look for "Install app" or "Add to Home screen"' },
                { icon: 'check', title: 'Confirm', description: 'Tap "Install" to add the app to your home screen' }
            ]
        }
    }

    // Desktop
    return {
        steps: [
            { icon: 'download', title: 'Click the install icon', description: 'Look for the install icon (⊕) in your browser\'s address bar' },
            { icon: 'check', title: 'Click "Install"', description: 'Confirm the installation in the popup dialog' }
        ]
    }
}

const StepIcon = ({ icon, color }) => {
    const props = { size: 16, style: { color } }
    switch (icon) {
        case 'share': return <Share {...props} />
        case 'plus': return <Plus {...props} />
        case 'check': return <Check {...props} />
        case 'download': return <Download {...props} />
        case 'menu': return <MoreVertical {...props} />
        case 'globe': return <Globe {...props} />
        case 'link': return <ExternalLink {...props} />
        default: return <Smartphone {...props} />
    }
}

// ─── Main Component ──────────────────────────────────────────────
const PWAInstallGuide = ({ settings, onClose, onInstallComplete, deferredPrompt, rollNumber }) => {
    const [view, setView] = useState('install') // 'install' | 'manual' | 'success'
    const [isInstalling, setIsInstalling] = useState(false)
    const [installAttempted, setInstallAttempted] = useState(false)
    const deviceType = useRef(getDeviceType()).current
    const browser = useRef(getBrowserName()).current

    // Guide content from admin settings or defaults
    const content = settings?.guideContent || {}
    const appearance = settings?.guideAppearance || {}

    // Use admin-configured steps if available, otherwise use built-in defaults
    const adminSteps = deviceType === 'ios' ? settings?.iosSteps : settings?.androidSteps
    const builtInGuide = getDefaultSteps(deviceType, browser)
    const steps = (adminSteps && adminSteps.length > 0) ? adminSteps : builtInGuide.steps
    const notice = builtInGuide.notice

    const primaryColor = appearance.primaryColor || '#3b82f6'
    const animSpeed = ANIMATION_SPEEDS[appearance.animationSpeed] || '0.5s'
    const overlayOpacity = (appearance.overlayOpacity ?? 60) / 100
    const benefits = content.benefits || [
        { emoji: '⚡', text: 'Faster Login' },
        { emoji: '📶', text: 'Works Offline' },
        { emoji: '🔔', text: 'Get Notifications' }
    ]

    // Can we do native install?
    const canNativeInstall = !!deferredPrompt

    // ── Listen for app installed ──
    useEffect(() => {
        const handler = () => {
            setView('success')
            if (onInstallComplete) onInstallComplete()
        }
        window.addEventListener('appinstalled', handler)
        return () => window.removeEventListener('appinstalled', handler)
    }, [onInstallComplete])

    // ── Auto-close success screen after 4s ──
    useEffect(() => {
        if (view === 'success') {
            const timer = setTimeout(() => onClose?.(), 4000)
            return () => clearTimeout(timer)
        }
    }, [view, onClose])

    // ── Single Install Button handler ──
    const handleInstallClick = useCallback(async () => {
        setInstallAttempted(true)

        if (canNativeInstall) {
            // Native install available — trigger it directly
            setIsInstalling(true)
            try {
                deferredPrompt.prompt()
                const { outcome } = await deferredPrompt.userChoice
                if (outcome === 'accepted') {
                    setView('success')
                } else {
                    // User dismissed — show manual guide as fallback
                    setView('manual')
                }
            } catch (err) {
                console.error('Install prompt error:', err)
                setView('manual')
            } finally {
                setIsInstalling(false)
            }
        } else {
            // No native prompt — show device-specific manual instructions
            setView('manual')
        }
    }, [canNativeInstall, deferredPrompt])

    // ── Install View (Single Button) ──
    const InstallView = () => (
        <div className="flex flex-col items-center text-center px-6 pt-6 pb-8 h-full justify-center">
            {/* App icon with glow */}
            <div className="relative mb-8">
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: `0 0 40px ${primaryColor}40` }}
                >
                    <Download size={36} />
                </div>
                <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: primaryColor }} />
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold mb-2" style={{ color: appearance.textColor || '#1e293b' }}>
                {content.welcomeHeading || 'Install App'}
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
                {content.welcomeSubtext || 'One tap to install — works like a native app on your phone'}
            </p>

            {/* Benefits */}
            {(appearance.showBenefits !== false) && (
                <div className="w-full max-w-xs space-y-2.5 mb-8">
                    {benefits.map((benefit, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-left"
                            style={{ animationDelay: `${i * 0.12}s`, animation: `slideInRight ${animSpeed} ease-out forwards`, opacity: 0 }}
                        >
                            <span className="text-xl flex-shrink-0">{benefit.emoji}</span>
                            <span className="text-sm font-medium text-gray-700">{benefit.text}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ★ Single Install Button ★ */}
            <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-70"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                    boxShadow: `0 4px 20px ${primaryColor}40`,
                    animation: 'pulse-shadow 2s ease-in-out infinite'
                }}
            >
                {isInstalling ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <Download size={20} />
                        {content.installButtonText || 'Install App'}
                    </>
                )}
            </button>

            {/* Subtitle hint */}
            <p className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
                <Smartphone size={12} />
                {canNativeInstall
                    ? 'Installs instantly — no app store needed'
                    : deviceType === 'ios'
                        ? 'Quick setup — just 3 steps'
                        : 'Quick setup — takes 10 seconds'}
            </p>

            {/* Device & Browser Info */}
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${primaryColor}15`, color: primaryColor }}>
                {deviceType === 'ios' ? '🍎 iOS' : deviceType === 'android' ? '🤖 Android' : '💻 Desktop'}
                {' · '}
                {browser === 'safari' ? 'Safari' : browser === 'chrome' ? 'Chrome' : browser === 'firefox' ? 'Firefox' :
                    browser === 'edge' ? 'Edge' : browser === 'samsung' ? 'Samsung' : browser === 'opera' ? 'Opera' :
                        browser === 'chrome-ios' ? 'Chrome' : browser === 'brave' ? 'Brave' : 'Browser'}
            </div>

            {/* Skip */}
            <button onClick={onClose} className="mt-5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {content.maybeLaterText || 'Maybe Later'}
            </button>
        </div>
    )

    // ── Manual Instructions View ──
    const ManualView = () => (
        <div className="flex flex-col px-6 pt-4 pb-8 h-full">
            {/* Header */}
            <div className="text-center mb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                    style={{ background: `${primaryColor}15`, color: primaryColor }}>
                    {deviceType === 'ios' ? '🍎 iOS' : deviceType === 'android' ? '🤖 Android' : '💻 Desktop'}
                    {' · '}
                    {browser === 'safari' ? 'Safari' : browser === 'chrome' ? 'Chrome' : browser === 'firefox' ? 'Firefox' :
                        browser === 'edge' ? 'Edge' : browser === 'samsung' ? 'Samsung' : browser === 'opera' ? 'Opera' :
                            browser === 'chrome-ios' ? 'Chrome' : browser === 'brave' ? 'Brave' : 'Browser'}
                </div>
                <h3 className="text-lg font-bold text-gray-900">Follow These Steps</h3>
                <p className="text-xs text-gray-500 mt-1">It only takes a few seconds</p>
            </div>

            {/* Safari-only notice for iOS non-Safari */}
            {notice && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-center">
                    <p className="text-xs text-orange-700 font-medium">⚠️ {notice}</p>
                </div>
            )}

            {/* Steps */}
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-3 max-w-xs mx-auto">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100"
                            style={{ animation: `slideInRight ${animSpeed} ease-out ${i * 0.1}s forwards`, opacity: 0 }}
                        >
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                                style={{ background: primaryColor }}
                            >
                                {step.stepNumber || <StepIcon icon={step.icon || ''} color="#fff" />}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* iOS Safari share button helper arrow */}
            {deviceType === 'ios' && isSafariBrowser() && (
                <div className="mt-4 flex justify-center animate-bounce">
                    <div className="flex flex-col items-center text-gray-400">
                        <ArrowUp size={20} className="rotate-180" />
                        <span className="text-xs mt-0.5">Share button is down here ↓</span>
                    </div>
                </div>
            )}

            {/* Skip */}
            <button onClick={onClose} className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors text-center">
                Skip — Go to Login Page
            </button>
        </div>
    )

    // ── Success View ──
    const SuccessView = () => (
        <div className="flex flex-col items-center justify-center text-center px-6 h-full">
            <div className="relative mb-6">
                <div
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: `${primaryColor}15` }}
                >
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white"
                        style={{ background: primaryColor, animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
                    >
                        <Check size={32} strokeWidth={3} />
                    </div>
                </div>
                {/* Confetti */}
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                            background: ['#3b82f6', '#f97316', '#10b981', '#a855f7', '#ef4444', '#06b6d4', '#eab308', '#ec4899'][i],
                            top: '50%', left: '50%',
                            animation: `confetti-${i % 4} 1s ease-out ${i * 0.08}s forwards`,
                            opacity: 0
                        }}
                    />
                ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {content.successHeading || 'App Installed! 🎉'}
            </h2>
            <p className="text-sm text-gray-500 mb-8 max-w-xs">
                {content.successSubtext || 'Find the app on your home screen'}
            </p>

            <button
                onClick={onClose}
                className="px-8 py-3.5 rounded-2xl text-white font-bold shadow-lg"
                style={{ background: primaryColor }}
            >
                Open App
            </button>
        </div>
    )

    return (
        <>
            {/* Animation styles */}
            <style>{`
                @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes bounceIn { 0% { transform: scale(0); } 70% { transform: scale(1.1); } 100% { transform: scale(1); } }
                @keyframes pulse-shadow { 0%, 100% { box-shadow: 0 4px 20px ${primaryColor}40; } 50% { box-shadow: 0 4px 30px ${primaryColor}60; } }
                @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes confetti-0 { to { transform: translate(-30px, -40px); opacity: 0; } }
                @keyframes confetti-1 { to { transform: translate(30px, -35px); opacity: 0; } }
                @keyframes confetti-2 { to { transform: translate(-25px, 30px); opacity: 0; } }
                @keyframes confetti-3 { to { transform: translate(35px, 25px); opacity: 0; } }
            `}</style>

            {/* Overlay */}
            <div
                className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
                style={{ background: `rgba(0,0,0,${overlayOpacity})` }}
                onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
            >
                {/* Card */}
                <div
                    className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden relative flex flex-col"
                    style={{
                        maxHeight: '90dvh',
                        minHeight: view === 'success' ? '40dvh' : '55dvh',
                        background: appearance.cardBackgroundColor || '#ffffff',
                        animation: `slideUp ${animSpeed} ease-out`
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-4 pt-3 flex-shrink-0">
                        {view === 'manual' ? (
                            <button onClick={() => setView('install')} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                                <ChevronLeft size={20} />
                            </button>
                        ) : <div className="w-9" />}

                        {/* View indicator */}
                        <div className="flex items-center gap-1.5">
                            {['install', 'manual', 'success'].map((v, i) => (
                                <div
                                    key={v}
                                    className="rounded-full transition-all duration-300"
                                    style={{
                                        width: v === view ? 20 : 6,
                                        height: 6,
                                        background: v === view ? primaryColor :
                                            (v === 'manual' && view === 'success') || (v === 'install' && view !== 'install') ? primaryColor : '#e2e8f0'
                                    }}
                                />
                            ))}
                        </div>

                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {view === 'install' && <InstallView />}
                        {view === 'manual' && <ManualView />}
                        {view === 'success' && <SuccessView />}
                    </div>
                </div>
            </div>
        </>
    )
}

export default PWAInstallGuide
