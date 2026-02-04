import { useState, useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

export default function HolographicStatCard({
    value,
    suffix = '+',
    label,
    icon: Icon,
    delay = 0,
    color = 'blue'
}) {
    const [count, setCount] = useState(0)
    const [tilt, setTilt] = useState({ x: 0, y: 0 })
    const cardRef = useRef(null)
    const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true })

    const numValue = parseInt(value) || 0

    // Counter animation
    useEffect(() => {
        if (!inView) return

        const duration = 2000
        const startTime = Date.now()

        const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * numValue))

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        const timer = setTimeout(() => {
            requestAnimationFrame(animate)
        }, delay)

        return () => clearTimeout(timer)
    }, [inView, numValue, delay])

    // Device orientation for 3D tilt
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!cardRef.current) return
            const rect = cardRef.current.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            setTilt({
                x: ((e.clientX - centerX) / rect.width) * 10,
                y: ((e.clientY - centerY) / rect.height) * -10
            })
        }

        const handleMouseLeave = () => {
            setTilt({ x: 0, y: 0 })
        }

        const card = cardRef.current
        if (card) {
            card.addEventListener('mousemove', handleMouseMove)
            card.addEventListener('mouseleave', handleMouseLeave)
        }

        return () => {
            if (card) {
                card.removeEventListener('mousemove', handleMouseMove)
                card.removeEventListener('mouseleave', handleMouseLeave)
            }
        }
    }, [])

    const colorMap = {
        blue: { gradient: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/20' },
        cyan: { gradient: 'from-cyan-500 to-blue-500', glow: 'shadow-cyan-500/20' },
        emerald: { gradient: 'from-emerald-500 to-cyan-500', glow: 'shadow-emerald-500/20' },
        orange: { gradient: 'from-orange-500 to-amber-500', glow: 'shadow-orange-500/20' }
    }

    const colorStyle = colorMap[color] || colorMap.blue

    return (
        <div
            ref={(node) => {
                ref(node)
                cardRef.current = node
            }}
            className={`stat-card-cyber transform-gpu transition-transform duration-200 ${inView ? 'reveal visible' : 'reveal'}`}
            style={{
                transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                animationDelay: `${delay}ms`
            }}
        >
            {/* Icon */}
            {Icon && (
                <div className={`stat-icon bg-gradient-to-br ${colorStyle.gradient} shadow-lg ${colorStyle.glow}`}>
                    <Icon size={28} strokeWidth={2} />
                </div>
            )}

            {/* Value */}
            <p className="stat-value">{count}{suffix}</p>

            {/* Label */}
            <p className="stat-label">{label}</p>

            {/* Progress bar */}
            <div className="mt-4 relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colorStyle.gradient} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: inView ? `${Math.min((count / numValue) * 100, 100)}%` : '0%' }}
                />
            </div>
        </div>
    )
}
