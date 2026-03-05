/**
 * TransitionOverlay.jsx
 * 
 * Full-screen fixed overlay for the cinematic video-to-landing-page transition.
 * Rendered in App.jsx above Routes so it persists across navigation.
 * 
 * PERFORMANCE NOTES:
 * - Uses ONLY opacity + transform for animations (GPU-composited properties)
 * - Avoids filter:blur() which triggers CPU paint on every frame
 * - Uses a pre-blurred image via canvas ctx.filter for the frozen frame
 * - Minimal React state changes during animation to avoid re-renders
 */

import { useEffect, useRef, useCallback } from 'react'
import { useVideoTransition } from '../contexts/VideoTransitionContext'

export default function TransitionOverlay() {
    const {
        transitionState,
        videoFrame,
        isEmbedVideo,
        onTransitionComplete,
    } = useVideoTransition()

    const overlayRef = useRef(null)
    const animFrameRef = useRef(null)

    // When we get a video frame (canvas), convert it to a background image
    useEffect(() => {
        if (!overlayRef.current) return

        if (videoFrame && !isEmbedVideo) {
            try {
                // Convert canvas to a data URL and set as background
                const dataUrl = videoFrame.toDataURL('image/jpeg', 0.92)
                overlayRef.current.style.backgroundImage = `url(${dataUrl})`
                overlayRef.current.style.backgroundSize = 'cover'
                overlayRef.current.style.backgroundPosition = 'center'
            } catch (e) {
                console.warn('[TransitionOverlay] Frame render failed:', e)
                overlayRef.current.style.background = '#ffffff'
            }
        }
    }, [videoFrame, isEmbedVideo])

    // Handle the dissolve animation using requestAnimationFrame for buttery smooth 60fps
    const runDissolve = useCallback(() => {
        if (!overlayRef.current) return

        const el = overlayRef.current
        const duration = 1400 // ms — fast enough to feel snappy, slow enough to feel cinematic
        const start = performance.now()

        // Pre-promote to GPU layer
        el.style.willChange = 'opacity, transform'
        el.style.transform = 'translateZ(0) scale(1)'
        el.style.opacity = '1'

        const animate = (now) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)

            // Smooth easing: cubic-bezier approximation (ease-out-quart)
            const eased = 1 - Math.pow(1 - progress, 4)

            // Scale up slightly while fading — creates depth illusion without blur
            const scale = 1 + eased * 0.08
            const opacity = 1 - eased

            el.style.opacity = String(opacity)
            el.style.transform = `translateZ(0) scale(${scale})`

            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(animate)
            } else {
                // Animation complete
                el.style.willChange = 'auto'
                onTransitionComplete()
            }
        }

        // Start on next frame to ensure the overlay is visible first
        animFrameRef.current = requestAnimationFrame(animate)
    }, [onTransitionComplete])

    // Trigger dissolve when transitioning starts
    useEffect(() => {
        if (transitionState === 'transitioning') {
            if (isEmbedVideo) {
                // For embeds: simple quick fade with brand gradient
                if (overlayRef.current) {
                    overlayRef.current.style.background = 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 40%, #f97316 100%)'
                    overlayRef.current.style.willChange = 'opacity'
                    overlayRef.current.style.opacity = '1'
                    overlayRef.current.style.transform = 'translateZ(0)'

                    // Quick fade out
                    requestAnimationFrame(() => {
                        overlayRef.current.style.transition = 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1)'
                        overlayRef.current.style.opacity = '0'
                    })

                    const timer = setTimeout(() => {
                        if (overlayRef.current) {
                            overlayRef.current.style.transition = ''
                            overlayRef.current.style.willChange = 'auto'
                        }
                        onTransitionComplete()
                    }, 1050)

                    return () => clearTimeout(timer)
                }
            } else {
                // For uploaded videos: smooth rAF dissolve
                // Small delay to ensure landing page has mounted behind us
                const timer = setTimeout(() => runDissolve(), 80)
                return () => {
                    clearTimeout(timer)
                    if (animFrameRef.current) {
                        cancelAnimationFrame(animFrameRef.current)
                    }
                }
            }
        }
    }, [transitionState, isEmbedVideo, runDissolve, onTransitionComplete])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current)
            }
        }
    }, [])

    // Don't render when not needed
    if (
        transitionState === 'idle' ||
        transitionState === 'done' ||
        transitionState === 'preloading' ||
        transitionState === 'ready'
    ) {
        return null
    }

    const isHolding = transitionState === 'holding'

    return (
        <div
            ref={overlayRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999999,
                background: isEmbedVideo
                    ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 40%, #f97316 100%)'
                    : '#000000',
                // GPU layer promotion from the start
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
            }}
        >
            {/* Holding state: subtle loading pulse */}
            {isHolding && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none', zIndex: 3,
                }}>
                    <style>{`
                        @keyframes vt-gentle-pulse {
                            0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
                            50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.15); }
                        }
                    `}</style>
                    <div style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        width: '64px', height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        animation: 'vt-gentle-pulse 1.6s ease-in-out infinite',
                    }} />
                </div>
            )}
        </div>
    )
}
