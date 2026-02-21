import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Share, Plus, Check, Smartphone, Wifi, Bell, Zap } from 'lucide-react'

/**
 * PWAInstallGuide Component
 * Full-screen animated 3-screen overlay for PWA installation guidance.
 * 
 * Props:
 *   settings - PWA settings from API (guideContent, guideAppearance, androidSteps, iosSteps)
 *   onClose - callback when user dismisses
 *   onInstallComplete - callback when installation detected
 *   deferredPrompt - beforeinstallprompt event (Android/Chrome)
 *   rollNumber - optional roll number to pass through
 */

// ─── Device Detection ────────────────────────────────────────────
const getDeviceType = () => {
    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios'
    if (/Android/i.test(ua)) return 'android'
    return 'desktop'
}

const isSafariBrowser = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

const ANIMATION_SPEEDS = { slow: '0.8s', normal: '0.5s', fast: '0.3s', none: '0s' }

const PWAInstallGuide = ({ settings, onClose, onInstallComplete, deferredPrompt, rollNumber }) => {
    const [currentScreen, setCurrentScreen] = useState(0) // 0: welcome, 1: instructions, 2: success
    const [currentStep, setCurrentStep] = useState(0)
    const [isInstalling, setIsInstalling] = useState(false)
    const [touchStart, setTouchStart] = useState(null)
    const deviceType = useRef(getDeviceType()).current

    // Guide content from admin settings or defaults
    const content = settings?.guideContent || {}
    const appearance = settings?.guideAppearance || {}
    const androidSteps = settings?.androidSteps || []
    const iosSteps = settings?.iosSteps || []
    const steps = deviceType === 'ios' ? iosSteps : androidSteps

    const primaryColor = appearance.primaryColor || '#3b82f6'
    const animSpeed = ANIMATION_SPEEDS[appearance.animationSpeed] || '0.5s'
    const overlayOpacity = (appearance.overlayOpacity ?? 60) / 100
    const benefits = content.benefits || [
        { emoji: '⚡', text: 'Faster Login' },
        { emoji: '📶', text: 'Works Offline' },
        { emoji: '🔔', text: 'Get Notifications' }
    ]

    // ── Listen for app installed ──
    useEffect(() => {
        const handler = () => {
            setCurrentScreen(2) // Jump to success screen
            if (onInstallComplete) onInstallComplete()
        }
        window.addEventListener('appinstalled', handler)
        return () => window.removeEventListener('appinstalled', handler)
    }, [onInstallComplete])

    // ── Auto-close success screen after 3s ──
    useEffect(() => {
        if (currentScreen === 2) {
            const timer = setTimeout(() => {
                onClose?.()
            }, 4000)
            return () => clearTimeout(timer)
        }
    }, [currentScreen, onClose])

    // ── Install handler (Android) ──
    const handleInstall = useCallback(async () => {
        if (deferredPrompt) {
            setIsInstalling(true)
            try {
                deferredPrompt.prompt()
                const { outcome } = await deferredPrompt.userChoice
                if (outcome === 'accepted') {
                    setCurrentScreen(2)
                }
            } catch (err) { console.error('Install error:', err) }
            finally { setIsInstalling(false) }
        } else {
            // No deferred prompt — go to manual instructions
            setCurrentScreen(1)
        }
    }, [deferredPrompt])

    // ── Swipe handling ──
    const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX)
    const handleTouchEnd = (e) => {
        if (!touchStart) return
        const diff = touchStart - e.changedTouches[0].clientX
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentScreen < 2) setCurrentScreen(s => s + 1)
            if (diff < 0 && currentScreen > 0) setCurrentScreen(s => s - 1)
        }
        setTouchStart(null)
    }

    // ── Screen 1: Welcome ──
    const WelcomeScreen = () => (
        <div className="flex flex-col items-center text-center px-6 pt-6 pb-8 h-full justify-center">
            {/* Logo with glow */}
            <div className="relative mb-8">
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, boxShadow: `0 0 40px ${primaryColor}40` }}
                >
                    <Smartphone size={36} />
                </div>
                <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: primaryColor }} />
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold mb-3" style={{ color: appearance.textColor || '#1e293b' }}>
                {content.welcomeHeading || 'Get the App'}
            </h2>
            <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed">
                {content.welcomeSubtext || 'Install our app for faster access, offline support & better experience'}
            </p>

            {/* Benefits */}
            {(appearance.showBenefits !== false) && (
                <div className="w-full max-w-xs space-y-3 mb-8">
                    {benefits.map((benefit, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-left"
                            style={{ animationDelay: `${i * 0.15}s`, animation: `slideInRight ${animSpeed} ease-out forwards`, opacity: 0 }}
                        >
                            <span className="text-xl flex-shrink-0">{benefit.emoji}</span>
                            <span className="text-sm font-medium text-gray-700">{benefit.text}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Phone mockup hint */}
            {(appearance.showPhoneMockup !== false) && (
                <div className="mb-6 text-xs text-gray-400 flex items-center gap-1">
                    <Smartphone size={14} />
                    <span>Appears on your home screen like a native app</span>
                </div>
            )}

            {/* Install button */}
            <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
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
                        <Download size={18} />
                        {content.installButtonText || 'Install Now'}
                    </>
                )}
            </button>

            {/* Maybe later */}
            <button onClick={onClose} className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                {content.maybeLaterText || 'Maybe Later'}
            </button>
        </div>
    )

    // ── Screen 2: Device-specific instructions ──
    const InstructionScreen = () => (
        <div className="flex flex-col px-6 pt-4 pb-8 h-full">
            {/* Header */}
            <div className="text-center mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: primaryColor }}>
                    {deviceType === 'ios' ? 'Safari Instructions' : 'Chrome Instructions'}
                </p>
                <h3 className="text-lg font-bold text-gray-900">How to Install</h3>
            </div>

            {/* Steps */}
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-3 max-w-xs mx-auto">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className={`flex items-start gap-3 p-3.5 rounded-xl transition-all ${i === currentStep ? 'bg-blue-50 border border-blue-100 shadow-sm' : 'bg-gray-50'}`}
                            onClick={() => setCurrentStep(i)}
                            style={{ animation: `slideInRight ${animSpeed} ease-out ${i * 0.1}s forwards`, opacity: 0 }}
                        >
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                                style={{ background: i === currentStep ? primaryColor : '#cbd5e1' }}
                            >
                                {i < currentStep ? <Check size={14} /> : step.stepNumber || i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* iOS Safari warning */}
            {deviceType === 'ios' && !isSafariBrowser() && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl text-center">
                    <p className="text-xs text-orange-700 font-medium">⚠️ Please open this page in Safari to install</p>
                </div>
            )}

            {/* Android auto-install button */}
            {deviceType === 'android' && deferredPrompt && (
                <button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="mt-4 w-full py-3.5 rounded-2xl text-white font-bold shadow-lg flex items-center justify-center gap-2"
                    style={{ background: primaryColor }}
                >
                    {isInstalling ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Download size={16} />
                            Install Automatically
                        </>
                    )}
                </button>
            )}

            {/* Skip to login */}
            <button onClick={onClose} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors text-center">
                Skip — Go to Login Page
            </button>
        </div>
    )

    // ── Screen 3: Success! ──
    const SuccessScreen = () => (
        <div className="flex flex-col items-center justify-center text-center px-6 h-full">
            {/* Success animation */}
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
                {/* Confetti dots */}
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
                {content.successHeading || 'App Installed Successfully! 🎉'}
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

    const screens = [<WelcomeScreen key="welcome" />, <InstructionScreen key="instructions" />, <SuccessScreen key="success" />]

    return (
        <>
            {/* Inline animation styles */}
            <style>{`
                @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes bounceIn { 0% { transform: scale(0); } 70% { transform: scale(1.1); } 100% { transform: scale(1); } }
                @keyframes pulse-shadow { 0%, 100% { box-shadow: 0 4px 20px ${primaryColor}40; } 50% { box-shadow: 0 4px 30px ${primaryColor}60; } }
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
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Card */}
                <div
                    className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden relative flex flex-col"
                    style={{
                        maxHeight: '90dvh',
                        minHeight: '60dvh',
                        background: appearance.cardBackgroundColor || '#ffffff',
                        animation: `slideUp ${animSpeed} ease-out`
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Progress bar */}
                    <div className="h-1 bg-gray-100 flex-shrink-0">
                        <div
                            className="h-full transition-all duration-500 ease-out"
                            style={{ width: `${((currentScreen + 1) / 3) * 100}%`, background: primaryColor }}
                        />
                    </div>

                    {/* Top controls */}
                    <div className="flex items-center justify-between px-4 pt-3 flex-shrink-0">
                        {currentScreen > 0 && currentScreen < 2 ? (
                            <button onClick={() => setCurrentScreen(s => s - 1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                                <ChevronLeft size={20} />
                            </button>
                        ) : <div className="w-9" />}

                        {/* Progress dots */}
                        <div className="flex items-center gap-1.5">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className="rounded-full transition-all duration-300"
                                    style={{
                                        width: i === currentScreen ? 20 : 6,
                                        height: 6,
                                        background: i === currentScreen ? primaryColor : '#e2e8f0'
                                    }}
                                />
                            ))}
                        </div>

                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Screen content */}
                    <div className="flex-1 overflow-y-auto">
                        {screens[currentScreen]}
                    </div>
                </div>
            </div>

            {/* slideUp keyframe is already defined in index.css, but add fallback */}
            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </>
    )
}

export default PWAInstallGuide
