import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * usePullToRefresh — Native-feel pull-to-refresh gesture
 * Detects touch-based pull-down at the top of the page and triggers a data refresh.
 * Only activates in standalone PWA mode on mobile devices.
 * Battery-friendly: 2-second cooldown between refreshes.
 */
export function usePullToRefresh({ onRefresh, disabled = false } = {}) {
    const [pullProgress, setPullProgress] = useState(0); // 0 to 1
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showIndicator, setShowIndicator] = useState(false);

    const startYRef = useRef(0);
    const currentYRef = useRef(0);
    const isPullingRef = useRef(false);
    const lastRefreshRef = useRef(0);
    const queryClient = useQueryClient();

    const PULL_THRESHOLD = 80;  // pixels needed to trigger refresh
    const MAX_PULL = 120;       // max visual pull distance
    const COOLDOWN_MS = 2000;   // 2-second cooldown

    // Check if we're in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

    const handleTouchStart = useCallback((e) => {
        // Only trigger when at the top of the page
        if (window.scrollY > 5 || disabled || isRefreshing) return;

        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e) => {
        if (!isPullingRef.current || disabled || isRefreshing) return;

        currentYRef.current = e.touches[0].clientY;
        const deltaY = currentYRef.current - startYRef.current;

        if (deltaY > 0 && window.scrollY <= 0) {
            // Prevent default scroll to allow our pull animation
            e.preventDefault();

            const progress = Math.min(deltaY / PULL_THRESHOLD, 1);
            const clampedDelta = Math.min(deltaY, MAX_PULL);
            setPullProgress(progress);
            setShowIndicator(clampedDelta > 10);
        } else {
            // User is scrolling up or page is not at top
            isPullingRef.current = false;
            setPullProgress(0);
            setShowIndicator(false);
        }
    }, [disabled, isRefreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPullingRef.current) return;

        isPullingRef.current = false;
        const deltaY = currentYRef.current - startYRef.current;

        if (deltaY >= PULL_THRESHOLD && !isRefreshing) {
            const now = Date.now();
            if (now - lastRefreshRef.current < COOLDOWN_MS) {
                // Cooldown — don't refresh
                setPullProgress(0);
                setShowIndicator(false);
                return;
            }

            lastRefreshRef.current = now;
            setIsRefreshing(true);
            setPullProgress(1);

            try {
                // Trigger custom onRefresh or default invalidation
                if (onRefresh) {
                    await onRefresh();
                } else {
                    await queryClient.invalidateQueries();
                }
            } catch (err) {
                console.warn('Pull-to-refresh failed:', err);
            } finally {
                // Small delay so the spinner is visible
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullProgress(0);
                    setShowIndicator(false);
                }, 600);
            }
        } else {
            setPullProgress(0);
            setShowIndicator(false);
        }
    }, [isRefreshing, onRefresh, queryClient]);

    useEffect(() => {
        // Only attach on mobile / standalone PWA
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isMobile) return;

        const options = { passive: false }; // Need non-passive for preventDefault in move

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, options);
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return {
        /** 0-1 progress of the pull gesture */
        pullProgress,
        /** Whether a refresh is currently in progress */
        isRefreshing,
        /** Whether to show the pull indicator UI */
        showIndicator,
        /** Whether the app is in standalone PWA mode */
        isStandalone,
    };
}

export default usePullToRefresh;
