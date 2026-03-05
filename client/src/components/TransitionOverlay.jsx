/**
 * TransitionOverlay.jsx
 * 
 * Full-screen fixed overlay for the cinematic video-to-landing-page transition.
 * Rendered in App.jsx above Routes so it persists across navigation.
 * 
 * PERFORMANCE: Uses ONLY CSS transitions on opacity + transform.
 * CSS transitions run on the GPU compositor thread at 60fps,
 * completely independent of JavaScript main thread activity.
 * This means smooth animation even while React is mounting the landing page.
 */

import { useEffect, useRef } from 'react'
import { useVideoTransition } from '../contexts/VideoTransitionContext'

export default function TransitionOverlay() {
    const {
        transitionState,
        videoFrame,
        isEmbedVideo,
        onTransitionComplete,
    } = useVideoTransition()

    const overlayRef = useRef(null)
    const completeTimerRef = useRef(null)
    const fadeTimerRef = useRef(null)

    // When we get a video frame (canvas), insert it directly into the overlay
    // IMPORTANT: No toDataURL() — that call is synchronous and blocks the main thread
    useEffect(() => {
        if (!overlayRef.current) return

        if (videoFrame && !isEmbedVideo) {
            try {
                // Insert canvas element directly — zero encoding overhead
                const canvas = videoFrame
                canvas.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;'
                // Clear any previous children
                const container = overlayRef.current
                while (container.firstChild) container.removeChild(container.firstChild)
                container.appendChild(canvas)
            } catch (e) {
                console.warn('[TransitionOverlay] Frame render failed:', e)
                overlayRef.current.style.background = '#ffffff'
            }
        }
    }, [videoFrame, isEmbedVideo])

    // Trigger CSS transition when transitioning starts
    useEffect(() => {
        if (transitionState !== 'transitioning') return
        if (!overlayRef.current) return

        const el = overlayRef.current

        // GPU layer promotion
        el.style.willChange = 'opacity, transform'
        el.style.opacity = '1'
        el.style.transform = 'translateZ(0) scale(1)'
        el.style.transition = 'none'

        const duration = isEmbedVideo ? 600 : 800

        if (isEmbedVideo) {
            el.style.background = 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 40%, #f97316 100%)'
        }

        // Wait for landing page to mount and do initial render behind us
        fadeTimerRef.current = setTimeout(() => {
            if (!overlayRef.current) return

            // Start the CSS transition — this runs on the GPU compositor,
            // completely independent of JS main thread
            el.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`
            el.style.opacity = '0'
            el.style.transform = 'translateZ(0) scale(1.05)'
        }, 200) // 200ms for page to render

        // Cleanup after transition finishes
        completeTimerRef.current = setTimeout(() => {
            if (overlayRef.current) {
                overlayRef.current.style.transition = ''
                overlayRef.current.style.willChange = 'auto'
            }
            onTransitionComplete()
        }, 200 + duration + 50) // delay + duration + buffer

        return () => {
            clearTimeout(fadeTimerRef.current)
            clearTimeout(completeTimerRef.current)
        }
    }, [transitionState, isEmbedVideo, onTransitionComplete])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimeout(fadeTimerRef.current)
            clearTimeout(completeTimerRef.current)
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
