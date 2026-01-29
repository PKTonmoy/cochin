// Performance detection utility for dynamic quality adjustment

/**
 * Performance Tiers:
 * - LOW: 4GB RAM or less, integrated GPU, or mobile - No 3D, minimal particles
 * - MEDIUM: 4-8GB RAM - Reduced 3D shapes and particles
 * - HIGH: 8GB+ RAM with dedicated GPU - Full experience
 */

export const PERFORMANCE_TIERS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
}

export const TIER_SETTINGS = {
    [PERFORMANCE_TIERS.LOW]: {
        enable3D: false,
        enableParticles: false,
        particleCount: 0,
        shapeCount: 0,
        starCount: 0,
        enableAnimations: true, // Basic CSS animations only
        enableBlur: false,
        description: 'Performance Mode (4GB RAM or less)'
    },
    [PERFORMANCE_TIERS.MEDIUM]: {
        enable3D: true,
        enableParticles: true,
        particleCount: 25,
        shapeCount: 4,
        starCount: 200,
        enableAnimations: true,
        enableBlur: true,
        description: 'Balanced Mode (4-8GB RAM)'
    },
    [PERFORMANCE_TIERS.HIGH]: {
        enable3D: true,
        enableParticles: true,
        particleCount: 60,
        shapeCount: 12,
        starCount: 800,
        enableAnimations: true,
        enableBlur: true,
        description: 'Full Quality (8GB+ RAM)'
    }
}

/**
 * Detects the appropriate performance tier for the current device
 */
export function detectPerformanceTier() {
    // Check for reduced motion preference first
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return PERFORMANCE_TIERS.LOW
    }

    // Mobile devices always get LOW tier
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile || window.innerWidth < 768) {
        return PERFORMANCE_TIERS.LOW
    }

    // Check device memory (in GB) - available in Chrome/Edge
    const deviceMemory = navigator.deviceMemory || 4 // Default to 4GB if not available

    // Check hardware concurrency (CPU cores)
    const cpuCores = navigator.hardwareConcurrency || 4

    // Check WebGL capabilities
    let hasGoodGPU = false
    try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase()
                // Check for software renderers or weak integrated GPUs
                const weakGPUs = ['swiftshader', 'software', 'llvmpipe', 'intel hd graphics', 'intel(r) hd graphics']
                hasGoodGPU = !weakGPUs.some(weak => renderer.includes(weak))
            }
        }
    } catch (e) {
        hasGoodGPU = false
    }

    // Determine tier based on capabilities
    if (deviceMemory <= 4 || cpuCores <= 2 || !hasGoodGPU) {
        return PERFORMANCE_TIERS.LOW
    } else if (deviceMemory <= 8 || cpuCores <= 4) {
        return PERFORMANCE_TIERS.MEDIUM
    } else {
        return PERFORMANCE_TIERS.HIGH
    }
}

/**
 * Gets the settings for the detected or specified tier
 */
export function getPerformanceSettings(tier = null) {
    const detectedTier = tier || detectPerformanceTier()
    return {
        tier: detectedTier,
        ...TIER_SETTINGS[detectedTier]
    }
}

/**
 * Creates a performance context object for components
 */
export function usePerformanceSettings() {
    // This can be called once at app initialization
    return getPerformanceSettings()
}

export default {
    PERFORMANCE_TIERS,
    TIER_SETTINGS,
    detectPerformanceTier,
    getPerformanceSettings,
    usePerformanceSettings
}
