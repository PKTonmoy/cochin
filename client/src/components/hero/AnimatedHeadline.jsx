import { useState, useEffect, useRef } from 'react'

const AnimatedHeadline = ({ headline = 'UNLOCK YOUR FUTURE', subtitles = [], enableAnimations = true }) => {
    const [currentSubtitle, setCurrentSubtitle] = useState(0)
    const [isAnimated, setIsAnimated] = useState(false)
    const subtitleRef = useRef(null)

    const defaultSubtitles = [
        'ENGINEERING EXCELLENCE',
        'MEDICAL MASTERY',
        'FOUNDATION STRENGTH',
        'COMPETITIVE EDGE'
    ]

    const activeSubtitles = subtitles.length > 0 ? subtitles : defaultSubtitles

    // Simple fade in on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnimated(true)
        }, 300)
        return () => clearTimeout(timer)
    }, [])

    // Rotate subtitles with simple transitions
    useEffect(() => {
        if (!enableAnimations) return

        const interval = setInterval(() => {
            setCurrentSubtitle((prev) => (prev + 1) % activeSubtitles.length)
        }, 3000)

        return () => clearInterval(interval)
    }, [activeSubtitles.length, enableAnimations])

    return (
        <div className="animated-headline-container">
            {/* Main Headline - Always visible */}
            <h1
                className="animated-headline"
                style={{
                    opacity: isAnimated ? 1 : 0,
                    transform: isAnimated ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.8s ease, transform 0.8s ease'
                }}
            >
                {headline}
            </h1>

            {/* Rotating Subtitle */}
            <div className="subtitle-container">
                <span
                    ref={subtitleRef}
                    className="rotating-subtitle"
                    key={currentSubtitle}
                    style={{
                        animation: enableAnimations ? 'fadeInUp 0.5s ease forwards' : 'none'
                    }}
                >
                    {activeSubtitles[currentSubtitle]}
                </span>
            </div>
        </div>
    )
}

export default AnimatedHeadline
