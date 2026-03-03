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
    const [phase, setPhase] = useState('enter') // enter -> hold -> navigate

    useEffect(() => {
        onStart?.()
        // Phase 1: Fade in white overlay
        const t1 = setTimeout(() => setPhase('hold'), 600)
        // Phase 2: Navigate after overlay is opaque
        const t2 = setTimeout(() => {
            window.location.href = targetUrl || '/'
        }, 900)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [targetUrl, onStart])

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 999999,
            background: '#fff',
            opacity: phase === 'enter' ? 0 : 1,
            transition: 'opacity 0.6s ease-in-out',
            pointerEvents: 'all'
        }} />
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
                .mkt-qr-loader {
                    display: flex; flex-direction: column; align-items: center; gap: 24px;
                }
                .mkt-qr-logo-pulse {
                    width: 72px; height: 72px; border-radius: 20px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                    display: flex; align-items: center; justify-content: center;
                    animation: mkt-breathe 2s ease-in-out infinite;
                    backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
                }
                .mkt-qr-shimmer-bar {
                    width: 200px; height: 4px; border-radius: 4px; overflow: hidden;
                    background: rgba(255,255,255,0.1);
                }
                .mkt-qr-shimmer-fill {
                    width: 40%; height: 100%; border-radius: 4px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    animation: mkt-shimmer 1.5s ease-in-out infinite;
                }
                .mkt-qr-loading-text {
                    color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 500;
                    font-family: 'Inter', sans-serif; letter-spacing: 1px;
                    animation: mkt-fadeInOut 2s ease-in-out infinite;
                }
                @keyframes mkt-breathe { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.05);opacity:1} }
                @keyframes mkt-shimmer { 0%{transform:translateX(-200%)} 100%{transform:translateX(400%)} }
                @keyframes mkt-fadeInOut { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
            `}</style>
            <div className="mkt-qr-loader">
                <div className="mkt-qr-logo-pulse">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
                        <polygon points="5,3 19,12 5,21" />
                    </svg>
                </div>
                <div className="mkt-qr-shimmer-bar">
                    <div className="mkt-qr-shimmer-fill" />
                </div>
                <div className="mkt-qr-loading-text">LOADING</div>
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
                    width: 48px; height: 48px; border: 3px solid rgba(255,255,255,0.15);
                    border-top-color: rgba(255,255,255,0.8); border-radius: 50%;
                    animation: mkt-spin 0.7s linear infinite;
                }
            `}</style>
            <div className="mkt-buffer-ring" />
        </div>
    )
}

// ============================================================
// POST-VIDEO ANIMATION COMPONENTS
// ============================================================

function ConfettiAnimation({ onComplete, siteInfo }) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 4000)
        return () => clearTimeout(timer)
    }, [onComplete])

    const particles = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: 2 + Math.random() * 2,
        color: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b6b', '#ee5a24', '#a29bfe', '#fd79a8'][i % 8],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360
    }))

    const siteName = siteInfo?.name || ''

    return (
        <div className="mkt-anim-container">
            <style>{`
                .mkt-anim-container { position:fixed; inset:0; background:rgba(0,0,0,0.9); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:99999; overflow:hidden; }
                .mkt-anim-text { color:#fff; font-size:clamp(24px,5vw,48px); font-weight:800; text-align:center; animation:mkt-fadeUp 1s ease-out; font-family:'Inter',sans-serif; }
                .mkt-anim-subtext { color:rgba(255,255,255,0.6); font-size:clamp(14px,2.5vw,20px); font-weight:500; text-align:center; animation:mkt-fadeUp 1s ease-out 0.3s both; font-family:'Inter',sans-serif; margin-top:8px; }
                .mkt-confetti { position:absolute; border-radius:2px; animation:mkt-confettiFall var(--dur) ease-in var(--delay) forwards; opacity:0; }
                @keyframes mkt-confettiFall { 0%{transform:translateY(-100vh) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(var(--rot));opacity:0} }
                @keyframes mkt-fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
            `}</style>
            {particles.map(p => (
                <div key={p.id} className="mkt-confetti" style={{
                    left: `${p.left}%`, width: `${p.size}px`, height: `${p.size * 1.5}px`,
                    background: p.color, '--delay': `${p.delay}s`, '--dur': `${p.duration}s`, '--rot': `${p.rotation}deg`
                }} />
            ))}
            <div className="mkt-anim-text">🎉 Thank You!</div>
            {siteName && <div className="mkt-anim-subtext">{siteName}</div>}
        </div>
    )
}

