import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronRight, GraduationCap, Hash, Calendar, Award, Zap } from 'lucide-react'

export default function VictoryCard({
    student,
    rank = 1,
    index = 0,
    onViewStory
}) {
    const [isVisible, setIsVisible] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
    const cardRef = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.15 }
        )
        if (cardRef.current) observer.observe(cardRef.current)
        return () => observer.disconnect()
    }, [isVisible])

    const handleMouseMove = (e) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        setMousePos({
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
        })
    }

    const handleViewStory = (e) => {
        e.stopPropagation()
        if (onViewStory) onViewStory(index)
    }

    // Institution info mapping
    const getInstitutionInfo = (institution) => {
        const map = {
            'buet': { name: 'Bangladesh University of Engineering & Technology', short: 'BUET', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)' },
            'cuet': { name: 'Chittagong University of Engineering & Technology', short: 'CUET', gradient: 'linear-gradient(135deg, #134e4a 0%, #0d9488 50%, #14b8a6 100%)' },
            'kuet': { name: 'Khulna University of Engineering & Technology', short: 'KUET', gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 50%, #22c55e 100%)' },
            'ruet': { name: 'Rajshahi University of Engineering & Technology', short: 'RUET', gradient: 'linear-gradient(135deg, #3b0764 0%, #7c3aed 50%, #a78bfa 100%)' },
            'dhaka medical': { name: 'Dhaka Medical College', short: 'DMC', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #f87171 100%)' },
            'sir salimullah': { name: 'Sir Salimullah Medical College', short: 'SSMC', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #ef4444 100%)' },
            'medical': { name: 'Medical College', short: 'Medical', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #f87171 100%)' },
            'du': { name: 'University of Dhaka', short: 'DU', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)' },
            'ru': { name: 'University of Rajshahi', short: 'RU', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #60a5fa 100%)' },
            'cu': { name: 'University of Chittagong', short: 'CU', gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%)' },
            'ju': { name: 'Jahangirnagar University', short: 'JU', gradient: 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #4ade80 100%)' },
            'jnu': { name: 'Jagannath University', short: 'JnU', gradient: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #818cf8 100%)' },
            'gst': { name: 'General, Science & Technology', short: 'GST', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0369a1 50%, #0ea5e9 100%)' },
            'nu': { name: 'National University', short: 'NU', gradient: 'linear-gradient(135deg, #4a044e 0%, #a21caf 50%, #d946ef 100%)' },
            'ku': { name: 'Khulna University', short: 'KU', gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)' },
            'sust': { name: 'Shahjalal University of Science & Technology', short: 'SUST', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #6d28d9 50%, #8b5cf6 100%)' },
            'hust': { name: 'Hajee Mohammad Danesh Science & Technology University', short: 'HUST', gradient: 'linear-gradient(135deg, #422006 0%, #b45309 50%, #f59e0b 100%)' },
            'bup': { name: 'Bangladesh University of Professionals', short: 'BUP', gradient: 'linear-gradient(135deg, #1c1917 0%, #44403c 50%, #78716c 100%)' },
            'nsu': { name: 'North South University', short: 'NSU', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #3b82f6 100%)' },
            'brac': { name: 'BRAC University', short: 'BRACU', gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #f97316 100%)' },
            'iut': { name: 'Islamic University of Technology', short: 'IUT', gradient: 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #22c55e 100%)' },
        }
        if (!institution) return { name: 'Paragon Academy', short: 'PARAGON', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #f97316 100%)' }
        const lower = institution.toLowerCase()
        for (const [key, value] of Object.entries(map)) {
            if (lower.includes(key)) return value
        }
        return { name: institution, short: institution.substring(0, 10), gradient: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #f97316 100%)' }
    }

    const info = getInstitutionInfo(student.institution || student.admittedTo)

    const cardId = useMemo(() => {
        const yr = student.year || '2024'
        return `PRG-${yr}-${String(index + 1).padStart(3, '0')}`
    }, [student.year, index])

    // Stable barcode
    const barBits = useMemo(() => {
        const s = index * 7 + 3
        return Array.from({ length: 36 }, (_, i) => ((s * (i + 1) * 13) % 17) > 8 ? 2 : 1)
    }, [index])

    const tiltX = isHovered ? (mousePos.y - 0.5) * -6 : 0
    const tiltY = isHovered ? (mousePos.x - 0.5) * 6 : 0

    return (
        <div
            ref={cardRef}
            className={`h-full transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            style={{ animationDelay: `${index * 150}ms`, perspective: '800px' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }) }}
            onMouseMove={handleMouseMove}
        >
            <div
                className="relative overflow-hidden transition-all duration-500 flex flex-col h-full"
                style={{
                    borderRadius: '20px',
                    background: '#ffffff',
                    boxShadow: isHovered
                        ? '0 30px 60px -12px rgba(0,0,0,0.2), 0 0 40px rgba(59,130,246,0.12)'
                        : '0 10px 40px -8px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                    transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) ${isHovered ? 'translateY(-6px)' : ''}`,
                    transformStyle: 'preserve-3d',
                    border: '1px solid rgba(0,0,0,0.06)',
                }}
            >

                {/* ══════════════════════════════════════════
                     HEADER — Full-width gradient with mesh  
                   ══════════════════════════════════════════ */}
                <div className="relative overflow-hidden" style={{ background: info.gradient }}>
                    {/* Mesh / glow blobs */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6), transparent 70%)' }} />
                        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)' }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.04]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }}
                        />
                    </div>

                    {/* Header content */}
                    <div className="relative px-5 pt-6 pb-16">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{
                                        background: 'rgba(255,255,255,0.15)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                    }}
                                >
                                    <GraduationCap size={20} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold leading-tight" style={{ fontSize: '14px', letterSpacing: '0.03em' }}>
                                        {info.name}
                                    </h4>
                                    <p className="text-white/50 font-medium mt-1" style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                        Student Identity Card
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════
                     BODY — Photo + Info in glass card
                   ══════════════════════════════════════════ */}
                <div className="px-5 -mt-10 relative z-10 pb-5 flex-1 flex flex-col">
                    {/* Glass info card */}
                    <div
                        className="rounded-2xl p-5 transition-all duration-300"
                        style={{
                            background: 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.6)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                        }}
                    >
                        <div className="flex gap-4">
                            {/* Photo */}
                            <div className="flex-shrink-0">
                                <div
                                    className="overflow-hidden transition-all duration-400"
                                    style={{
                                        width: '86px',
                                        height: '104px',
                                        borderRadius: '14px',
                                        boxShadow: isHovered
                                            ? '0 12px 28px rgba(59,130,246,0.2), 0 0 0 2px rgba(59,130,246,0.15)'
                                            : '0 6px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                                        transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                                    }}
                                >
                                    {student.image ? (
                                        <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ background: info.gradient }}>
                                            <span className="text-white text-2xl font-bold">{student.name?.charAt(0) || 'S'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-3">
                                {/* Name */}
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-0.5">Student Name</p>
                                    <h3 className="text-lg font-extrabold text-slate-800 font-bangla leading-snug truncate">{student.name}</h3>
                                </div>

                                {/* Merit — highlighted */}
                                <div className="flex items-center gap-2">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(249,115,22,0.08))',
                                            border: '1px solid rgba(59,130,246,0.12)',
                                        }}
                                    >
                                        <Award size={14} className="text-blue-500" />
                                        <span className="text-sm font-extrabold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text" style={{ WebkitTextFillColor: 'transparent' }}>
                                            {student.score || student.meritPosition || 'N/A'}
                                        </span>
                                    </div>
                                    {student.year && (
                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                            <Calendar size={12} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500">{student.year}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Admission test */}
                                {student.achievement && (
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.1em] font-bold mb-0.5">Exam</p>
                                        <p className="text-[13px] font-semibold text-slate-600 truncate">{student.achievement}</p>
                                    </div>
                                )}

                                {/* Unit Badge */}
                                {student.section && (
                                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(59,130,246,0.08))', border: '1px solid rgba(249,115,22,0.15)' }}>
                                        <span className="text-[11px] font-bold bg-gradient-to-r from-orange-500 to-blue-500 bg-clip-text" style={{ WebkitTextFillColor: 'transparent' }}>Unit {student.section}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════
                     FOOTER — Barcode + Button
                   ══════════════════════════════════════════ */}
                <div className="px-5 pb-4">
                    {/* Barcode row */}
                    <div className="flex items-end justify-between mb-3 px-1">
                        <div className="flex items-end gap-[1.5px]" style={{ height: '18px' }}>
                            {barBits.map((w, i) => (
                                <div
                                    key={i}
                                    className="rounded-[0.5px]"
                                    style={{
                                        width: `${w}px`,
                                        height: `${10 + (((index * 7 + i * 3) % 5) * 1.5)}px`,
                                        background: `rgba(148,163,184,${i % 3 === 0 ? 0.35 : 0.18})`,
                                    }}
                                />
                            ))}
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-slate-300 font-mono font-bold tracking-widest">{cardId}</p>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleViewStory}
                        className="w-full py-3 rounded-xl text-white font-bold text-[13px] flex items-center justify-center gap-2 transition-all duration-300 group/btn relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                            boxShadow: '0 6px 20px rgba(59,130,246,0.3)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(59,130,246,0.4)'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.3)'
                            e.currentTarget.style.transform = 'translateY(0)'
                        }}
                    >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                        <Zap size={14} className="relative z-10" />
                        <span className="font-bangla relative z-10">সাফল্যের গল্প</span>
                        <ChevronRight size={15} className="relative z-10 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* Bottom gradient accent */}
                <div className="h-1" style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #f97316, #fb923c)' }} />

                {/* Holographic shimmer overlay on hover */}
                <div
                    className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-500 rounded-[20px]"
                    style={{
                        opacity: isHovered ? 0.15 : 0,
                        background: `linear-gradient(${120 + (mousePos.x - 0.5) * 80}deg, 
                            transparent 25%,
                            rgba(59,130,246,0.15) 35%,
                            rgba(249,115,22,0.1) 45%,
                            rgba(16,185,129,0.1) 55%,
                            rgba(139,92,246,0.1) 65%,
                            transparent 75%)`,
                    }}
                />
            </div>
        </div>
    )
}
