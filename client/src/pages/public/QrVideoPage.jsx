/**
 * QrVideoPage.jsx
 * Standalone immersive QR code video experience page
 * 
 * CINEMATIC TRANSITION VERSION:
 * - Preloads landing page data while video plays (via VideoTransitionContext)
 * - Freeze-frame dissolve: video last frame blurs + fades into landing page
 * - No post-video animation screens — seamless single transition
 * - Premium skeleton loading with shimmer effect
 * - Preconnect hints for faster resource loading
 * - Video buffering progress indicator
 * - Analytics: logs scan on mount, completion on video end
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useVideoTransition } from '../../contexts/VideoTransitionContext'

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
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const containerRef = useRef(null)

    const [video, setVideo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [showControls, setShowControls] = useState(true)
    const [isMuted, setIsMuted] = useState(true) // Start muted for autoplay compliance

    // Cinematic transition system
    const {
        transitionState,
        startPreloading,
        captureFrame,
        onVideoEnded,
        resetTransition,
    } = useVideoTransition()

    // ---- Fetch video data & log scan ----
    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const [videoRes] = await Promise.all([
                    axios.get(`${API_URL}/marketing/qr/${id}`),
                    axios.get(`${API_URL}/settings/public`).catch(() => ({ data: { data: null } })),
                    axios.post(`${API_URL}/marketing/qr/${id}/scan`).catch(() => { }) // silent analytics
                ])
                if (videoRes.data.success) {
                    setVideo(videoRes.data.data)
                    // Start preloading landing page data immediately
                    startPreloading()
                } else {
                    setError('Video not found')
                }
            } catch (err) {
                setError('Video not available')
            } finally {
                setLoading(false)
            }
        }
        fetchVideo()

        // Cleanup: reset transition state if user navigates away
        return () => resetTransition()
    }, [id, startPreloading, resetTransition])

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

    // When video ends: capture frame + trigger transition
    const handleVideoEnd = useCallback(() => {
        // Log completion analytics (fire-and-forget — don't block transition)
        axios.post(`${API_URL}/marketing/qr/${id}/complete`).catch(() => { })

        // Capture the last frame for freeze-frame dissolve
        const v = videoRef.current
        if (v) {
            captureFrame(v)
        } else {
            // Embed video — captureFrame with null triggers color wash fallback
            captureFrame(null)
        }

        // Signal the transition system: video has ended
        onVideoEnded(navigate)
    }, [id, captureFrame, onVideoEnded, navigate])

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

    // ---- Try fullscreen on mobile (scoped to video container only) ----
    useEffect(() => {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        const container = containerRef.current
        if (!video || !container || !isMobile) return

        const tryFullscreen = () => {
            const el = document.documentElement
            if (el.requestFullscreen) el.requestFullscreen().catch(() => { })
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
        }
        const handler = () => {
            tryFullscreen()
            container.removeEventListener('click', handler)
            container.removeEventListener('touchstart', handler)
        }
        container.addEventListener('click', handler, { once: true })
        container.addEventListener('touchstart', handler, { once: true })

        return () => {
            container.removeEventListener('click', handler)
            container.removeEventListener('touchstart', handler)
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

    // If transition is in progress, don't render the video page
    // (TransitionOverlay in App.jsx handles the visual)
    if (transitionState === 'transitioning' || transitionState === 'done') {
        return null
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

    const isEmbed = video.videoType === 'youtube' || video.videoType === 'vimeo'
    const embedUrl = isEmbed ? getEmbedUrl(video.videoSource, video.videoType) : null

    return (
        <div ref={containerRef} style={styles.container}>
            <style>{baseCSS}</style>
            <PreconnectHints />

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