function LogoAnimation({ onComplete, siteInfo }) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3500)
        return () => clearTimeout(timer)
    }, [onComplete])

    const logoUrl = siteInfo?.logo?.url || siteInfo?.logo || ''
    const siteName = siteInfo?.name || ''

    return (
        <div className="mkt-anim-container">
            <style>{`
                .mkt-anim-container { position:fixed; inset:0; background:linear-gradient(135deg,#0f0c29,#302b63,#24243e); display:flex; align-items:center; justify-content:center; z-index:99999; }
                .mkt-logo-reveal { animation:mkt-logoReveal 2s cubic-bezier(0.19,1,0.22,1) forwards; opacity:0; transform:scale(0.3); text-align:center; }
                .mkt-logo-img { width:120px; height:120px; border-radius:24px; object-fit:contain; display:block; margin:0 auto 20px; filter:drop-shadow(0 0 30px rgba(255,255,255,0.3)); background:rgba(255,255,255,0.1); padding:12px; }
                .mkt-logo-fallback { font-size:80px; display:block; margin-bottom:20px; filter:drop-shadow(0 0 30px rgba(255,215,0,0.6)); }
                .mkt-logo-text { color:#fff; font-size:clamp(20px,4vw,36px); font-weight:700; font-family:'Inter',sans-serif; letter-spacing:2px; }
                .mkt-logo-subtitle { color:rgba(255,255,255,0.6); font-size:clamp(14px,2.5vw,18px); font-weight:500; font-family:'Inter',sans-serif; margin-top:8px; }
                .mkt-logo-glow { position:absolute; width:300px; height:300px; border-radius:50%; background:radial-gradient(circle,rgba(99,102,241,0.3),transparent 70%); animation:mkt-pulse 2s ease-in-out infinite; }
                @keyframes mkt-logoReveal { 0%{opacity:0;transform:scale(0.3)} 50%{opacity:1} 100%{opacity:1;transform:scale(1)} }
                @keyframes mkt-pulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.3);opacity:0.8} }
            `}</style>
            <div className="mkt-logo-glow" />
            <div className="mkt-logo-reveal">
                {logoUrl ? (
                    <img className="mkt-logo-img" src={logoUrl} alt={siteName} />
                ) : (
                    <span className="mkt-logo-fallback">⭐</span>
                )}
                <div className="mkt-logo-text">{siteName || 'Thank You'}</div>
                <div className="mkt-logo-subtitle">Thank You For Watching</div>
            </div>
        </div>
    )
}

function RippleAnimation({ onComplete, siteInfo }) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3500)
        return () => clearTimeout(timer)
    }, [onComplete])

    const siteName = siteInfo?.name || ''

    return (
        <div className="mkt-anim-container">
            <style>{`
                .mkt-anim-container { position:fixed; inset:0; background:#0a0a0a; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:99999; overflow:hidden; }
                .mkt-ripple { position:absolute; border:2px solid rgba(99,102,241,0.6); border-radius:50%; animation:mkt-rippleExpand var(--dur) ease-out var(--delay) infinite; }
                .mkt-ripple-text { color:#fff; font-size:clamp(20px,4vw,40px); font-weight:700; z-index:1; animation:mkt-fadeUp 1s ease-out 0.5s both; font-family:'Inter',sans-serif; }
                .mkt-ripple-sub { color:rgba(255,255,255,0.5); font-size:clamp(14px,2vw,18px); z-index:1; animation:mkt-fadeUp 1s ease-out 0.8s both; font-family:'Inter',sans-serif; margin-top:8px; }
                @keyframes mkt-rippleExpand { 0%{width:0;height:0;opacity:1} 100%{width:600px;height:600px;opacity:0} }
                @keyframes mkt-fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
            `}</style>
            {[0, 0.5, 1, 1.5, 2].map((delay, i) => (
                <div key={i} className="mkt-ripple" style={{ '--delay': `${delay}s`, '--dur': '2.5s' }} />
            ))}
            <div className="mkt-ripple-text">🌊 See You Soon!</div>
            {siteName && <div className="mkt-ripple-sub">{siteName}</div>}
        </div>
    )
}

