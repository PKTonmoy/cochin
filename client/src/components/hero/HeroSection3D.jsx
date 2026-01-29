import { useState, useEffect, Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { getPerformanceSettings, PERFORMANCE_TIERS } from '../../utils/performanceUtils'
import Scene3D from './Scene3D'
import ParticleNetwork from './ParticleNetwork'
import AnimatedHeadline from './AnimatedHeadline'
import FloatingStatsCards from './FloatingStatsCards'
import CTAButtons from './CTAButtons'
import ScrollIndicator from './ScrollIndicator'

// Loading screen component
const HeroPreloader = ({ isLoading }) => {
    if (!isLoading) return null

    return (
        <div className="hero-preloader">
            <div className="preloader-content">
                <div className="preloader-logo">
                    <span>PARAGON</span>
                </div>
                <div className="preloader-bar">
                    <div className="preloader-progress" />
                </div>
                <span className="preloader-text">Loading...</span>
            </div>
        </div>
    )
}

// Performance indicator component (optional - shows current tier)
const PerformanceIndicator = ({ tier, show = false }) => {
    if (!show) return null

    const tierColors = {
        low: '#e74c3c',
        medium: '#f39c12',
        high: '#27ae60'
    }

    return (
        <div style={{
            position: 'fixed',
            top: '80px',
            right: '10px',
            padding: '8px 12px',
            background: tierColors[tier],
            color: 'white',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 1000,
            textTransform: 'uppercase'
        }}>
            {tier} Quality
        </div>
    )
}

const HeroSection3D = ({ content = {}, stats, onLoad }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
    const [perfSettings, setPerfSettings] = useState(null)
    const containerRef = useRef(null)

    // Detect performance tier on mount
    useEffect(() => {
        const settings = getPerformanceSettings()
        setPerfSettings(settings)

        console.log(`🎮 Performance Tier: ${settings.tier.toUpperCase()}`)
        console.log(`   - 3D Enabled: ${settings.enable3D}`)
        console.log(`   - Particles: ${settings.particleCount}`)
        console.log(`   - 3D Shapes: ${settings.shapeCount}`)

        // Quick loading for low-end devices
        const loadTime = settings.tier === PERFORMANCE_TIERS.LOW ? 300 : 800
        const loadTimer = setTimeout(() => {
            setIsLoading(false)
            onLoad?.()
        }, loadTime)

        return () => clearTimeout(loadTimer)
    }, [onLoad])

    // Mouse tracking only for non-LOW tier
    useEffect(() => {
        if (!perfSettings || !perfSettings.enable3D) return

        let rafId
        const handleMouseMove = (e) => {
            if (rafId) return
            rafId = requestAnimationFrame(() => {
                setMousePosition({
                    x: e.clientX / window.innerWidth,
                    y: e.clientY / window.innerHeight
                })
                rafId = null
            })
        }

        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            if (rafId) cancelAnimationFrame(rafId)
        }
    }, [perfSettings])

    // Extract content with fallbacks
    const headline = content.headline || 'UNLOCK YOUR FUTURE'
    const subtitles = content.subtitles || [
        'ENGINEERING EXCELLENCE',
        'MEDICAL MASTERY',
        'FOUNDATION STRENGTH',
        'COMPETITIVE EDGE'
    ]
    const description = content.description ||
        'Join thousands of successful students who have achieved their dreams with PARAGON. We provide quality education with experienced teachers and modern facilities.'
    const primaryCTA = content.ctaText || 'Enroll Now'
    const secondaryCTA = content.secondaryCTA || 'Explore Courses'

    const handlePrimaryCTA = () => {
        const programsSection = document.getElementById('programs')
        if (programsSection) {
            programsSection.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const handleSecondaryCTA = () => {
        const featuresSection = document.getElementById('features')
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' })
        }
    }

    // Don't render until performance settings are detected
    if (!perfSettings) {
        return (
            <section className="hero-section-3d">
                <div className="hero-gradient-bg" />
                <HeroPreloader isLoading={true} />
            </section>
        )
    }

    return (
        <section ref={containerRef} className="hero-section-3d">
            {/* Optional: Show performance tier for debugging */}
            {/* <PerformanceIndicator tier={perfSettings.tier} show={true} /> */}

            {/* Preloader */}
            <HeroPreloader isLoading={isLoading} />

            {/* Gradient Background */}
            <div className="hero-gradient-bg" />

            {/* 3D Canvas Layer - Only for MEDIUM and HIGH tiers */}
            {perfSettings.enable3D && perfSettings.shapeCount > 0 && (
                <div className="hero-canvas-container">
                    <Canvas
                        camera={{ position: [0, 0, 8], fov: 50 }}
                        dpr={1}
                        gl={{
                            antialias: perfSettings.tier === PERFORMANCE_TIERS.HIGH,
                            alpha: true,
                            powerPreference: 'high-performance',
                            failIfMajorPerformanceCaveat: true
                        }}
                    >
                        <Suspense fallback={null}>
                            <Scene3D
                                mousePosition={mousePosition}
                                shapeCount={perfSettings.shapeCount}
                                starCount={perfSettings.starCount}
                            />
                        </Suspense>
                    </Canvas>
                </div>
            )}

            {/* Particles Layer - Only if enabled */}
            {perfSettings.enableParticles && perfSettings.particleCount > 0 && (
                <ParticleNetwork particleCount={perfSettings.particleCount} />
            )}

            {/* Content Layer */}
            <div className="hero-content-layer">
                <div className="hero-content-wrapper">
                    {/* Skip to main content link for accessibility */}
                    <a href="#programs" className="skip-link">
                        Skip to main content
                    </a>

                    {/* Badge */}
                    <div className="hero-badge-futuristic">
                        <span className="badge-glow" />
                        <span className="badge-text">🚀 Bangladesh's Premier Coaching Center</span>
                    </div>

                    {/* Animated Headline */}
                    <AnimatedHeadline
                        headline={headline}
                        subtitles={subtitles}
                        enableAnimations={perfSettings.enableAnimations}
                    />

                    {/* Description */}
                    <p className="hero-description">
                        {description}
                    </p>

                    {/* CTA Buttons */}
                    <CTAButtons
                        primaryText={primaryCTA}
                        secondaryText={secondaryCTA}
                        onPrimaryClick={handlePrimaryCTA}
                        onSecondaryClick={handleSecondaryCTA}
                    />

                    {/* Floating Stats */}
                    <FloatingStatsCards stats={stats} />
                </div>
            </div>

            {/* Scroll Indicator */}
            <ScrollIndicator />

            {/* Bottom Wave */}
            <div className="hero-wave-bottom">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path
                        d="M0 120L48 110C96 100 192 80 288 70C384 60 480 60 576 65C672 70 768 80 864 85C960 90 1056 90 1152 85C1248 80 1344 70 1392 65L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z"
                        fill="white"
                    />
                </svg>
            </div>
        </section>
    )
}

export default HeroSection3D
