import { useRef, useEffect, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { gsap } from 'gsap'

const CTAButtons = ({
    primaryText = 'Start Your Journey',
    secondaryText = 'Explore Courses',
    onPrimaryClick,
    onSecondaryClick
}) => {
    const primaryRef = useRef(null)
    const secondaryRef = useRef(null)
    const containerRef = useRef(null)
    const [ripples, setRipples] = useState([])

    // Animate buttons on mount
    useEffect(() => {
        if (containerRef.current) {
            gsap.fromTo(
                containerRef.current.children,
                {
                    opacity: 0,
                    y: 40,
                    scale: 0.9
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    stagger: 0.15,
                    ease: 'back.out(1.4)',
                    delay: 2
                }
            )
        }
    }, [])

    // Ripple effect handler
    const createRipple = (event, buttonRef) => {
        const button = buttonRef.current
        if (!button) return

        const rect = button.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const ripple = {
            id: Date.now(),
            x,
            y
        }

        setRipples((prev) => [...prev, ripple])

        // Remove ripple after animation
        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
        }, 600)
    }

    // Hover animation for primary button
    const handlePrimaryHover = (isHovering) => {
        if (primaryRef.current) {
            gsap.to(primaryRef.current, {
                scale: isHovering ? 1.05 : 1,
                boxShadow: isHovering
                    ? '0 20px 50px rgba(6, 182, 212, 0.4)'
                    : '0 10px 30px rgba(6, 182, 212, 0.3)',
                duration: 0.3,
                ease: 'power2.out'
            })
        }
    }

    return (
        <div ref={containerRef} className="cta-buttons-container">
            {/* Primary CTA Button */}
            <button
                ref={primaryRef}
                className="cta-button-primary"
                onClick={(e) => {
                    createRipple(e, primaryRef)
                    onPrimaryClick?.()
                }}
                onMouseEnter={() => handlePrimaryHover(true)}
                onMouseLeave={() => handlePrimaryHover(false)}
            >
                <span className="button-glow" />
                <span className="button-content">
                    <Sparkles size={20} className="button-icon" />
                    <span>{primaryText}</span>
                    <ArrowRight size={20} className="arrow-icon" />
                </span>

                {/* Ripple effects */}
                {ripples.map((ripple) => (
                    <span
                        key={ripple.id}
                        className="ripple"
                        style={{
                            left: ripple.x,
                            top: ripple.y
                        }}
                    />
                ))}
            </button>

            {/* Secondary CTA Button */}
            <button
                ref={secondaryRef}
                className="cta-button-secondary"
                onClick={(e) => {
                    createRipple(e, secondaryRef)
                    onSecondaryClick?.()
                }}
            >
                <span className="button-border" />
                <span className="button-content">
                    <span>{secondaryText}</span>
                    <ArrowRight size={18} className="arrow-icon" />
                </span>
            </button>
        </div>
    )
}

export default CTAButtons