function ZoomAnimation({ onComplete, siteInfo }) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3000)
        return () => clearTimeout(timer)
    }, [onComplete])

    const logoUrl = siteInfo?.logo?.url || siteInfo?.logo || ''
    const siteName = siteInfo?.name || ''

    return (
        <div className="mkt-anim-container">
            <style>{`
                .mkt-anim-container { position:fixed; inset:0; background:#000; display:flex; align-items:center; justify-content:center; z-index:99999; }
                .mkt-zoom-content { animation:mkt-zoomOut 2.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards; text-align:center; }
                .mkt-zoom-logo { width:80px; height:80px; border-radius:16px; object-fit:contain; display:block; margin:0 auto 16px; }
                .mkt-zoom-emoji { font-size:100px; display:block; margin-bottom:20px; }
                .mkt-zoom-text { color:#fff; font-size:clamp(18px,3vw,32px); font-weight:600; font-family:'Inter',sans-serif; }
                .mkt-zoom-sub { color:rgba(255,255,255,0.5); font-size:clamp(12px,2vw,16px); font-family:'Inter',sans-serif; margin-top:6px; }
                @keyframes mkt-zoomOut { 0%{transform:scale(3);opacity:0} 40%{transform:scale(1);opacity:1} 80%{transform:scale(1);opacity:1} 100%{transform:scale(0.5);opacity:0} }
            `}</style>
            <div className="mkt-zoom-content">
                {logoUrl ? <img className="mkt-zoom-logo" src={logoUrl} alt={siteName} /> : <span className="mkt-zoom-emoji">🔍</span>}
                <div className="mkt-zoom-text">Thanks for watching!</div>
                {siteName && <div className="mkt-zoom-sub">{siteName}</div>}
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

            // 1. Flash
            setPhase('flash-in')
            await wait(80)
            setPhase('flash-out')
            await wait(120)

            // 2. Blades sweep in
            setPhase('blades-in')
            await wait(420)

            // 3. Radial ring expand
            setPhase('ring-expand')
            await wait(160)

            // 4. Particles burst
            setPhase('particles')
            spawnParticles()
            await wait(600)

            // 5. Blades sweep out
            setPhase('blades-out')
            await wait(400)

            // 6. Ring fade → redirect
            setPhase('done')
            await wait(300)
            onComplete()
        }
        timeline()
    }, [onComplete])

    const spawnParticles = () => {
        const container = particlesRef.current
        if (!container) return
        container.innerHTML = ''
        const colors = ['#3b82f6', '#60a5fa', '#f97316', '#fb923c', '#06b6d4', '#2563eb']
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div')
            const size = 3 + Math.random() * 6
            const angle = (i / 50) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
            const dist = 120 + Math.random() * 350
            const tx = Math.cos(angle) * dist
            const ty = Math.sin(angle) * dist
            const color = colors[Math.floor(Math.random() * colors.length)]
            p.style.cssText = `
                position:absolute; border-radius:50%; width:${size}px; height:${size}px;
                left:50%; top:50%; background:${color}; opacity:0;
                box-shadow: 0 0 ${size * 2}px ${color}80;
            `
            container.appendChild(p)
            setTimeout(() => {
                p.style.opacity = '1'
                p.style.transition = `transform ${0.5 + Math.random() * 0.4}s cubic-bezier(0.1,0.9,0.3,1), opacity 0.4s ease ${0.25 + Math.random() * 0.3}s`
                p.style.transform = `translate(calc(${tx}px - 50%), calc(${ty}px - 50%))`
                setTimeout(() => { p.style.opacity = '0' }, 450)
            }, Math.random() * 150)
        }
    }

    const BLADE_COUNT = 8

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#080808' }}>
            <style>{`
                .mkt-cin-flash { position:fixed; inset:0; z-index:90; background:#fff; pointer-events:none; }
                .mkt-cin-blades { position:fixed; inset:0; z-index:80; display:flex; flex-direction:column; pointer-events:none; }
                .mkt-cin-blade { flex:1; background:#080808; transform:scaleX(0); transform-origin:left center; }
                .mkt-cin-ring { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) scale(0); width:20px; height:20px; border-radius:50%; background:#080808; z-index:75; pointer-events:none; }
                .mkt-cin-particles { position:fixed; inset:0; z-index:85; pointer-events:none; overflow:hidden; }
            `}</style>

            {/* Flash */}
            <div className="mkt-cin-flash" style={{
                opacity: phase === 'flash-in' ? 1 : 0,
                transition: phase === 'flash-in' ? 'opacity 0.08s ease' : 'opacity 0.3s ease'
            }} />

            {/* Blades */}
            <div className="mkt-cin-blades">
                {Array.from({ length: BLADE_COUNT }, (_, i) => (
                    <div key={i} className="mkt-cin-blade" style={{
                        transform: ['blades-in', 'ring-expand', 'particles'].includes(phase) ? 'scaleX(1)' : 'scaleX(0)',
                        transformOrigin: ['blades-out', 'done'].includes(phase) ? 'right center' : 'left center',
                        transition: `transform 0.38s cubic-bezier(0.77,0,0.18,1) ${i * 0.025}s`
                    }} />
                ))}
            </div>

            {/* Radial ring */}
            <div className="mkt-cin-ring" style={{
                transform: ['ring-expand', 'particles', 'blades-out', 'done'].includes(phase)
                    ? 'translate(-50%,-50%) scale(220)' : 'translate(-50%,-50%) scale(0)',
                transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1)',
                opacity: phase === 'done' ? 0 : 1
            }} />

            {/* Particles */}
            <div className="mkt-cin-particles" ref={particlesRef} />
        </div>
    )
}

