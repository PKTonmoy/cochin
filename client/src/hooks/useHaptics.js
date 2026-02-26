/**
 * useHaptics — Native-feel haptic feedback hook
 * Provides vibration patterns for different interactions.
 * No-ops gracefully on devices without vibration support.
 */
export function useHaptics() {
    const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    const vibrate = (pattern) => {
        if (canVibrate) {
            try { navigator.vibrate(pattern); } catch { }
        }
    };

    return {
        /** Light tap — button press, tab switch (10ms) */
        tap: () => vibrate(10),

        /** Success — action completed, pull-to-refresh done (two short buzzes) */
        success: () => vibrate([10, 50, 10]),

        /** Error — failed action (one longer buzz) */
        error: () => vibrate(50),

        /** Pull threshold reached — very light (5ms) */
        pull: () => vibrate(5),

        /** Notification received — attention-getting pattern */
        notification: () => vibrate([30, 50, 30]),

        /** Custom vibration pattern */
        custom: (pattern) => vibrate(pattern),

        /** Whether the device supports vibration */
        supported: canVibrate,
    };
}

export default useHaptics;
