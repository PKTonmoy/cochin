import { useState, useEffect, useCallback } from 'react';

/**
 * useNetworkStatus — Advanced network awareness hook
 * Tracks online/offline state, connection type, and slow connection detection.
 * Uses the Network Information API where available (Chrome, Edge, Android).
 */
export function useNetworkStatus() {
    const [status, setStatus] = useState(() => ({
        isOnline: navigator.onLine,
        wasOffline: false, // true for 3s after coming back online (for "Back online" toast)
        isSlowConnection: false,
        effectiveType: navigator.connection?.effectiveType || 'unknown',
        connectionType: navigator.connection?.type || 'unknown',
        saveData: navigator.connection?.saveData || false,
        downlink: navigator.connection?.downlink || null,
    }));

    // Detect slow connections: 2g, slow-2g, or very low downlink
    const evaluateConnection = useCallback(() => {
        const conn = navigator.connection;
        if (!conn) return false;
        const slowTypes = ['slow-2g', '2g'];
        if (slowTypes.includes(conn.effectiveType)) return true;
        if (conn.downlink && conn.downlink < 0.5) return true;
        return false;
    }, []);

    useEffect(() => {
        let wasOfflineTimer = null;

        const handleOnline = () => {
            setStatus(prev => ({
                ...prev,
                isOnline: true,
                wasOffline: true,
                isSlowConnection: evaluateConnection(),
            }));
            // Auto-clear "wasOffline" after 3 seconds
            wasOfflineTimer = setTimeout(() => {
                setStatus(prev => ({ ...prev, wasOffline: false }));
            }, 3000);
        };

        const handleOffline = () => {
            setStatus(prev => ({
                ...prev,
                isOnline: false,
                wasOffline: false,
            }));
        };

        const handleConnectionChange = () => {
            const conn = navigator.connection;
            setStatus(prev => ({
                ...prev,
                isSlowConnection: evaluateConnection(),
                effectiveType: conn?.effectiveType || 'unknown',
                connectionType: conn?.type || 'unknown',
                saveData: conn?.saveData || false,
                downlink: conn?.downlink || null,
            }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (navigator.connection) {
            navigator.connection.addEventListener('change', handleConnectionChange);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (navigator.connection) {
                navigator.connection.removeEventListener('change', handleConnectionChange);
            }
            if (wasOfflineTimer) clearTimeout(wasOfflineTimer);
        };
    }, [evaluateConnection]);

    return status;
}

export default useNetworkStatus;
