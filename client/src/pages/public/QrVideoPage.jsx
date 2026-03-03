/**
 * QrVideoPage.jsx
 * Standalone immersive QR code video experience page
 * 
 * OPTIMIZED VERSION:
 * - Hidden iframe preloads the redirect target while video plays
 * - Crossfade transition eliminates hard "white flash" on redirect
 * - Premium skeleton loading with shimmer effect
 * - Preconnect hints for faster resource loading
 * - Video buffering progress indicator
 * - Post-video animations (logo/confetti/ripple/zoom)
 * - Analytics: logs scan on mount, completion on video end
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// ============================================================
// PRECONNECT HINTS — Inject on mount for faster resource loading
// ============================================================
function PreconnectHints() {
    useEffect(() => {
        const hints = [
            { rel: 'preconnect', href: 'https://res.cloudinary.com' },
            { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
            { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
            { rel: 'dns-prefetch', href: 'https://www.youtube.com' },
            { rel: 'dns-prefetch', href: 'https://player.vimeo.com' }
        ]
        const links = hints.map(h => {
            const link = document.createElement('link')
            link.rel = h.rel
            link.href = h.href
            if (h.crossOrigin) link.crossOrigin = h.crossOrigin
            document.head.appendChild(link)
            return link
        })
        return () => links.forEach(l => l.parentNode?.removeChild(l))
    }, [])
    return null
}

// ============================================================
// HIDDEN PRELOADER — loads redirect target while video plays
// ============================================================
function HiddenPreloader({ url }) {
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        if (!url) return
        // Also prefetch key assets
        try {
            const link = document.createElement('link')
            link.rel = 'prefetch'
            link.href = url
            document.head.appendChild(link)
            return () => link.parentNode?.removeChild(link)
        } catch (e) { /* silent */ }
    }, [url])

    if (!url) return null

    return (
        <iframe
            src={url}
            onLoad={() => setLoaded(true)}
            style={{
                position: 'fixed', top: '-9999px', left: '-9999px',
                width: '1px', height: '1px', opacity: 0,
                pointerEvents: 'none', border: 'none'
            }}
            tabIndex={-1}
            aria-hidden="true"
            sandbox="allow-scripts allow-same-origin"
            title="Preload"
        />
    )
}

