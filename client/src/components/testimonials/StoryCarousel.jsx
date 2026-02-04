import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Star, Trophy, Pause, Play, Share2 } from 'lucide-react'

export default function StoryCarousel({
    testimonials = [],
    isOpen = false,
    onClose,
    startIndex = 0
}) {
    const [currentIndex, setCurrentIndex] = useState(startIndex)
    const [progress, setProgress] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const intervalRef = useRef(null)
    const containerRef = useRef(null)

    const STORY_DURATION = 5000
    const current = testimonials[currentIndex]

    const goNext = () => {
        if (currentIndex < testimonials.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setProgress(0)
        } else {
            onClose?.()
        }
    }

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
            setProgress(0)
        }
    }

    useEffect(() => {
        if (!isOpen || isPaused) return

        intervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    goNext()
                    return 0
                }
                return prev + (100 / (STORY_DURATION / 100))
            })
        }, 100)

        return () => clearInterval(intervalRef.current)
    }, [isOpen, isPaused, currentIndex])

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(startIndex)
            setProgress(0)
        }
    }, [isOpen, startIndex])

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left

        if (x < rect.width / 3) goPrev()
        else if (x > (rect.width * 2) / 3) goNext()
    }

    if (!isOpen || !current) return null

    // Light gradient backgrounds
    const gradients = [
        'from-blue-500 via-blue-600 to-cyan-500',
        'from-blue-600 via-indigo-600 to-purple-500',
        'from-orange-400 via-orange-500 to-amber-500',
        'from-emerald-500 via-teal-500 to-cyan-500',
    ]
    const bgGradient = gradients[currentIndex % gradients.length]

    return (
        <div className="fixed inset-0 z-50 bg-black/80">
            <div
                ref={containerRef}
                className={`relative w-full h-full bg-gradient-to-b ${bgGradient} flex flex-col`}
                onClick={handleClick}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
            >
                {/* Progress bars */}
                <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                    {testimonials.map((_, idx) => (
                        <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-100"
                                style={{ width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold ring-2 ring-white/50">
                            {current.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <p className="font-semibold text-white text-sm">{current.name}</p>
                            <p className="text-white/80 text-xs">{current.achievement} • {current.year}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused) }}
                            className="p-2 rounded-full bg-white/20 backdrop-blur"
                        >
                            {isPaused ? <Play size={16} className="text-white" /> : <Pause size={16} className="text-white" />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose?.() }}
                            className="p-2 rounded-full bg-white/20 backdrop-blur"
                        >
                            <X size={16} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex items-center justify-center px-8 py-20">
                    <div className="text-center max-w-md">
                        <div className="mb-8">
                            <span className="text-6xl text-white/30 font-serif">"</span>
                            <p className="text-xl md:text-2xl text-white font-medium leading-relaxed -mt-8 font-bangla">
                                {current.testimonial}
                            </p>
                        </div>

                        {current.result && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full mb-6">
                                <Trophy size={18} className="text-yellow-300" />
                                <span className="text-white font-semibold">{current.result}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={20} className="text-yellow-300" fill="currentColor" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Counter */}
                <div className="absolute bottom-8 right-4 text-white/60 text-sm z-20">
                    {currentIndex + 1} / {testimonials.length}
                </div>
            </div>
        </div>
    )
}

// Story preview circles
export function StoryPreviews({ testimonials = [], onOpen }) {
    return (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 -mx-4 py-2" style={{ scrollbarWidth: 'none' }}>
            {testimonials.map((testimonial, index) => (
                <button
                    key={index}
                    onClick={() => onOpen(index)}
                    className="flex-shrink-0 flex flex-col items-center gap-2 group"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-orange-500 to-pink-500 rounded-full p-0.5">
                            <div className="w-full h-full rounded-full bg-white p-0.5">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform shadow-md">
                                    {testimonial.name?.charAt(0) || 'S'}
                                </div>
                            </div>
                        </div>
                        <div className="w-[72px] h-[72px]" />
                    </div>
                    <span className="text-xs text-gray-500 max-w-[80px] truncate">
                        {testimonial.name?.split(' ')[0]}
                    </span>
                </button>
            ))}
        </div>
    )
}
