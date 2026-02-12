import { useRef, useState, useEffect, useCallback } from 'react'
import {
  Heart, Zap, BookOpen, GraduationCap, Target, ArrowRight, Star,
  Sparkles, Clock, Users, RotateCcw, CheckCircle2, ChevronLeft, ChevronRight,
  FlipHorizontal, Beaker, PenTool, Atom
} from 'lucide-react'

const icons = {
  medical: Heart,
  engineering: Zap,
  hsc: BookOpen,
  ssc: PenTool,
  university: GraduationCap,
  science: Atom,
  arts: Beaker,
  default: Target
}

const cardThemes = {
  medical: {
    gradient: 'linear-gradient(135deg, #e11d48 0%, #f97316 100%)',
    glow: 'rgba(225, 29, 72, 0.3)',
    accent: '#e11d48',
    accentLight: '#fda4af',
    bg: '#fff1f2',
    badge: '#10b981',
  },
  engineering: {
    gradient: 'linear-gradient(135deg, #0891b2 0%, #2563eb 100%)',
    glow: 'rgba(8, 145, 178, 0.3)',
    accent: '#0891b2',
    accentLight: '#a5f3fc',
    bg: '#ecfeff',
    badge: '#8b5cf6',
  },
  hsc: {
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)',
    glow: 'rgba(124, 58, 237, 0.3)',
    accent: '#7c3aed',
    accentLight: '#ddd6fe',
    bg: '#f5f3ff',
    badge: '#f97316',
  },
  ssc: {
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    glow: 'rgba(5, 150, 105, 0.3)',
    accent: '#059669',
    accentLight: '#a7f3d0',
    bg: '#ecfdf5',
    badge: '#3b82f6',
  },
  university: {
    gradient: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)',
    glow: 'rgba(234, 88, 12, 0.3)',
    accent: '#ea580c',
    accentLight: '#fed7aa',
    bg: '#fff7ed',
    badge: '#e11d48',
  },
  default: {
    gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    glow: 'rgba(37, 99, 235, 0.3)',
    accent: '#2563eb',
    accentLight: '#bfdbfe',
    bg: '#eff6ff',
    badge: '#f97316',
  }
}

