import { useState, useEffect, useRef } from 'react'
import { Trophy, Users, GraduationCap, Award } from 'lucide-react'
import { gsap } from 'gsap'

const FloatingStatsCards = ({ stats }) => {
    const containerRef = useRef(null)
    const cardRefs = useRef([])

    const defaultStats = [
        { value: '98%', label: 'Success Rate', icon: Trophy },
        { value: '5000+', label: 'Students', icon: Users },
        { value: '15+', label: 'Years Excellence', icon: Award },
        { value: '50+', label: 'Expert Teachers', icon: GraduationCap }
    ]

    const activeStats = stats || defaultStats

    // Animate cards on mount
    useEffect(() => {
        if (cardRefs.current.length > 0) {
            gsap.fromTo(
                cardRefs.current,
                {
                    opacity: 0,
                    y: 60,
                    scale: 0.8
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: 'back.out(1.4)',
                    delay: 1.5
                }
            )
        }
    }, [])

    // Floating animation for each card
    useEffect(() => {
        cardRefs.current.forEach((card, index) => {
            if (card) {
                gsap.to(card, {
                    y: `+=${5 + index * 2}`,
                    duration: 2 + index * 0.3,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut'
                })
            }
        })
    }, [])

    return (
        <div ref={containerRef} className="floating-stats-container">
            {activeStats.map((stat, index) => {
                const Icon = stat.icon || Trophy
                const positions = [
                    { top: '15%', left: '-5%' },
                    { top: '35%', right: '-8%' },
                    { bottom: '30%', left: '-3%' },
                    { bottom: '10%', right: '-5%' }
                ]
                const position = positions[index % 4]

                return (
                    <div
                        key={index}
                        ref={(el) => (cardRefs.current[index] = el)}
                        className="floating-stat-card"
                        style={position}
                    >
                        <div className="stat-icon-wrapper">
                            <Icon size={24} />
                        </div>
                        <div className="stat-content">
                            <CountUpValue value={stat.value} />
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// Counter animation component
const CountUpValue = ({ value }) => {
    const [displayValue, setDisplayValue] = useState('0')
    const ref = useRef(null)
    const hasAnimated = useRef(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true
                    animateValue()
                }
            },
            { threshold: 0.5 }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [value])

    const animateValue = () => {
        // Extract number and suffix from value
        const match = value.match(/^([\d.]+)(.*)$/)
        if (!match) {
            setDisplayValue(value)
            return
        }

        const targetNum = parseFloat(match[1])
        const suffix = match[2] || ''
        const isFloat = match[1].includes('.')

        let startTime
        const duration = 2000

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / duration, 1)
            const easeProgress = 1 - Math.pow(1 - progress, 3) // Ease out cubic

            const current = easeProgress * targetNum
            if (isFloat) {
                setDisplayValue(current.toFixed(0) + suffix)
            } else {
                setDisplayValue(Math.floor(current) + suffix)
            }

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                setDisplayValue(value)
            }
        }

        requestAnimationFrame(animate)
    }

    return <span ref={ref} className="stat-value">{displayValue}</span>
}

export default FloatingStatsCards
