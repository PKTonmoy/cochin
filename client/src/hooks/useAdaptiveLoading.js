import { useState, useEffect } from 'react';

/**
 * useAdaptiveLoading — Device capability detection hook
 * Determines a loading tier (high/medium/low) based on device memory,
 * CPU cores, connection speed, and data-saver preferences.
 * Used to conditionally enable/disable animations, prefetching, etc.
 */
export function useAdaptiveLoading() {
    const [tier, setTier] = useState('high');

    useEffect(() => {
        let score = 0;  // higher = more capable

        // Memory (navigator.deviceMemory: GB)
        const memory = navigator.deviceMemory;
        if (memory) {
            if (memory >= 4) score += 3;
            else if (memory >= 2) score += 2;
            else score += 1;
        } else {
            score += 2; // assume mid-tier if unknown
        }

        // CPU cores (navigator.hardwareConcurrency)
        const cores = navigator.hardwareConcurrency;
        if (cores) {
            if (cores >= 6) score += 3;
            else if (cores >= 4) score += 2;
            else score += 1;
        } else {
            score += 2;
        }

        // Connection quality
        const conn = navigator.connection;
        if (conn) {
            const ect = conn.effectiveType;
            if (ect === '4g') score += 3;
            else if (ect === '3g') score += 2;
            else score += 0; // 2g or slow-2g = no bonus

            // Data saver mode
            if (conn.saveData) score -= 2;
        } else {
            score += 2;
        }

        // Determine tier
        if (score >= 7) setTier('high');
        else if (score >= 4) setTier('medium');
        else setTier('low');

        // Listen for connection changes
        const handleChange = () => {
            const conn = navigator.connection;
            if (conn) {
                setTier(prev => {
                    const ect = conn.effectiveType;
                    if (conn.saveData || ect === 'slow-2g' || ect === '2g') return 'low';
                    if (ect === '3g' && prev === 'high') return 'medium';
                    return prev;
                });
            }
        };

        navigator.connection?.addEventListener('change', handleChange);
        return () => navigator.connection?.removeEventListener('change', handleChange);
    }, []);

    return {
        /** Loading tier: 'high' | 'medium' | 'low' */
        tier,
        /** Whether to enable full animations */
        enableAnimations: tier !== 'low',
        /** Whether to enable smart prefetching */
        enablePrefetch: tier === 'high',
        /** Whether to enable background sync */
        enableBackgroundSync: tier !== 'low',
        /** Whether the device is low-end */
        isLowEnd: tier === 'low',
    };
}

export default useAdaptiveLoading;
