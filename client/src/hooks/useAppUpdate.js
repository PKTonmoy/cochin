import { useState, useEffect, useCallback } from 'react';

/**
 * useAppUpdate — Service Worker update detection hook
 * Detects new service worker versions waiting to activate and provides
 * a method to apply the update (skip waiting + reload).
 * Periodically checks for updates every 60 minutes.
 */
export function useAppUpdate() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState(null);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        let registration = null;
        let checkInterval = null;

        const handleStateChange = (sw) => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                // New SW installed but waiting — update available
                setUpdateAvailable(true);
                setWaitingWorker(sw);
            }
        };

        const detectUpdate = (reg) => {
            registration = reg;

            // Check if there's already a waiting worker
            if (reg.waiting) {
                setUpdateAvailable(true);
                setWaitingWorker(reg.waiting);
                return;
            }

            // Listen for new installing workers
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => handleStateChange(newWorker));
                }
            });
        };

        // Get existing registration
        navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg) detectUpdate(reg);
        });

        // Periodic update check every 60 minutes
        checkInterval = setInterval(() => {
            if (registration) {
                registration.update().catch(() => { });
            }
        }, 60 * 60 * 1000);

        // Listen for the controlling SW to change (another tab applied the update)
        const handleControllerChange = () => {
            window.location.reload();
        };
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        return () => {
            if (checkInterval) clearInterval(checkInterval);
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

    const applyUpdate = useCallback(() => {
        if (waitingWorker) {
            // Tell the waiting SW to skip waiting and activate
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            setUpdateAvailable(false);
        }
    }, [waitingWorker]);

    const dismissUpdate = useCallback(() => {
        setUpdateAvailable(false);
    }, []);

    return { updateAvailable, applyUpdate, dismissUpdate };
}

export default useAppUpdate;
