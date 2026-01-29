import { useEffect, useState, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { gsap } from 'gsap'

const ScrollIndicator = () => {
    const [isVisible, setIsVisible] = useState(true)
    const indicatorRef = useRef(null)
    const mouseRef = useRef(null)

    // Hide on scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY < 100)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Bouncing animation
    useEffect(() => {
        if (indicatorRef.current) {
            gsap.fromTo(
                indicatorRef.current,
                { opacity: 0, y: -20 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    delay: 3,
                    ease: 'back.out(1.4)'
                }
            )
        }

        if (mouseRef.current) {
            // Continuous bounce animation
            gsap.to(mouseRef.current, {
                y: 8,
                duration: 0.8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            })
        }
    }, [])

    const handleClick = () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        })
    }

    return (
        <div
            ref={indicatorRef}
            className={`scroll-indicator-advanced ${isVisible ? 'visible' : 'hidden'}`}
            onClick={handleClick}
        >
            <div ref={mouseRef} className="mouse-wrapper">
                <div className="mouse">
                    <div className="mouse-wheel" />
                </div>
            </div>
            <div className="scroll-text">
                <span>Scroll to Explore</span>
                <ChevronDown size={16} className="chevron" />
            </div>
        </div>
    )
}

export default ScrollIndicator
