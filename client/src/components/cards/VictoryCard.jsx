import { useState, useEffect, useRef } from 'react'
import { Trophy, Crown, Star, Medal, ChevronRight } from 'lucide-react'
import Confetti from 'react-confetti'

export default function VictoryCard({
    student,
    rank = 1,
    index = 0
}) {
    const [showConfetti, setShowConfetti] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const cardRef = useRef(null)

    const isTopRank = rank <= 3

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true)
                    if (rank === 1) {
                        setTimeout(() => setShowConfetti(true), 500)
                        setTimeout(() => setShowConfetti(false), 4000)
                    }
                }
            },
            { threshold: 0.5 }
        )

        if (cardRef.current) observer.observe(cardRef.current)
        return () => observer.disconnect()
    }, [rank, isVisible])

    const rankStyles = {
        1: {
            gradient: 'from-yellow-400 via-yellow-500 to-amber-500',
            glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
            text: 'text-yellow-500',
            bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
            border: 'border-yellow-200',
            icon: Crown
        },
        2: {
            gradient: 'from-slate-300 via-slate-400 to-slate-500',
            glow: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]',
            text: 'text-slate-500',
            bg: 'bg-gradient-to-br from-slate-50 to-gray-50',
            border: 'border-slate-200',
            icon: Medal
        },
        3: {
            gradient: 'from-amber-500 via-amber-600 to-orange-600',
            glow: 'shadow-[0_0_20px_rgba(217,119,6,0.2)]',
            text: 'text-amber-600',
            bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
            border: 'border-amber-200',
            icon: Medal
        }
    }

    const style = rankStyles[rank] || {
        gradient: 'from-blue-500 to-cyan-500',
        glow: 'shadow-glow-md',
        text: 'text-blue-500',
        bg: 'bg-white',
        border: 'border-gray-200',
        icon: Trophy
    }

    const RankIcon = style.icon

    return (
        <div
            ref={cardRef}
            className={`victory-card relative overflow-hidden rounded-3xl border transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                } ${style.bg} ${isTopRank ? style.glow : 'shadow-lg'} ${style.border}`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Confetti for rank 1 */}
            {showConfetti && rank === 1 && (
                <Confetti
                    width={cardRef.current?.offsetWidth || 300}
                    height={cardRef.current?.offsetHeight || 400}
                    recycle={false}
                    numberOfPieces={100}
                    gravity={0.3}
                    colors={['#fbbf24', '#f59e0b', '#3b82f6', '#06b6d4', '#10b981']}
                    style={{ position: 'absolute', top: 0, left: 0 }}
                />
            )}

            {/* Content */}
            <div className="relative z-10 p-6">
                {/* Header with rank */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white text-xl font-bold relative shadow-lg`}>
                            {student.image ? (
                                <img src={student.image} alt={student.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                student.name?.charAt(0) || 'S'
                            )}
                            {rank === 1 && (
                                <Crown
                                    size={20}
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-lg animate-bounce"
                                    fill="currentColor"
                                />
                            )}
                        </div>

                        <div>
                            <h3 className="font-bold text-lg text-gray-900 font-bangla">{student.name}</h3>
                            <p className={`text-sm ${style.text}`}>{student.achievement}</p>
                        </div>
                    </div>

                    {/* Rank badge */}
                    <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${style.gradient} text-white font-bold flex items-center gap-1 shadow-md`}>
                        <RankIcon size={16} />
                        <span>#{rank}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/80 p-3 rounded-xl text-center border border-gray-100 shadow-sm">
                        <p className="text-2xl font-bold gradient-text">{student.score || 'AIR 45'}</p>
                        <p className="text-xs text-gray-500">Rank/Score</p>
                    </div>
                    <div className="bg-white/80 p-3 rounded-xl text-center border border-gray-100 shadow-sm">
                        <p className="text-2xl font-bold text-orange-500">{student.percentile || '99.8%'}</p>
                        <p className="text-xs text-gray-500">Percentile</p>
                    </div>
                </div>

                {/* Subject breakdown */}
                <div className="space-y-2 mb-4">
                    {(student.subjects || [
                        { name: 'Physics', score: 95 },
                        { name: 'Chemistry', score: 92 },
                        { name: 'Maths', score: 98 }
                    ]).map((subject, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-16">{subject.name}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${style.gradient} rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: isVisible ? `${subject.score}%` : '0%' }}
                                />
                            </div>
                            <span className="text-xs font-medium text-gray-700 w-8">{subject.score}%</span>
                        </div>
                    ))}
                </div>

                {/* View story button */}
                <button className="w-full btn-glass py-3 text-sm flex items-center justify-center gap-2 group">
                    <span className="font-bangla">সাফল্যের গল্প</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-blue-500" />
                </button>
            </div>
        </div>
    )
}