function CourseCard({ course, isCenter }) {
  const Icon = icons[course.type] || icons.default
  const theme = cardThemes[course.type] || cardThemes.default
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleFlip = (e) => {
    e.stopPropagation()
    setIsFlipped(!isFlipped)
  }

  return (
    <div
      className={`transition-all duration-500 cursor-pointer`}
      style={{
        perspective: '1200px',
        height: '490px',
        transform: isCenter ? 'scale(1)' : 'scale(0.96)',
        opacity: isCenter ? 1 : 0.8,
        transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease',
      }}
      onClick={handleFlip}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ═══════════════ FRONT SIDE ═══════════════ */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '24px',
            overflow: 'hidden',
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: isHovered
              ? `0 20px 50px -10px rgba(0,0,0,0.15), 0 0 30px ${theme.glow}`
              : '0 4px 20px rgba(0,0,0,0.06)',
            transform: isHovered && !isFlipped ? 'translateY(-6px)' : 'translateY(0)',
            transition: 'box-shadow 0.4s ease, transform 0.4s ease',
          }}
        >
          {/* Header Gradient Area */}
          <div className="relative overflow-hidden" style={{ height: '180px', background: theme.gradient }}>
            {/* Decorative elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, white, transparent 70%)' }} />
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, white, transparent 70%)' }} />
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }} />
            </div>

            {/* Course image or icon */}
            {course.image ? (
              <>
                <img src={course.image?.url || course.image} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: theme.gradient, opacity: 0.6, mixBlendMode: 'multiply' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </>
            ) : null}

            {/* Floating Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="relative transition-all duration-500"
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '22px',
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.4)',
                  transform: isHovered ? 'translateY(-6px) scale(1.08)' : 'translateY(0) scale(1)',
                }}
              >
                <Icon size={32} className="text-white" strokeWidth={1.5} />
              </div>
            </div>

            {/* Badge */}
            {course.badge && (
              <div
                className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full z-10"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Sparkles size={11} style={{ color: theme.badge }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: theme.badge, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {course.badge}
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-5 flex flex-col" style={{ height: 'calc(100% - 180px)' }}>
            {/* Title */}
            <h3 className="text-lg font-bold text-slate-800 font-bangla leading-snug mb-2">
              {course.title}
            </h3>

            {/* Description */}
            {course.description && (
              <p className="text-[13px] text-slate-500 font-bangla leading-relaxed mb-3 line-clamp-2 flex-shrink-0">
                {course.description}
              </p>
            )}

            {/* Features list (Front) - Vertical Style */}
            <div className="space-y-2 mb-auto pt-1">
              {(course.features?.length > 0 ? course.features.slice(0, 3) : ['লাইভ ক্লাস', 'মডেল টেস্ট', 'নোট শীট']).map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} style={{ color: theme.accent }} className="flex-shrink-0" />
                  <span className="text-[13px] text-slate-600 font-bangla font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center pt-4 mt-3 border-t border-slate-100">
              <span className="text-[10px] font-medium text-slate-400/70 tracking-wide uppercase">Tap to see details</span>
            </div>
          </div>
        </div>

        {/* ═══════════════ BACK SIDE ═══════════════ */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: '24px',
            overflow: 'hidden',
            background: '#fafbfc',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          {/* Back Header */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ background: theme.gradient }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
              <Icon size={18} className="text-white" />
            </div>
            <h4 className="text-white font-bold text-[15px] font-bangla leading-tight flex-1 line-clamp-1">
              {course.title}
            </h4>
            <button
              onClick={handleFlip}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <RotateCcw size={14} className="text-white" />
            </button>
          </div>

          {/* Back Body */}
          <div className="p-5 flex flex-col" style={{ height: 'calc(100% - 64px)' }}>
            {/* Quick info grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { icon: Clock, label: 'সময়কাল', value: course.duration || '—' },
                { icon: Users, label: 'ব্যাচ সাইজ', value: course.totalSeats ? `${course.totalSeats} জন` : '—' },
                { icon: BookOpen, label: 'ক্লাস', value: course.classSchedule || '—' },
                { icon: Zap, label: 'মোড', value: course.mode ? course.mode.charAt(0).toUpperCase() + course.mode.slice(1) : '—' },
              ].map(({ icon: ItemIcon, label, value }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white"
                  style={{
                    border: '1px solid rgba(0,0,0,0.04)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: theme.bg }}>
                    <ItemIcon size={15} style={{ color: theme.accent }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold leading-none">{label}</p>
                    <p className="text-xs font-bold text-slate-700 font-bangla mt-0.5 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Features list */}
            <div className="space-y-2 mb-4 flex-1 overflow-y-auto custom-scrollbar">
              {/* Study Materials */}
              {course.studyMaterials?.length > 0 ? (
                <div className="pt-0 mt-0">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Study Materials</p>
                  {course.studyMaterials.map((m, i) => (
                    <div key={`mat-${i}`} className="flex items-center gap-2.5 mb-1 last:mb-0">
                      <BookOpen size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="text-[12px] text-slate-600 font-bangla">{m}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
                  No additional materials
                </div>
              )}
            </div>

            {/* Price */}
            {(course.pricing?.original || course.price || course.pricing?.discounted || course.discountPrice) && (
              <div className="flex items-center justify-center gap-3 mb-4">
                {(course.pricing?.original || course.price) && (
                  <span className={`text-slate-400 font-bangla ${(course.pricing?.discounted || course.discountPrice) ? 'text-xs line-through' : 'text-xl font-bold text-slate-800'}`}>
                    ৳{course.pricing?.original || course.price}
                  </span>
                )}
                {(course.pricing?.discounted || course.discountPrice) && (
                  <span className="text-xl font-bold font-bangla" style={{ color: theme.accent }}>
                    ৳{course.pricing?.discounted || course.discountPrice}
                  </span>
                )}
              </div>
            )}

            {/* CTA Button */}
            <a
              href="#contact"
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group/cta"
              style={{
                background: theme.gradient,
                boxShadow: `0 6px 20px ${theme.glow}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700" />
              <span className="font-bangla relative z-10">এখনই ভর্তি হন</span>
              <ArrowRight size={16} className="relative z-10" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CourseCarousel({ courses = [] }) {
  const scrollRef = useRef(null)
  const [centerIndex, setCenterIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Track center card for mobile
  useEffect(() => {
    if (!isMobile) return
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const rect = container.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cards = container.children
      let closest = 0, minDist = Infinity
      for (let i = 0; i < cards.length; i++) {
        const cr = cards[i].getBoundingClientRect()
        const d = Math.abs(cx - (cr.left + cr.width / 2))
        if (d < minDist) { minDist = d; closest = i }
      }
      setCenterIndex(closest)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isMobile])

  const scrollTo = useCallback((idx) => {
    const container = scrollRef.current
    if (!container || !container.children[idx]) return
    container.children[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [])

  return (
    <div className="relative">
      {/* Desktop: Grid | Mobile: Horizontal Scroll */}
      <div
        ref={scrollRef}
        className={
          isMobile
            ? 'flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 py-6 -mx-5'
            : 'grid grid-cols-2 xl:grid-cols-4 gap-6 py-8'
        }
        style={isMobile ? {
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
        } : {}}
      >
        {/* Hide scrollbar */}

        {courses.map((course, index) => (
          <div
            key={index}
            className={isMobile ? 'snap-always snap-center flex-shrink-0' : ''}
            style={isMobile ? { width: 'min(300px, 82vw)' } : {}}
          >
            <CourseCard course={course} isCenter={isMobile ? index === centerIndex : true} />
          </div>
        ))}
      </div>

      {/* Mobile Navigation */}
      {isMobile && courses.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-2 pb-2">
          {/* Left arrow */}
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md disabled:opacity-30"
            onClick={() => scrollTo(Math.max(0, centerIndex - 1))}
            disabled={centerIndex === 0}
          >
            <ChevronLeft size={16} className="text-slate-500" />
          </button>

          {/* Dots */}
          <div className="flex gap-1.5">
            {courses.map((_, index) => (
              <button
                key={index}
                className="rounded-full transition-all duration-300"
                style={{
                  width: index === centerIndex ? '24px' : '8px',
                  height: '8px',
                  background: index === centerIndex
                    ? 'linear-gradient(135deg, #3b82f6, #f97316)'
                    : '#cbd5e1',
                }}
                onClick={() => scrollTo(index)}
              />
            ))}
          </div>

          {/* Right arrow */}
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md disabled:opacity-30"
            onClick={() => scrollTo(Math.min(courses.length - 1, centerIndex + 1))}
            disabled={centerIndex === courses.length - 1}
          >
            <ChevronRight size={16} className="text-slate-500" />
          </button>
        </div>
      )}

      {/* Hide scrollbar */}
      {isMobile && (
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
      )}
    </div>
  )
}