// ============================================================
// CROSSFADE TRANSITION — smooth redirect with fade
// ============================================================
function CrossfadeTransition({ targetUrl, onStart }) {
    const [phase, setPhase] = useState('enter')

    useEffect(() => {
        onStart?.()
        const t1 = setTimeout(() => setPhase('sweep'), 100)
        const t2 = setTimeout(() => setPhase('hold'), 700)
        const t3 = setTimeout(() => {
            // Append from=qr param so landing page skips skeleton loading
            const url = new URL(targetUrl || '/', window.location.origin)
            url.searchParams.set('from', 'qr')
            window.location.href = url.toString()
        }, 1000)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }, [targetUrl, onStart])

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, pointerEvents: 'all' }}>
            <style>{`
                @keyframes mkt-gradSweep {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(0%); }
                }
                @keyframes mkt-shimmerLine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
            {/* White base */}
            <div style={{
                position: 'absolute', inset: 0, background: '#ffffff',
                opacity: phase === 'enter' ? 0 : 1,
                transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1)'
            }} />
            {/* Gradient sweep */}
            <div style={{
                position: 'absolute', inset: 0, overflow: 'hidden',
                opacity: ['sweep', 'hold'].includes(phase) ? 1 : 0,
                transition: 'opacity 0.3s ease'
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(249,115,22,0.06) 100%)',
                    animation: phase === 'sweep' ? 'mkt-gradSweep 0.6s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
                    transform: phase === 'hold' ? 'translateX(0)' : undefined
                }} />
                {/* Shimmer line */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.06), rgba(249,115,22,0.04), transparent)',
                    animation: 'mkt-shimmerLine 0.8s ease-in-out 0.3s forwards',
                    opacity: phase === 'sweep' ? 1 : 0
                }} />
            </div>

        </div>
    )
}

// ============================================================
// PREMIUM LOADING SKELETON
// ============================================================
function PremiumLoader() {
    return (
        <div style={styles.loading}>
            <style>{`
                ${baseCSS}
                .mkt-loader-wrap {
                    display:flex; flex-direction:column; align-items:center; gap:28px;
                    position:relative; z-index:2;
                }
                .mkt-loader-icon {
                    width:80px; height:80px; border-radius:24px;
                    background:rgba(255,255,255,0.9); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
                    border:1px solid rgba(0,0,0,0.06);
                    display:flex; align-items:center; justify-content:center;
                    animation: mkt-breathe 2s ease-in-out infinite;
                    box-shadow: 0 8px 32px rgba(59,130,246,0.12);
                }
                .mkt-loader-spinner {
                    width:52px; height:52px; border:3px solid rgba(0,0,0,0.06);
                    border-top-color:#3b82f6; border-right-color:#f97316;
                    border-radius:50%; animation:mkt-spin 0.9s linear infinite;
                }
                .mkt-loader-shimmer {
                    width:180px; height:3px; border-radius:3px; overflow:hidden;
                    background:rgba(0,0,0,0.06);
                }
                .mkt-loader-shimmer-fill {
                    width:40%; height:100%; border-radius:3px;
                    background:linear-gradient(90deg, transparent, #3b82f6, #f97316, transparent);
                    animation: mkt-shimmer 1.4s ease-in-out infinite;
                }
                .mkt-loader-text {
                    color:rgba(30,41,59,0.45); font-size:11px; font-weight:600;
                    font-family:'Inter',sans-serif; letter-spacing:3px; text-transform:uppercase;
                    animation: mkt-fadeInOut 2s ease-in-out infinite;
                }
                .mkt-loader-orb {
                    position:absolute; border-radius:50%; pointer-events:none; filter:blur(60px);
                    animation: mkt-orbFloat 6s ease-in-out infinite;
                }
                @keyframes mkt-breathe { 0%,100%{transform:scale(1);opacity:0.85} 50%{transform:scale(1.04);opacity:1} }
                @keyframes mkt-shimmer { 0%{transform:translateX(-300%)} 100%{transform:translateX(400%)} }
                @keyframes mkt-fadeInOut { 0%,100%{opacity:0.25} 50%{opacity:0.6} }
                @keyframes mkt-orbFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-20px)} }
            `}</style>
            {/* Ambient background orbs */}
            <div className="mkt-loader-orb" style={{
                width: '300px', height: '300px', top: '-80px', left: '-80px',
                background: 'rgba(59,130,246,0.08)'
            }} />
            <div className="mkt-loader-orb" style={{
                width: '250px', height: '250px', bottom: '-60px', right: '-60px',
                background: 'rgba(249,115,22,0.06)', animationDelay: '3s'
            }} />
            <div className="mkt-loader-wrap">
                <div className="mkt-loader-icon">
                    <div className="mkt-loader-spinner" />
                </div>
                <div className="mkt-loader-shimmer">
                    <div className="mkt-loader-shimmer-fill" />
                </div>
                <div className="mkt-loader-text">Preparing Video</div>
            </div>
        </div>
    )
}

// ============================================================
// VIDEO BUFFER INDICATOR
// ============================================================
function BufferIndicator({ videoRef, playing }) {
    const [buffering, setBuffering] = useState(false)

    useEffect(() => {
        const v = videoRef?.current
        if (!v) return
        const onWaiting = () => setBuffering(true)
        const onPlaying = () => setBuffering(false)
        const onCanPlay = () => setBuffering(false)
        v.addEventListener('waiting', onWaiting)
        v.addEventListener('playing', onPlaying)
        v.addEventListener('canplay', onCanPlay)
        return () => {
            v.removeEventListener('waiting', onWaiting)
            v.removeEventListener('playing', onPlaying)
            v.removeEventListener('canplay', onCanPlay)
        }
    }, [videoRef])

    if (!buffering || !playing) return null

    return (
        <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 15, pointerEvents: 'none'
        }}>
            <style>{`
                .mkt-buffer-ring {
                    width: 48px; height: 48px; border: 3px solid rgba(59,130,246,0.15);
                    border-top-color: #3b82f6; border-radius: 50%;
                    animation: mkt-spin 0.7s linear infinite;
                }
            `}</style>
            <div className="mkt-buffer-ring" />
        </div>
    )
}

// ============================================================
// POST-VIDEO ANIMATION COMPONENTS — Website Theme Matched
// Colors: Blue #3b82f6, Orange #f97316, White backgrounds
// Fonts: Inter, Poppins — matching the main landing page
// ============================================================

const ANIM_SHARED_CSS = `
    .mkt-anim-wrap {
        position:fixed; inset:0; z-index:99999; overflow:hidden;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .mkt-anim-bg-white {
        background: linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%);
    }
    .mkt-anim-glow-tl {
        position:absolute; top:-150px; left:-150px; width:500px; height:500px;
        background:radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%);
        pointer-events:none; animation: mkt-a-pulse 4s ease-in-out infinite;
    }
    .mkt-anim-glow-br {
        position:absolute; bottom:-150px; right:-150px; width:450px; height:450px;
        background:radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 60%);
        pointer-events:none; animation: mkt-a-pulse 5s ease-in-out infinite reverse;
    }
    .mkt-a-glass {
        background: rgba(255,255,255,0.9); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
        border:1px solid rgba(0,0,0,0.08); border-radius:24px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.06);
        padding:40px 48px; text-align:center; position:relative; z-index:2;
    }
    .mkt-a-gradient-text {
        background:linear-gradient(135deg, #3b82f6 0%, #f97316 100%);
        -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    }
    .mkt-a-title {
        font-family:'Poppins','Inter',sans-serif; font-size:clamp(24px,5vw,42px);
        font-weight:800; margin:0 0 8px; color:#1e293b; line-height:1.2;
    }
    .mkt-a-sub {
        font-size:clamp(14px,2.5vw,18px); color:#64748b; font-weight:500; margin:0;
    }
    .mkt-a-logo { width:72px; height:72px; border-radius:18px; object-fit:contain; margin:0 auto 20px; display:block; }
    .mkt-a-logo-fallback {
        width:72px; height:72px; border-radius:18px; margin:0 auto 20px;
        background:linear-gradient(135deg, #3b82f6, #f97316);
        display:flex; align-items:center; justify-content:center; font-size:32px;
        box-shadow: 0 8px 24px rgba(59,130,246,0.25);
    }
    @keyframes mkt-a-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.15)} }
    @keyframes mkt-a-fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes mkt-a-scaleIn { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
`

function ConfettiAnimation({ onComplete, siteInfo }) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 1800)
        return () => clearTimeout(timer)
    }, [onComplete])

    const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.2 + Math.random() * 1.8,
        color: ['#3b82f6', '#60a5fa', '#f97316', '#fb923c', '#06b6d4', '#2563eb', '#ea580c', '#93c5fd'][i % 8],
        size: 5 + Math.random() * 7,
        rotation: Math.random() * 720,
        sway: -30 + Math.random() * 60
    }))

    const siteName = siteInfo?.name || ''

    return (
        <div className="mkt-anim-wrap mkt-anim-bg-white">
            <style>{`
                ${ANIM_SHARED_CSS}
                .mkt-confetti-p {
                    position:absolute; border-radius:3px; opacity:0;
                    animation: mkt-confettiFall var(--dur) cubic-bezier(0.25,0.46,0.45,0.94) var(--delay) forwards;
                }
                @keyframes mkt-confettiFall {
                    0% { transform:translateY(-100vh) translateX(0) rotate(0deg); opacity:1; }
                    25% { opacity:1; }
                    100% { transform:translateY(100vh) translateX(var(--sway)) rotate(var(--rot)); opacity:0; }
                }
                .mkt-a-confetti-card { animation: mkt-a-scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both; }
            `}</style>
            <div className="mkt-anim-glow-tl" />
            <div className="mkt-anim-glow-br" />
            {particles.map(p => (
                <div key={p.id} className="mkt-confetti-p" style={{
                    left: `${p.left}%`, width: `${p.size}px`, height: `${p.size * 1.6}px`,
                    background: p.color, '--delay': `${p.delay}s`, '--dur': `${p.duration}s`,
                    '--rot': `${p.rotation}deg`, '--sway': `${p.sway}px`
                }} />
            ))}
            <div className="mkt-a-glass mkt-a-confetti-card">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h2 className="mkt-a-title">Thank <span className="mkt-a-gradient-text">You!</span></h2>
                <p className="mkt-a-sub">{siteName ? `Welcome to ${siteName}` : 'Redirecting you now...'}</p>
            </div>
        </div>
    )
}

function LogoAnimation({ onComplete, siteInfo }) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 1600)
        return () => clearTimeout(timer)
    }, [onComplete])

    const logoUrl = siteInfo?.logo?.url || siteInfo?.logo || ''
    const siteName = siteInfo?.name || ''

    return (
        <div className="mkt-anim-wrap mkt-anim-bg-white">
            <style>{`
                ${ANIM_SHARED_CSS}
                .mkt-logo-card { animation: mkt-a-scaleIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both; }
                .mkt-logo-ring {
                    position:absolute; border-radius:50%;
                    border:1.5px solid rgba(59,130,246,0.12);
                    animation: mkt-logo-ringPulse 2s ease-in-out infinite;
                    pointer-events:none;
                }
                .mkt-logo-ring:nth-child(2) { animation-delay:0.6s; }
                .mkt-logo-ring:nth-child(3) { animation-delay:1.2s; }
                @keyframes mkt-logo-ringPulse {
                    0% { transform:translate(-50%,-50%) scale(0.8); opacity:0.6; }
                    100% { transform:translate(-50%,-50%) scale(2.5); opacity:0; }
                }
            `}</style>
            <div className="mkt-anim-glow-tl" />
            <div className="mkt-anim-glow-br" />
            {/* Pulsing rings behind card */}
            {[160, 200, 250].map((size, i) => (
                <div key={i} className="mkt-logo-ring" style={{
                    width: `${size}px`, height: `${size}px`,
                    top: '50%', left: '50%', transform: 'translate(-50%,-50%)'
                }} />
            ))}
            <div className="mkt-a-glass mkt-logo-card">
                {logoUrl ? (
                    <img className="mkt-a-logo" src={logoUrl} alt={siteName} style={{
                        background: 'rgba(59,130,246,0.05)', padding: '8px',
                        border: '1px solid rgba(59,130,246,0.1)'
                    }} />
                ) : (
                    <div className="mkt-a-logo-fallback"><span style={{ filter: 'brightness(10)' }}>⭐</span></div>
                )}
                <h2 className="mkt-a-title"><span className="mkt-a-gradient-text">{siteName || 'Thank You'}</span></h2>
                <p className="mkt-a-sub">Thank you for watching</p>
            </div>
        </div>
    )
}

function RippleAnimation({ onComplete, siteInfo }) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 1600)
        return () => clearTimeout(timer)
    }, [onComplete])

    const siteName = siteInfo?.name || ''

    return (
        <div className="mkt-anim-wrap mkt-anim-bg-white">
            <style>{`
                ${ANIM_SHARED_CSS}
                .mkt-ripple-ring {
                    position:absolute; top:50%; left:50%;
                    border-radius:50%; border:2px solid transparent;
                    transform:translate(-50%,-50%) scale(0);
                    pointer-events:none;
                    animation: mkt-rippleExpand var(--dur) ease-out var(--delay) infinite;
                }
                @keyframes mkt-rippleExpand {
                    0% { transform:translate(-50%,-50%) scale(0); opacity:0.8; }
                    100% { transform:translate(-50%,-50%) scale(1); opacity:0; }
                }
                .mkt-ripple-card { animation: mkt-a-scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s both; z-index:5; }
            `}</style>
            <div className="mkt-anim-glow-tl" />
            <div className="mkt-anim-glow-br" />
            {[0, 0.4, 0.8, 1.2, 1.6].map((delay, i) => {
                const size = 120 + i * 120
                const isBlue = i % 2 === 0
                return (
                    <div key={i} className="mkt-ripple-ring" style={{
                        width: `${size}px`, height: `${size}px`,
                        borderColor: isBlue ? 'rgba(59,130,246,0.25)' : 'rgba(249,115,22,0.2)',
                        boxShadow: isBlue
                            ? '0 0 20px rgba(59,130,246,0.08)'
                            : '0 0 20px rgba(249,115,22,0.06)',
                        '--dur': `${2 + i * 0.15}s`, '--delay': `${delay}s`
                    }} />
                )
            })}
            <div className="mkt-a-glass mkt-ripple-card">
                <div style={{ fontSize: '42px', marginBottom: '16px' }}>👋</div>
                <h2 className="mkt-a-title">See You <span className="mkt-a-gradient-text">Soon!</span></h2>
                <p className="mkt-a-sub">{siteName || 'Redirecting...'}</p>
            </div>
        </div>
    )
}

function ZoomAnimation({ onComplete, siteInfo }) {
    const [phase, setPhase] = useState('enter')

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('show'), 80)
        const t2 = setTimeout(() => setPhase('zoom-out'), 1100)
        const t3 = setTimeout(onComplete, 1500)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }, [onComplete])

    const logoUrl = siteInfo?.logo?.url || siteInfo?.logo || ''
    const siteName = siteInfo?.name || ''

    return (
        <div className="mkt-anim-wrap mkt-anim-bg-white">
            <style>{`
                ${ANIM_SHARED_CSS}
                .mkt-zoom-card {
                    transition: all 0.8s cubic-bezier(0.22,1,0.36,1);
                }
            `}</style>
            <div className="mkt-anim-glow-tl" />
            <div className="mkt-anim-glow-br" />
            <div className="mkt-a-glass mkt-zoom-card" style={{
                opacity: phase === 'enter' ? 0 : phase === 'zoom-out' ? 0 : 1,
                transform: phase === 'enter' ? 'scale(2.5)' :
                    phase === 'zoom-out' ? 'scale(0.6)' : 'scale(1)'
            }}>
                {logoUrl ? (
                    <img className="mkt-a-logo" src={logoUrl} alt={siteName} style={{
                        background: 'rgba(59,130,246,0.05)', padding: '8px',
                        border: '1px solid rgba(59,130,246,0.1)'
                    }} />
                ) : (
                    <div className="mkt-a-logo-fallback"><span style={{ filter: 'brightness(10)' }}>🎬</span></div>
                )}
                <h2 className="mkt-a-title">Thanks for <span className="mkt-a-gradient-text">watching!</span></h2>
                <p className="mkt-a-sub">{siteName || 'Taking you to our website...'}</p>
            </div>
        </div>
    )
}

function CinematicAnimation({ onComplete }) {
    const [phase, setPhase] = useState('idle')
    const particlesRef = useRef(null)

    useEffect(() => {
        const timeline = async () => {
            const wait = ms => new Promise(r => setTimeout(r, ms))

            setPhase('flash-in')
            await wait(40)
            setPhase('flash-out')
            await wait(60)
            setPhase('blades-in')
            await wait(250)
            setPhase('particles')
            spawnParticles()
            await wait(300)
            setPhase('blades-out')
            await wait(200)
            setPhase('done')
            await wait(150)
            onComplete()
        }
        timeline()
    }, [onComplete])

    const spawnParticles = () => {
        const container = particlesRef.current
        if (!container) return
        container.innerHTML = ''
        const colors = ['#3b82f6', '#60a5fa', '#f97316', '#fb923c', '#06b6d4', '#2563eb']
        for (let i = 0; i < 45; i++) {
            const p = document.createElement('div')
            const size = 3 + Math.random() * 5
            const angle = (i / 45) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
            const dist = 100 + Math.random() * 300
            const tx = Math.cos(angle) * dist
            const ty = Math.sin(angle) * dist
            const color = colors[Math.floor(Math.random() * colors.length)]
            p.style.cssText = `
                position:absolute; border-radius:50%; width:${size}px; height:${size}px;
                left:50%; top:50%; background:${color}; opacity:0;
                box-shadow: 0 0 ${size * 3}px ${color}60;
            `
            container.appendChild(p)
            setTimeout(() => {
                p.style.opacity = '1'
                p.style.transition = `transform ${0.4 + Math.random() * 0.4}s cubic-bezier(0.1,0.9,0.3,1), opacity 0.3s ease ${0.2 + Math.random() * 0.25}s`
                p.style.transform = `translate(calc(${tx}px - 50%), calc(${ty}px - 50%))`
                setTimeout(() => { p.style.opacity = '0' }, 400)
            }, Math.random() * 120)
        }
    }

    const BLADE_COUNT = 6

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'linear-gradient(180deg, #f8fafc, #ffffff, #f1f5f9)',
            opacity: phase === 'done' ? 0 : 1,
            transition: 'opacity 0.25s ease'
        }}>
            <style>{`
                .mkt-cin2-flash {
                    position:fixed; inset:0; z-index:90;
                    background:linear-gradient(135deg, rgba(59,130,246,0.15), rgba(249,115,22,0.1));
                    pointer-events:none;
                }
                .mkt-cin2-blades { position:fixed; inset:0; z-index:80; display:flex; flex-direction:column; pointer-events:none; }
                .mkt-cin2-blade { flex:1; background:linear-gradient(135deg, #f8fafc, #ffffff); transform:scaleX(0); transform-origin:left center; }
                .mkt-cin2-particles { position:fixed; inset:0; z-index:85; pointer-events:none; overflow:hidden; }
            `}</style>

            {/* Ambient glows */}
            <div style={{
                position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 60%)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', bottom: '-100px', right: '-100px', width: '350px', height: '350px',
                background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 60%)',
                pointerEvents: 'none'
            }} />

            {/* Flash */}
            <div className="mkt-cin2-flash" style={{
                opacity: phase === 'flash-in' ? 1 : 0,
                transition: phase === 'flash-in' ? 'opacity 0.06s ease' : 'opacity 0.2s ease'
            }} />

            {/* Blades */}
            <div className="mkt-cin2-blades">
                {Array.from({ length: BLADE_COUNT }, (_, i) => (
                    <div key={i} className="mkt-cin2-blade" style={{
                        transform: ['blades-in', 'particles'].includes(phase) ? 'scaleX(1)' : 'scaleX(0)',
                        transformOrigin: phase === 'blades-out' ? 'right center' : 'left center',
                        transition: `transform 0.35s cubic-bezier(0.77,0,0.18,1) ${i * 0.03}s`,
                        borderBottom: i < BLADE_COUNT - 1 ? '1px solid rgba(59,130,246,0.06)' : 'none'
                    }} />
                ))}
            </div>

            {/* Particles */}
            <div className="mkt-cin2-particles" ref={particlesRef} />

        </div>
    )
}

function WaterdropAnimation({ onComplete }) {
    const [phase, setPhase] = useState('idle')
    const canvasRef = useRef(null)

    useEffect(() => {
        const timeline = async () => {
            const wait = ms => new Promise(r => setTimeout(r, ms))
            setPhase('impact')
            await wait(40)
            setPhase('ripples')
            await wait(250)
            setPhase('droplets')
            await wait(200)
            setPhase('glow')
            await wait(180)
            setPhase('fadeout')
            await wait(200)
            onComplete()
        }
        timeline()
    }, [onComplete])

    useEffect(() => {
        if (phase !== 'droplets' && phase !== 'glow' && phase !== 'fadeout') return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        const cx = canvas.width / 2
        const cy = canvas.height / 2

        const drops = Array.from({ length: 35 }, () => {
            const angle = Math.random() * Math.PI * 2
            const speed = 3 + Math.random() * 5
            const size = 2 + Math.random() * 3.5
            const colors = ['#3b82f6', '#60a5fa', '#f97316', '#fb923c', '#06b6d4', '#93c5fd']
            return {
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                gravity: 0.08 + Math.random() * 0.04
            }
        })

        let animId
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            drops.forEach(d => {
                d.x += d.vx
                d.y += d.vy
                d.vy += d.gravity
                d.alpha -= 0.014
                if (d.alpha <= 0) return
                ctx.beginPath()
                ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2)
                ctx.fillStyle = d.color + Math.round(d.alpha * 255).toString(16).padStart(2, '0')
                ctx.shadowColor = d.color
                ctx.shadowBlur = d.size * 3
                ctx.fill()
                ctx.shadowBlur = 0
            })
            animId = requestAnimationFrame(animate)
        }
        animate()
        return () => cancelAnimationFrame(animId)
    }, [phase])

    const RING_COUNT = 5

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
            opacity: phase === 'fadeout' ? 0 : 1,
            transition: 'opacity 0.35s ease'
        }}>
            <style>{`
                .mkt-wd2-impact {
                    position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
                    width:12px; height:12px; border-radius:50%;
                    background:radial-gradient(circle, #60a5fa, #3b82f6);
                    box-shadow: 0 0 24px #3b82f6, 0 0 48px rgba(59,130,246,0.3);
                    z-index:10;
                }
                .mkt-wd2-ring {
                    position:fixed; top:50%; left:50%;
                    border-radius:50%; border:2px solid transparent;
                    transform:translate(-50%,-50%) scale(0);
                    pointer-events:none;
                }
                .mkt-wd2-ring-active {
                    animation: mkt-wd2-expand var(--dur) cubic-bezier(0.22,1,0.36,1) var(--delay) forwards;
                }
                @keyframes mkt-wd2-expand {
                    0% { transform:translate(-50%,-50%) scale(0); opacity:0.8; }
                    50% { opacity:0.4; }
                    100% { transform:translate(-50%,-50%) scale(1); opacity:0; }
                }
                .mkt-wd2-glow-pulse {
                    position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
                    width:200px; height:200px; border-radius:50%;
                    background:radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(249,115,22,0.06) 40%, transparent 70%);
                    pointer-events:none;
                    animation: mkt-wd2-pulse 0.8s ease-in-out;
                }
                @keyframes mkt-wd2-pulse {
                    0% { transform:translate(-50%,-50%) scale(0.5); opacity:0; }
                    50% { transform:translate(-50%,-50%) scale(2.5); opacity:1; }
                    100% { transform:translate(-50%,-50%) scale(3.5); opacity:0; }
                }
                .mkt-wd2-canvas { position:fixed; inset:0; z-index:5; pointer-events:none; }
            `}</style>

            {/* Ambient glows */}
            <div style={{
                position: 'absolute', top: '-100px', left: '-100px', width: '350px', height: '350px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', bottom: '-100px', right: '-100px', width: '300px', height: '300px',
                background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 65%)',
                pointerEvents: 'none'
            }} />

            {/* Central impact dot */}
            {(phase === 'impact' || phase === 'ripples') && (
                <div className="mkt-wd2-impact" style={{
                    transform: `translate(-50%,-50%) scale(${phase === 'impact' ? 1.5 : 0.3})`,
                    opacity: phase === 'ripples' ? 0 : 1,
                    transition: 'all 0.2s ease'
                }} />
            )}

            {/* Concentric ripple rings */}
            {['ripples', 'droplets', 'glow'].includes(phase) && (
                Array.from({ length: RING_COUNT }, (_, i) => {
                    const size = 70 + i * 120
                    const isBlue = i % 2 === 0
                    const borderW = Math.max(1, 2.5 - i * 0.4)
                    return (
                        <div key={i}
                            className="mkt-wd2-ring mkt-wd2-ring-active"
                            style={{
                                width: `${size}px`, height: `${size}px`,
                                borderColor: isBlue ? `rgba(59,130,246,${0.4 - i * 0.06})` : `rgba(249,115,22,${0.35 - i * 0.05})`,
                                borderWidth: `${borderW}px`,
                                boxShadow: isBlue
                                    ? `0 0 ${10 + i * 4}px rgba(59,130,246,${0.12 - i * 0.02})`
                                    : `0 0 ${10 + i * 4}px rgba(249,115,22,${0.1 - i * 0.015})`,
                                '--dur': `${0.55 + i * 0.1}s`,
                                '--delay': `${i * 0.07}s`
                            }}
                        />
                    )
                })
            )}

            {/* Center glow pulse */}
            {(phase === 'glow' || phase === 'droplets') && (
                <div className={`mkt-wd2-glow-pulse`} />
            )}

            {/* Canvas droplet particles */}
            <canvas ref={canvasRef} className="mkt-wd2-canvas" />

        </div>
    )
}

const ANIMATIONS = {
    confetti: ConfettiAnimation,
    logo: LogoAnimation,
    ripple: RippleAnimation,
    zoom: ZoomAnimation,
    cinematic: CinematicAnimation,
    waterdrop: WaterdropAnimation
}

// ============================================================
// HELPER: Extract YouTube / Vimeo embed URL
// ============================================================
function getEmbedUrl(source, type) {
    if (type === 'youtube') {
        const match = source?.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
        return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&iv_load_policy=3&loop=0` : null
    }
    if (type === 'vimeo') {
        const match = source?.match(/vimeo\.com\/(\d+)/)
        return match ? `https://player.vimeo.com/video/${match[1]}?autoplay=1&controls=0&title=0&byline=0&portrait=0` : null
    }
    return null
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function QrVideoPage() {
    const { id } = useParams()
    const videoRef = useRef(null)

    const [video, setVideo] = useState(null)
    const [siteInfo, setSiteInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [showAnimation, setShowAnimation] = useState(false)
    const [showControls, setShowControls] = useState(true)
    const [showCrossfade, setShowCrossfade] = useState(false)
    const [preloadStarted, setPreloadStarted] = useState(false)
    const [isMuted, setIsMuted] = useState(true) // Start muted for autoplay compliance

    // ---- Fetch video data, site settings & log scan ----
    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const [videoRes, settingsRes] = await Promise.all([
                    axios.get(`${API_URL}/marketing/qr/${id}`),
                    axios.get(`${API_URL}/settings/public`).catch(() => ({ data: { data: null } })),
                    axios.post(`${API_URL}/marketing/qr/${id}/scan`).catch(() => { }) // silent analytics
                ])
                if (videoRes.data.success) {
                    setVideo(videoRes.data.data)
                    // Start preloading after a short delay to prioritize video
                    setPreloadStarted(true)
                } else {
                    setError('Video not found')
                }
                if (settingsRes?.data?.data?.siteInfo) {
                    setSiteInfo(settingsRes.data.data.siteInfo)
                }
            } catch (err) {
                setError('Video not available')
            } finally {
                setLoading(false)
            }
        }
        fetchVideo()
    }, [id])

    // ---- Disable back button ----
    useEffect(() => {
        window.history.pushState(null, '', window.location.href)
        window.history.pushState(null, '', window.location.href)

        const handlePopState = (e) => {
            e.preventDefault()
            window.history.pushState(null, '', window.location.href)
        }

        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [])

    // ---- Auto-hide controls after 3s of inactivity ----
    useEffect(() => {
        let timer
        const show = () => {
            setShowControls(true)
            clearTimeout(timer)
            timer = setTimeout(() => setShowControls(false), 3000)
        }
        window.addEventListener('mousemove', show)
        window.addEventListener('touchstart', show)
        show()
        return () => {
            window.removeEventListener('mousemove', show)
            window.removeEventListener('touchstart', show)
            clearTimeout(timer)
        }
    }, [])

    // ---- Video event handlers ----
    const handleTimeUpdate = () => {
        const v = videoRef.current
        if (v && v.duration) {
            setProgress((v.currentTime / v.duration) * 100)
        }
    }

    const handleVideoEnd = useCallback(async () => {
        try {
            await axios.post(`${API_URL}/marketing/qr/${id}/complete`)
        } catch (e) { /* silent */ }
        setShowAnimation(true)
    }, [id])

    // Crossfade redirect instead of hard navigate
    const handleAnimationComplete = useCallback(() => {
        setShowCrossfade(true)
    }, [])

    const togglePlay = () => {
        const v = videoRef.current
        if (!v) return
        if (v.paused) {
            v.play().catch(() => { })
            setPlaying(true)
        } else {
            v.pause()
            setPlaying(false)
        }
    }

    // ---- Try fullscreen on mobile ----
    useEffect(() => {
        if (video && videoRef.current) {
            const tryFullscreen = () => {
                const el = document.documentElement
                if (el.requestFullscreen) el.requestFullscreen().catch(() => { })
                else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
            }
            const handler = () => {
                tryFullscreen()
                document.removeEventListener('click', handler)
                document.removeEventListener('touchstart', handler)
            }
            document.addEventListener('click', handler, { once: true })
            document.addEventListener('touchstart', handler, { once: true })
        }
    }, [video])

    // ---- Auto-play: start muted (always works), then try to unmute ----
    useEffect(() => {
        if (video && videoRef.current && video.videoType === 'upload') {
            const v = videoRef.current
            v.muted = true
            setIsMuted(true)
            v.play().then(() => {
                setPlaying(true)
                // Try to unmute — will succeed if user has interacted with the site before
                try {
                    v.muted = false
                    // If no error thrown, check if browser actually unmuted
                    if (!v.muted) {
                        setIsMuted(false)
                    }
                } catch (e) {
                    // Browser blocked unmute — keep muted, show sound button
                    v.muted = true
                }
            }).catch(() => {
                setPlaying(false)
            })
        }
    }, [video])

    // ---- Toggle mute/unmute via user interaction ----
    const toggleMute = useCallback(() => {
        const v = videoRef.current
        if (!v) return
        if (v.muted || isMuted) {
            v.muted = false
            setIsMuted(false)
        } else {
            v.muted = true
            setIsMuted(true)
        }
    }, [isMuted])

    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    // Crossfade overlay (renders on top of everything)
    if (showCrossfade) {
        return (
            <>
                <CrossfadeTransition targetUrl={video?.redirectUrl || '/'} />
                {showAnimation && (() => {
                    const AnimComponent = ANIMATIONS[video?.animationStyle] || ConfettiAnimation
                    return <AnimComponent onComplete={() => { }} siteInfo={siteInfo} />
                })()}
            </>
        )
    }

    if (loading) {
        return (
            <>
                <PreconnectHints />
                <PremiumLoader />
            </>
        )
    }

    if (error || !video) {
        return (
            <div style={styles.error}>
                <style>{baseCSS}</style>
                <div style={{
                    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '24px', padding: '48px 40px', textAlign: 'center',
                    maxWidth: '420px', margin: '0 20px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.06)'
                }}>
                    <div style={{ fontSize: '56px', marginBottom: '20px', filter: 'grayscale(0.3)' }}>📹</div>
                    <h1 style={{
                        fontFamily: "'Poppins','Inter',sans-serif", color: '#1e293b',
                        fontSize: '22px', fontWeight: '700', marginBottom: '10px', lineHeight: 1.3
                    }}>{error || 'Video Not Available'}</h1>
                    <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                        This video may have been removed or is currently inactive.
                    </p>
                    <a href="/" style={styles.homeLink}>Go to Homepage</a>
                </div>
            </div>
        )
    }

    // Post-video animation
    if (showAnimation) {
        const AnimComponent = ANIMATIONS[video.animationStyle] || ConfettiAnimation
        return (
            <>
                <AnimComponent onComplete={handleAnimationComplete} siteInfo={siteInfo} />
                {/* Keep preloader running through animation */}
                {preloadStarted && <HiddenPreloader url={video.redirectUrl || '/'} />}
            </>
        )
    }

    const isEmbed = video.videoType === 'youtube' || video.videoType === 'vimeo'
    const embedUrl = isEmbed ? getEmbedUrl(video.videoSource, video.videoType) : null

    return (
        <div style={styles.container}>
            <style>{baseCSS}</style>
            <PreconnectHints />

            {/* Hidden preloader — loads redirect target while video plays */}
            {preloadStarted && <HiddenPreloader url={video.redirectUrl || '/'} />}

            {/* OG Meta tags */}
            {video.title && <title>{video.title}</title>}

            {/* Video Layer */}
            {isEmbed ? (
                <div style={styles.embedContainer}>
                    <iframe
                        src={embedUrl}
                        style={styles.embedIframe}
                        allow="autoplay; fullscreen"
                        frameBorder="0"
                        title={video.title}
                    />
                    {/* Overlay to block native controls */}
                    <div style={styles.embedOverlay} onClick={togglePlay} />
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        src={video.videoSource}
                        style={styles.video}
                        playsInline
                        preload="auto"
                        muted={isMuted}
                        autoPlay
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnd}
                        onClick={togglePlay}
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                    />
                    <BufferIndicator videoRef={videoRef} playing={playing} />

                    {/* Floating sound toggle button */}
                    <style>{`
                        @keyframes mkt-soundPulse {
                            0%,100% { transform:scale(1); box-shadow:0 4px 24px rgba(59,130,246,0.15); }
                            50% { transform:scale(1.06); box-shadow:0 4px 32px rgba(59,130,246,0.3); }
                        }
                    `}</style>
                    {isMuted && playing && (
                        <button onClick={toggleMute} style={{
                            position: 'fixed', bottom: '28px', right: '28px', zIndex: 20,
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(59,130,246,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.3s ease',
                            boxShadow: '0 4px 24px rgba(59,130,246,0.15)',
                            animation: 'mkt-soundPulse 2.5s ease-in-out infinite'
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#3b82f6" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                            </svg>
                        </button>
                    )}

                    {/* Sound ON indicator */}
                    {!isMuted && playing && (
                        <button onClick={toggleMute} style={{
                            position: 'fixed', bottom: '28px', right: '28px', zIndex: 20,
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(59,130,246,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', opacity: showControls ? 0.9 : 0,
                            transition: 'opacity 0.3s ease',
                            boxShadow: '0 4px 20px rgba(59,130,246,0.1)'
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#3b82f6" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                        </button>
                    )}
                </>
            )}

            {/* Custom Controls Overlay */}
            <div style={{ ...styles.controlsOverlay, opacity: showControls ? 1 : 0 }}>
                {/* Title pill */}
                <div style={styles.titleBar}>
                    <div style={styles.titlePill}>
                        <div style={styles.titleDot} />
                        <h1 style={styles.videoTitle}>{video.title}</h1>
                    </div>
                </div>

                {/* Center Play/Pause button */}
                <button onClick={togglePlay} style={styles.playBtn}>
                    <div style={styles.playBtnInner}>
                        {playing ? (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="#3b82f6">
                                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                                <rect x="14" y="4" width="4" height="16" rx="1.5" />
                            </svg>
                        ) : (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="#3b82f6">
                                <polygon points="6,3 20,12 6,21" />
                            </svg>
                        )}
                    </div>
                </button>

                {/* Premium progress bar */}
                {!isEmbed && (
                    <div style={styles.progressWrap}>
                        <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                            <div style={{ ...styles.progressGlow, left: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================
// STYLES
// ============================================================
const baseCSS = `
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { background:#ffffff; overflow:hidden; width:100%; height:100%; }
    @keyframes mkt-spin { to{transform:rotate(360deg)} }
`

const styles = {
    container: {
        position: 'fixed', inset: 0,
        background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    loading: {
        position: 'fixed', inset: 0,
        background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
        overflow: 'hidden'
    },
    error: {
        position: 'fixed', inset: 0,
        background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
        fontFamily: "'Inter', sans-serif", padding: '20px'
    },
    homeLink: {
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '12px 28px',
        background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
        color: '#fff', textDecoration: 'none',
        borderRadius: '14px', fontWeight: '600', fontSize: '14px',
        boxShadow: '0 4px 20px rgba(59,130,246,0.25)',
        transition: 'all 0.3s ease'
    },
    video: {
        width: '100%', height: '100%', objectFit: 'contain',
        background: '#ffffff'
    },
    embedContainer: {
        position: 'relative', width: '100%', height: '100%'
    },
    embedIframe: {
        width: '100%', height: '100%', border: 'none'
    },
    embedOverlay: {
        position: 'absolute', inset: 0, zIndex: 2, cursor: 'pointer'
    },
    controlsOverlay: {
        position: 'fixed', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        pointerEvents: 'none',
        transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)'
    },
    titleBar: {
        padding: '24px 28px',
        background: 'transparent',
        pointerEvents: 'auto'
    },
    titlePill: {
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        padding: '8px 18px 8px 14px',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '100px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
    },
    titleDot: {
        width: '8px', height: '8px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6, #f97316)',
        boxShadow: '0 0 8px rgba(59,130,246,0.3)',
        flexShrink: 0
    },
    videoTitle: {
        color: '#1e293b', fontSize: 'clamp(13px, 2.5vw, 16px)', fontWeight: '600',
        fontFamily: "'Poppins','Inter',sans-serif",
        margin: 0, letterSpacing: '0.01em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: '70vw'
    },
    playBtn: {
        alignSelf: 'center',
        background: 'transparent',
        border: 'none', borderRadius: '50%',
        width: '88px', height: '88px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', pointerEvents: 'auto',
        padding: 0, position: 'relative'
    },
    playBtnInner: {
        width: '72px', height: '72px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(59,130,246,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(59,130,246,0.12), inset 0 0 0 1px rgba(255,255,255,0.5)',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)'
    },
    progressWrap: {
        padding: '0 20px 16px',
        pointerEvents: 'none'
    },
    progressBar: {
        width: '100%', height: '3px', borderRadius: '3px',
        background: 'rgba(0,0,0,0.08)',
        position: 'relative', overflow: 'visible'
    },
    progressFill: {
        height: '100%', borderRadius: '3px',
        background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #f97316)',
        transition: 'width 0.3s linear',
        position: 'relative'
    },
    progressGlow: {
        position: 'absolute', top: '-3px',
        width: '8px', height: '8px', borderRadius: '50%',
        background: '#3b82f6',
        boxShadow: '0 0 12px rgba(59,130,246,0.5)',
        transform: 'translateX(-50%)',
        transition: 'left 0.3s linear'
    }
}
