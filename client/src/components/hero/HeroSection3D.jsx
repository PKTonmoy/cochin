import { useEffect, useRef, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Float, Sparkles, MeshDistortMaterial } from '@react-three/drei'
import { gsap } from 'gsap'
import { ArrowRight, Play, ChevronDown, Sparkles as SparklesIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

// 3D Floating Sphere - Light Blue Theme
function FloatingSphere({ position, color, speed = 1, distort = 0.4 }) {
    return (
        <Float speed={speed} rotationIntensity={0.5} floatIntensity={1}>
            <mesh position={position}>
                <sphereGeometry args={[1, 64, 64]} />
                <MeshDistortMaterial
                    color={color}
                    transparent
                    opacity={0.4}
                    distort={distort}
                    speed={2}
                    roughness={0.3}
                />
            </mesh>
        </Float>
    )
}

// 3D Scene - Light theme colors
function Scene3D() {
    return (
        <>
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f97316" />

            <FloatingSphere position={[-4, 2, -3]} color="#3b82f6" speed={1.5} distort={0.3} />
            <FloatingSphere position={[4, -1, -4]} color="#f97316" speed={1} distort={0.4} />
            <FloatingSphere position={[0, 2, -5]} color="#06b6d4" speed={2} distort={0.3} />

            <Sparkles count={60} scale={12} size={1.5} speed={0.2} color="#3b82f6" opacity={0.5} />
        </>
    )
}

// Animated Typewriter Text
function TypewriterText({ texts, className }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [displayText, setDisplayText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const currentText = texts[currentIndex]
        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (displayText.length < currentText.length) {
                    setDisplayText(currentText.slice(0, displayText.length + 1))
                } else {
                    setTimeout(() => setIsDeleting(true), 2000)
                }
            } else {
                if (displayText.length > 0) {
                    setDisplayText(displayText.slice(0, -1))
                } else {
                    setIsDeleting(false)
                    setCurrentIndex((prev) => (prev + 1) % texts.length)
                }
            }
        }, isDeleting ? 50 : 100)

        return () => clearTimeout(timeout)
    }, [displayText, isDeleting, currentIndex, texts])

    return (
        <span className={className}>
            {displayText}
            <span className="animate-blink text-primary">|</span>
        </span>
    )
}

// Main Hero Component
export function HeroSection3D({ content, stats, mobileName, animatedTexts, titleLine1, titleLine2, heroBadge }) {
    const heroRef = useRef(null)

    const defaultSubtitles = [
        'Engineering Excellence',
        'Medical Mastery',
        'Academic Success',
        'Future Leaders'
    ]

    const subtitles = (animatedTexts && animatedTexts.length > 0) ? animatedTexts : defaultSubtitles

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hero-animate', {
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out',
            })
        }, heroRef)

        return () => ctx.revert()
    }, [])


    const scrollToPrograms = () => {
        const element = document.getElementById('programs')
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <section ref={heroRef} className="hero-cyber relative">
            {/* 3D Canvas Background */}
            <div className="absolute inset-0 z-0 opacity-60">
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                    <Suspense fallback={null}>
                        <Scene3D />
                    </Suspense>
                </Canvas>
            </div>

            {/* Morphing Blobs - Light colors */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-morph" />
            <div className="absolute bottom-40 right-10 w-96 h-96 bg-orange-400/15 rounded-full blur-3xl animate-morph" style={{ animationDelay: '-4s' }} />

            {/* Content */}
            <div className="relative z-20 container-cyber text-center">
                {/* Badge */}
                <div className="hero-animate inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-6">
                    <SparklesIcon size={16} className="text-blue-500" />
                    <span className="text-sm font-semibold text-blue-600">
                        {heroBadge || '#1 Coaching Center in Bangladesh'}
                    </span>
                </div>

                {/* Main Title */}
                <h1 className="hero-animate hero-title">
                    {mobileName && (
                        <div className="relative inline-block md:hidden mb-6">
                            {/* Organic blob background - matches theme */}
                            <div className="absolute -inset-6 sm:-inset-8 -z-10 flex items-center justify-center">
                                <div
                                    className="w-full h-full animate-morph"
                                    style={{
                                        background: 'radial-gradient(ellipse at 45% 50%, rgba(59, 130, 246, 0.15) 0%, rgba(96, 165, 250, 0.12) 40%, rgba(191, 219, 254, 0.18) 70%, transparent 100%)',
                                        borderRadius: '60% 40% 45% 55% / 55% 45% 55% 45%',
                                        filter: 'blur(2px)',
                                        transform: 'scale(1.4) rotate(-3deg)',
                                    }}
                                />
                            </div>
                            {/* Subtle inner glow */}
                            <div
                                className="absolute -inset-4 sm:-inset-6 -z-10"
                                style={{
                                    background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
                                    borderRadius: '50%',
                                    filter: 'blur(8px)',
                                }}
                            />
                            <span className="relative block text-3xl sm:text-4xl font-extrabold gradient-text font-bangla tracking-wide py-3 px-4 z-10">
                                {mobileName}
                            </span>
                        </div>
                    )}
                    <span className="block text-gray-900">{titleLine1 || 'Transform Your'}</span>
                    <span className="block gradient-text">{titleLine2 || 'Future Today'}</span>
                </h1>

                {/* Typewriter Subtitle */}
                <div className="hero-animate hero-subtitle font-bangla">
                    <TypewriterText
                        texts={subtitles}
                        className="text-orange-500 font-semibold"
                    />
                    <span className="block mt-2 text-gray-500">
                        {content.subtitle || 'শিক্ষায় শ্রেষ্ঠত্ব অর্জনের বিশ্বস্ত সঙ্গী'}
                    </span>
                </div>

                {/* CTA Buttons */}
                <div className="hero-animate flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <a href="#contact" className="btn-cyber">
                        <span className="font-bangla">এখনই শুরু করুন</span>
                        <ArrowRight size={20} />
                    </a>
                </div>

                {/* Scroll Indicator - positioned above stats on mobile, between CTA and stats */}
                <button
                    onClick={scrollToPrograms}
                    className="hero-animate flex flex-col items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer mt-8 mb-4 mx-auto"
                >
                    <span className="text-sm">Scroll to explore</span>
                    <ChevronDown size={24} className="animate-bounce" />
                </button>

                {/* Quick Stats */}
                <div className="hero-animate grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
                    {(stats?.slice?.(0, 4) || [
                        { value: '1000', suffix: '+', label: 'Students' },
                        { value: '50', suffix: '+', label: 'Teachers' },
                        { value: '10', suffix: '+', label: 'Years' },
                        { value: '95', suffix: '%', label: 'Success' }
                    ]).map((stat, index) => (
                        <div key={index} className="glass-card p-4 text-center">
                            <p className="text-2xl sm:text-3xl font-bold gradient-text">
                                {stat.value}{stat.suffix}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default HeroSection3D
