/**
 * Statistics Block Component
 * Animated counters showing achievements
 */

import { useState, useEffect, useRef } from 'react'
import { Users, TrendingUp, Award, GraduationCap, BookOpen, Clock, Target, Star } from 'lucide-react'

const iconMap = {
    users: Users,
    'trending-up': TrendingUp,
    award: Award,
    'graduation-cap': GraduationCap,
    book: BookOpen,
    clock: Clock,
    target: Target,
    star: Star
}

// Animated counter hook
const useCounter = (end, duration = 2000, startOnView = true) => {
    const [count, setCount] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!startOnView) {
            setIsVisible(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.2 }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [startOnView])

    useEffect(() => {
        if (!isVisible) return

        let startTime
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / duration, 1)
            setCount(Math.floor(progress * end))
            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }, [isVisible, end, duration])

    return { count, ref }
}

const StatItem = ({ stat, isEditing, onUpdate }) => {
    const { count, ref } = useCounter(stat.value || 0, 2000, !isEditing)
    const Icon = iconMap[stat.icon] || Star

    return (
        <div
            ref={ref}
            style={{
                textAlign: 'center',
                padding: '24px'
            }}
        >
            <div
                style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#fef2f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                }}
            >
                <Icon size={28} color="#dc2626" />
            </div>

            <div
                style={{
                    fontSize: '42px',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '8px'
                }}
            >
                {isEditing ? stat.value : count}{stat.suffix || '+'}
            </div>

            <div
                style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    fontWeight: '500'
                }}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onBlur={(e) => onUpdate('label', e.target.innerText)}
            >
                {stat.label}
            </div>
        </div>
    )
}

const StatisticsBlock = ({ section, content, styles, isEditing, onContentChange }) => {
    const defaultContent = {
        title: { text: 'Our Achievements', fontSize: '32px', color: '#1f2937' },
        stats: [
            { value: 500, suffix: '+', label: 'Students', icon: 'users' },
            { value: 95, suffix: '%', label: 'Success Rate', icon: 'trending-up' },
            { value: 10, suffix: '+', label: 'Years Experience', icon: 'award' },
            { value: 50, suffix: '+', label: 'Expert Teachers', icon: 'graduation-cap' }
        ],
        animated: true
    }

    const c = { ...defaultContent, ...content }
    const s = styles || {}

    const sectionStyle = {
        backgroundColor: s.backgroundColor || '#ffffff',
        padding: s.padding ? `${s.padding.top} ${s.padding.right} ${s.padding.bottom} ${s.padding.left}` : '60px 20px'
    }

    const containerStyle = {
        maxWidth: s.maxWidth || '1200px',
        margin: '0 auto'
    }

    return (
        <section className="block-statistics" style={sectionStyle}>
            <div style={containerStyle}>
                {/* Title */}
                {c.title?.text && (
                    <h2
                        style={{
                            fontSize: c.title.fontSize,
                            color: c.title.color,
                            textAlign: 'center',
                            marginBottom: '48px'
                        }}
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => onContentChange('title.text', e.target.innerText)}
                    >
                        {c.title.text}
                    </h2>
                )}

                {/* Stats Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${c.stats?.length || 4}, 1fr)`,
                        gap: '24px'
                    }}
                >
                    {c.stats?.map((stat, index) => (
                        <StatItem
                            key={index}
                            stat={stat}
                            isEditing={isEditing}
                            onUpdate={(field, value) => {
                                const newStats = [...c.stats]
                                newStats[index] = { ...stat, [field]: value }
                                onContentChange('stats', newStats)
                            }}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default StatisticsBlock
