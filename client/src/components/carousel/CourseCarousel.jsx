import { useRef, useState, useEffect } from 'react'
import { Heart, Zap, BookOpen, GraduationCap, Target, ArrowRight, Star } from 'lucide-react'

const icons = {
    medical: Heart,
    engineering: Zap,
    hsc: BookOpen,
    ssc: BookOpen,
    university: GraduationCap,
    default: Target
}

function CourseCard({ course, isCenter }) {
    const Icon = icons[course.type] || icons.default
    const [isFlipped, setIsFlipped] = useState(false)

    return (
        <div
            className={`course-carousel-card ${isCenter ? 'is-center' : ''} ${isFlipped ? 'is-flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            {/* Front */}
            <div className="card-face card-front">
                <div className="course-image">
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <Icon size={40} className="text-white" />
                    </div>
                    {course.badge && (
                        <span className={`course-badge ${course.badge.toLowerCase()}`}>
                            {course.badge}
                        </span>
                    )}
                </div>
                <div className="course-body">
                    <h3 className="course-title font-bangla">{course.title}</h3>
                    <p className="course-desc font-bangla">{course.description}</p>
                    <div className="course-features">
                        {course.features?.slice(0, 2).map((feature, i) => (
                            <span key={i} className="feature-tag font-bangla">{feature}</span>
                        ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-yellow-500">
                            <Star size={14} fill="currentColor" />
                            <span className="text-sm text-gray-700">4.9</span>
                        </div>
                        <span className="text-blue-500 text-sm flex items-center gap-1 font-bangla">
                            বিস্তারিত <ArrowRight size={14} />
                        </span>
                    </div>
                </div>
            </div>

            {/* Back */}
            <div className="card-face card-back">
                <div className="p-6 h-full flex flex-col">
                    <h4 className="text-lg font-bold mb-4 font-bangla text-gray-900">{course.title}</h4>
                    <div className="space-y-3 flex-1">
                        {[
                            ['Duration', '6 Months'],
                            ['Classes', '3x/week'],
                            ['Batch Size', '30 Students'],
                            ['Mode', 'Offline + Online']
                        ].map(([label, value], i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-500">{label}</span>
                                <span className="text-gray-900 font-medium">{value}</span>
                            </div>
                        ))}
                    </div>
                    <button className="btn-cyber w-full mt-4 py-3 text-sm font-bangla">
                        এখনই ভর্তি হন
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function CourseCarousel({ courses = [] }) {
    const scrollRef = useRef(null)
    const [centerIndex, setCenterIndex] = useState(0)
    const [isMobile, setIsMobile] = useState(false)

    // Check for mobile screen size
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (!isMobile) return
        const container = scrollRef.current
        if (!container) return

        const handleScroll = () => {
            const containerRect = container.getBoundingClientRect()
            const centerX = containerRect.left + containerRect.width / 2
            const cards = container.querySelectorAll('.course-carousel-card')
            let closestIndex = 0
            let closestDistance = Infinity

            cards.forEach((card, index) => {
                const cardRect = card.getBoundingClientRect()
                const cardCenterX = cardRect.left + cardRect.width / 2
                const distance = Math.abs(centerX - cardCenterX)
                if (distance < closestDistance) {
                    closestDistance = distance
                    closestIndex = index
                }
            })

            setCenterIndex(closestIndex)
        }

        container.addEventListener('scroll', handleScroll)
        handleScroll()
        return () => container.removeEventListener('scroll', handleScroll)
    }, [isMobile])

    return (
        <div className="relative">
            {/* Gradient fades - only on mobile */}
            {isMobile && (
                <>
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
                </>
            )}

            {/* Desktop: Grid Layout | Mobile: Carousel */}
            <div
                ref={scrollRef}
                className={`
                    ${isMobile 
                        ? 'flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-6 py-4 -mx-4' 
                        : 'grid grid-cols-2 xl:grid-cols-4 gap-6'
                    }
                `}
                style={isMobile ? { scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } : {}}
            >
                {courses.map((course, index) => (
                    <div 
                        key={index} 
                        className={isMobile ? 'snap-center flex-shrink-0' : ''}
                        style={isMobile ? { width: 'min(280px, 75vw)' } : {}}
                    >
                        <CourseCard course={course} isCenter={isMobile ? index === centerIndex : true} />
                    </div>
                ))}
            </div>

            {/* Dots indicator - only on mobile */}
            {isMobile && (
                <div className="flex justify-center gap-2 mt-6">
                    {courses.map((_, index) => (
                        <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${index === centerIndex ? 'bg-blue-500 w-6' : 'bg-gray-300'}`}
                            onClick={() => {
                                const container = scrollRef.current
                                const cards = container.querySelectorAll('.course-carousel-card')
                                if (cards[index]) cards[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                            }}
                        />
                    ))}
                </div>
            )}

            <style jsx>{`
        .course-carousel-card {
          perspective: 1000px;
          height: 380px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        /* Mobile: scale effect for non-center cards */
        @media (max-width: 1023px) {
          .course-carousel-card {
            transform: scale(0.92);
            opacity: 0.7;
          }
          .course-carousel-card.is-center {
            transform: scale(1);
            opacity: 1;
          }
        }
        /* Desktop: all cards full size */
        @media (min-width: 1024px) {
          .course-carousel-card {
            transform: scale(1);
            opacity: 1;
          }
        }
        .card-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 24px;
          overflow: hidden;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .card-front { transform: rotateY(0deg); }
        .card-back {
          transform: rotateY(180deg);
          background: linear-gradient(135deg, #eff6ff, #fff7ed);
        }
        .course-carousel-card.is-flipped .card-front { transform: rotateY(-180deg); }
        .course-carousel-card.is-flipped .card-back { transform: rotateY(0deg); }
        .course-carousel-card { transform-style: preserve-3d; position: relative; }
        .course-image {
          height: 160px;
          background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .course-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          background: #10b981;
          color: white;
        }
        .course-badge.new { background: #a855f7; }
        .course-badge.hot { background: #ef4444; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
        </div>
    )
}
