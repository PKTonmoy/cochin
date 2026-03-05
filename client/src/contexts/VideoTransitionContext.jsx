/**
 * VideoTransitionContext.jsx
 * 
 * Shared context for the cinematic video-to-landing-page transition.
 * Manages: preloading landing page data during video playback,
 * capturing the video's last frame, and orchestrating the freeze-frame
 * dissolve animation across route navigation.
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import api from '../lib/api'

const VideoTransitionContext = createContext(null)

// The 5 API endpoints the landing page depends on
const LANDING_PAGE_ENDPOINTS = [
    { key: 'content', url: '/site-content', fallback: {} },
    { key: 'courses', url: '/courses/public?showOnHomepage=true', fallback: [] },
    { key: 'faculty', url: '/faculty/public', fallback: [] },
    { key: 'toppers', url: '/toppers/public/homepage', fallback: [] },
    { key: 'testimonials', url: '/testimonials/public/homepage', fallback: [] },
]

export function VideoTransitionProvider({ children }) {
    const [transitionState, setTransitionState] = useState('idle')
    // idle → preloading → ready → holding → transitioning → done
    const [preloadedData, setPreloadedData] = useState(null)
    const [videoFrame, setVideoFrame] = useState(null) // canvas element
    const [isEmbedVideo, setIsEmbedVideo] = useState(false)

    const dataReadyRef = useRef(false)
    const videoEndedRef = useRef(false)
    const navigateFnRef = useRef(null)
    const preloadStartedRef = useRef(false)

    // Start prefetching all landing page data
    const startPreloading = useCallback(() => {
        if (preloadStartedRef.current) return
        preloadStartedRef.current = true
        setTransitionState('preloading')

        // Defer marketing popups until transition is complete
        window.__MKT_DEFER_POPUPS = true

        const fetchAll = async () => {
            try {
                const results = await Promise.all(
                    LANDING_PAGE_ENDPOINTS.map(ep =>
                        api.get(ep.url).catch(() => ({ data: { data: ep.fallback } }))
                    )
                )

                const data = {}
                LANDING_PAGE_ENDPOINTS.forEach((ep, i) => {
                    data[ep.key] = results[i]?.data?.data ?? ep.fallback
                })

                setPreloadedData(data)
                dataReadyRef.current = true
                setTransitionState('ready')

                // If video already ended while we were fetching, trigger transition now
                if (videoEndedRef.current && navigateFnRef.current) {
                    triggerTransition(navigateFnRef.current)
                }
            } catch (err) {
                console.warn('[VideoTransition] Preload error:', err)
                // Set empty data so transition can still proceed
                const fallbackData = {}
                LANDING_PAGE_ENDPOINTS.forEach(ep => {
                    fallbackData[ep.key] = ep.fallback
                })
                setPreloadedData(fallbackData)
                dataReadyRef.current = true
                setTransitionState('ready')

                if (videoEndedRef.current && navigateFnRef.current) {
                    triggerTransition(navigateFnRef.current)
                }
            }
        }

        // Start fetching immediately — no delays
        fetchAll()
    }, [])

    // Capture the video's last frame to a canvas
    const captureFrame = useCallback((videoEl) => {
        if (!videoEl || videoEl.tagName !== 'VIDEO') {
            setIsEmbedVideo(true)
            return
        }
        try {
            const canvas = document.createElement('canvas')
            canvas.width = videoEl.videoWidth || window.innerWidth
            canvas.height = videoEl.videoHeight || window.innerHeight
            const ctx = canvas.getContext('2d')
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
            setVideoFrame(canvas)
        } catch (e) {
            console.warn('[VideoTransition] Frame capture failed:', e)
            setIsEmbedVideo(true) // fallback to color wash
        }
    }, [])

    // Internal: actually start the CSS transition and navigate
    const triggerTransition = useCallback((navigate) => {
        setTransitionState('transitioning')
        // Navigate on next frame — overlay is already visible
        requestAnimationFrame(() => {
            navigate('/', { replace: true })
        })
    }, [])

    // Called by QrVideoPage when video ends
    const onVideoEnded = useCallback((navigate) => {
        videoEndedRef.current = true
        navigateFnRef.current = navigate

        if (dataReadyRef.current) {
            // Data is ready — start transition immediately
            triggerTransition(navigate)
        } else {
            // Data still loading — hold the frozen frame
            setTransitionState('holding')
        }
    }, [triggerTransition])

    // Called by TransitionOverlay when dissolve animation finishes
    const onTransitionComplete = useCallback(() => {
        // Single batch cleanup — reset everything at once
        setTransitionState('idle')
        setVideoFrame(null)
        setIsEmbedVideo(false)
        preloadStartedRef.current = false
        dataReadyRef.current = false
        videoEndedRef.current = false

        // Allow marketing popups now that landing page is fully rendered
        // Small delay to ensure the page is visually complete
        setTimeout(() => { window.__MKT_DEFER_POPUPS = false }, 1000)
        navigateFnRef.current = null
        // Keep preloadedData — landing page still needs it
    }, [])

    // Reset (e.g. if user navigates away from QR page without finishing)
    const resetTransition = useCallback(() => {
        setTransitionState('idle')
        setPreloadedData(null)
        setVideoFrame(null)
        setIsEmbedVideo(false)
        preloadStartedRef.current = false
        dataReadyRef.current = false
        // Clear popup defer flag on reset too
        window.__MKT_DEFER_POPUPS = false
        videoEndedRef.current = false
        navigateFnRef.current = null
    }, [])

    const value = {
        transitionState,
        preloadedData,
        videoFrame,
        isEmbedVideo,
        isPreloaded: preloadedData !== null,
        startPreloading,
        captureFrame,
        onVideoEnded,
        onTransitionComplete,
        resetTransition,
    }

    return (
        <VideoTransitionContext.Provider value={value}>
            {children}
        </VideoTransitionContext.Provider>
    )
}

export function useVideoTransition() {
    const ctx = useContext(VideoTransitionContext)
    if (!ctx) {
        // Return a no-op object if used outside the provider (e.g. direct landing page visit)
        return {
            transitionState: 'idle',
            preloadedData: null,
            videoFrame: null,
            isEmbedVideo: false,
            isPreloaded: false,
            startPreloading: () => { },
            captureFrame: () => { },
            onVideoEnded: () => { },
            onTransitionComplete: () => { },
            resetTransition: () => { },
        }
    }
    return ctx
}

export default VideoTransitionContext