function WaterdropAnimation({ onComplete }) {
    const [phase, setPhase] = useState('idle')
    const canvasRef = useRef(null)

    useEffect(() => {
        const timeline = async () => {
            const wait = ms => new Promise(r => setTimeout(r, ms))

            // 1. Impact flash
            setPhase('impact')
            await wait(60)

            // 2. Ripples expand
            setPhase('ripples')
            await wait(500)

            // 3. Droplets scatter
            setPhase('droplets')
            await wait(400)

            // 4. Glow pulse
            setPhase('glow')
            await wait(300)

            // 5. Fade out → redirect
            setPhase('fadeout')
            await wait(400)
            onComplete()
        }
        timeline()
    }, [onComplete])

    // Canvas-based droplet particles
    useEffect(() => {
        if (phase !== 'droplets' && phase !== 'glow' && phase !== 'fadeout') return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        const cx = canvas.width / 2
        const cy = canvas.height / 2

        const drops = Array.from({ length: 40 }, () => {
            const angle = Math.random() * Math.PI * 2
            const speed = 3 + Math.random() * 6
            const size = 2 + Math.random() * 4
            const colors = ['#3b82f6', '#60a5fa', '#f97316', '#fb923c', '#06b6d4', '#93c5fd']
            return {
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                gravity: 0.1 + Math.random() * 0.05
            }
        })

        let animId
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            drops.forEach(d => {
                d.x += d.vx
                d.y += d.vy
                d.vy += d.gravity
                d.alpha -= 0.012
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
            background: '#ffffff',
            opacity: phase === 'fadeout' ? 0 : 1,
            transition: 'opacity 0.4s ease'
        }}>
            <style>{`
                .mkt-wd-impact {
                    position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
                    width:14px; height:14px; border-radius:50%;
                    background:radial-gradient(circle, #60a5fa, #3b82f6);
                    box-shadow: 0 0 30px #3b82f6, 0 0 60px rgba(59,130,246,0.4);
                    z-index:10;
                }
                .mkt-wd-ring {
                    position:fixed; top:50%; left:50%;
                    border-radius:50%; border:2px solid transparent;
                    transform:translate(-50%,-50%) scale(0);
                    pointer-events:none;
                }
                .mkt-wd-ring-active {
                    animation: mkt-wd-expand var(--dur) cubic-bezier(0.22,1,0.36,1) var(--delay) forwards;
                }
                @keyframes mkt-wd-expand {
                    0% { transform:translate(-50%,-50%) scale(0); opacity:1; }
                    50% { opacity:0.5; }
                    100% { transform:translate(-50%,-50%) scale(1); opacity:0; }
                }
                .mkt-wd-glow-center {
                    position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
                    width:250px; height:250px; border-radius:50%;
                    background:radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(249,115,22,0.08) 40%, transparent 70%);
                    pointer-events:none;
                }
                .mkt-wd-glow-pulse {
                    animation: mkt-wd-pulse 1s ease-in-out;
                }
                @keyframes mkt-wd-pulse {
                    0% { transform:translate(-50%,-50%) scale(0.5); opacity:0; }
                    50% { transform:translate(-50%,-50%) scale(2.5); opacity:1; }
                    100% { transform:translate(-50%,-50%) scale(3.5); opacity:0; }
                }
                .mkt-wd-ambient-tl {
                    position:fixed; top:-100px; left:-100px; width:350px; height:350px;
                    background:radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%);
                    animation: mkt-wd-ambient 3s ease-in-out infinite;
                }
                .mkt-wd-ambient-br {
                    position:fixed; bottom:-100px; right:-100px; width:300px; height:300px;
                    background:radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%);
                    animation: mkt-wd-ambient 4s ease-in-out infinite reverse;
                }
                @keyframes mkt-wd-ambient {
                    0%,100% { opacity:0.4; transform:scale(1); }
                    50% { opacity:0.8; transform:scale(1.15); }
                }
                .mkt-wd-canvas {
                    position:fixed; inset:0; z-index:5; pointer-events:none;
                }
            `}</style>

            {/* Ambient glow */}
            <div className="mkt-wd-ambient-tl" />
            <div className="mkt-wd-ambient-br" />

            {/* Central impact dot */}
            {(phase === 'impact' || phase === 'ripples') && (
                <div className="mkt-wd-impact" style={{
                    transform: `translate(-50%,-50%) scale(${phase === 'impact' ? 1.5 : 0.3})`,
                    opacity: phase === 'ripples' ? 0 : 1,
                    transition: 'all 0.2s ease'
                }} />
            )}

            {/* Concentric ripple rings */}
            {['ripples', 'droplets', 'glow'].includes(phase) && (
                Array.from({ length: RING_COUNT }, (_, i) => {
                    const size = 80 + i * 140
                    const hue = i % 2 === 0 ? '59,130,246' : '249,115,22'
                    const borderW = Math.max(1, 2.5 - i * 0.4)
                    return (
                        <div key={i}
                            className="mkt-wd-ring mkt-wd-ring-active"
                            style={{
                                width: `${size}px`, height: `${size}px`,
                                borderColor: `rgba(${hue}, ${0.5 - i * 0.07})`,
                                borderWidth: `${borderW}px`,
                                boxShadow: `0 0 ${10 + i * 3}px rgba(${hue}, ${0.15 - i * 0.02})`,
                                '--dur': `${0.6 + i * 0.12}s`,
                                '--delay': `${i * 0.08}s`
                            }}
                        />
                    )
                })
            )}

            {/* Center glow pulse */}
            {(phase === 'glow' || phase === 'droplets') && (
                <div className={`mkt-wd-glow-center ${phase === 'glow' ? 'mkt-wd-glow-pulse' : ''}`} />
            )}

            {/* Canvas droplet particles */}
            <canvas ref={canvasRef} className="mkt-wd-canvas" />
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
                    setTimeout(() => setPreloadStarted(true), 2000)
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
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>📹</div>
                    <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>{error || 'Video Not Available'}</h1>
                    <p style={{ color: '#94a3b8', fontSize: '16px' }}>This video may have been removed or is currently inactive.</p>
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
                    {isMuted && playing && (
                        <button onClick={toggleMute} style={{
                            position: 'fixed', bottom: '24px', right: '24px', zIndex: 20,
                            width: '52px', height: '52px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.3s ease',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            animation: 'mkt-soundPulse 2s ease-in-out infinite'
                        }}>
                            <style>{`
                                @keyframes mkt-soundPulse {
                                    0%,100% { transform: scale(1); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
                                    50% { transform: scale(1.08); box-shadow: 0 4px 28px rgba(59,130,246,0.4); }
                                }
                            `}</style>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                            </svg>
                        </button>
                    )}

                    {/* Sound ON indicator (brief flash) */}
                    {!isMuted && playing && (
                        <button onClick={toggleMute} style={{
                            position: 'fixed', bottom: '24px', right: '24px', zIndex: 20,
                            width: '52px', height: '52px', borderRadius: '50%',
                            background: 'rgba(59,130,246,0.2)', backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(59,130,246,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', opacity: showControls ? 0.8 : 0,
                            transition: 'opacity 0.3s ease'
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                        </button>
                    )}
                </>
            )}

            {/* Custom Controls Overlay */}
            <div style={{ ...styles.controlsOverlay, opacity: showControls ? 1 : 0 }}>
                {/* Title */}
                <div style={styles.titleBar}>
                    <h1 style={styles.videoTitle}>{video.title}</h1>
                </div>

                {/* Center Play/Pause button */}
                <button onClick={togglePlay} style={styles.playBtn}>
                    {playing ? (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                    ) : (
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                    )}
                </button>

                {/* Progress bar (read-only) */}
                {!isEmbed && (
                    <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
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
    html, body { background:#000; overflow:hidden; width:100%; height:100%; }
    .mkt-qr-spinner {
        width:48px; height:48px; border:4px solid rgba(255,255,255,0.2);
        border-top-color:#fff; border-radius:50%; animation:mkt-spin 0.8s linear infinite;
    }
    @keyframes mkt-spin { to{transform:rotate(360deg)} }
`

const styles = {
    container: {
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999, fontFamily: "'Inter', -apple-system, sans-serif"
    },
    loading: {
        position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
    },
    error: {
        position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0f0c29, #302b63)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
        fontFamily: "'Inter', sans-serif", padding: '20px'
    },
    homeLink: {
        display: 'inline-block', marginTop: '20px', padding: '12px 24px',
        background: '#3b82f6', color: '#fff', textDecoration: 'none',
        borderRadius: '10px', fontWeight: '600', fontSize: '14px'
    },
    video: {
        width: '100%', height: '100%', objectFit: 'contain', background: '#000'
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
        pointerEvents: 'none', transition: 'opacity 0.3s ease'
    },
    titleBar: {
        padding: '20px 24px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
        pointerEvents: 'auto'
    },
    videoTitle: {
        color: '#fff', fontSize: 'clamp(14px, 3vw, 22px)', fontWeight: '600',
        textShadow: '0 2px 8px rgba(0,0,0,0.5)', margin: 0
    },
    playBtn: {
        alignSelf: 'center', background: 'rgba(255,255,255,0.15)',
        border: 'none', borderRadius: '50%', width: '80px', height: '80px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', pointerEvents: 'auto', backdropFilter: 'blur(10px)',
        transition: 'transform 0.2s, background 0.2s'
    },
    progressBar: {
        width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)',
        pointerEvents: 'none'
    },
    progressFill: {
        height: '100%', background: '#3b82f6',
        transition: 'width 0.3s linear', borderRadius: '0 2px 2px 0'
    }
}
