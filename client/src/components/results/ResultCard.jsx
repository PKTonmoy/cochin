/**
 * Result Card Component
 * Premium animated result display with confetti for top performers
 * Matches website theme with glass morphism and gradients
 */

import { useState, useEffect } from 'react'
import Confetti from 'react-confetti'
import { Trophy, Medal, Star, Sparkles } from 'lucide-react'
import CountUp from 'react-countup'

const ResultCard = ({
    result,
    rank,
    totalStudents,
    percentile,
    showConfetti = true
}) => {
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
    const [showCelebration, setShowCelebration] = useState(false)

    // Get window size for confetti
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            })
        }
        handleResize()
        window.addEventListener('resize', handleResize)

        // Show celebration for top 3 ranks
        if (rank && rank <= 3 && showConfetti) {
            setShowCelebration(true)
            const timer = setTimeout(() => setShowCelebration(false), 5000)
            return () => clearTimeout(timer)
        }

        return () => window.removeEventListener('resize', handleResize)
    }, [rank, showConfetti])

    const getGradeGradient = (grade) => {
        const gradients = {
            'A+': 'from-emerald-400 via-green-500 to-emerald-600',
            'A': 'from-green-400 via-emerald-500 to-green-600',
            'A-': 'from-blue-400 via-indigo-500 to-blue-600',
            'B+': 'from-blue-400 via-blue-500 to-blue-600',
            'B': 'from-yellow-400 via-amber-500 to-yellow-600',
            'C': 'from-orange-400 via-orange-500 to-amber-600',
            'D': 'from-red-400 via-orange-500 to-red-600',
            'F': 'from-red-500 via-red-600 to-red-700'
        }
        return gradients[grade] || 'from-gray-400 via-gray-500 to-gray-600'
    }

    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy className="text-yellow-300" size={32} />
        if (rank === 2) return <Medal className="text-gray-300" size={28} />
        if (rank === 3) return <Medal className="text-amber-500" size={28} />
        return <Star className="text-white/60" size={24} />
    }

    const getRankLabel = (rank) => {
        if (rank === 1) return '1st Place! 🥇'
        if (rank === 2) return '2nd Place! 🥈'
        if (rank === 3) return '3rd Place! 🥉'
        return `Rank #${rank}`
    }

    const getPerformanceStars = (percentage) => {
        if (percentage >= 90) return 5
        if (percentage >= 80) return 4
        if (percentage >= 70) return 3
        if (percentage >= 60) return 2
        if (percentage >= 50) return 1
        return 0
    }

    return (
        <div className="relative">
            {/* Confetti celebration for top 3 - theme colors */}
            {showCelebration && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={rank === 1 ? 300 : rank === 2 ? 200 : 100}
                    gravity={0.3}
                    colors={['#3b82f6', '#60a5fa', '#f97316', '#fb923c', '#10b981', '#fbbf24']}
                />
            )}

            {/* Main Card - Glass morphism style */}
            <div className={`
                relative overflow-hidden rounded-2xl shadow-xl
                bg-gradient-to-br ${getGradeGradient(result.grade)}
                text-white p-6 md:p-8
                animate-fadeIn
                border border-white/20
            `}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

                {/* Sparkle effect for top ranks */}
                {rank && rank <= 3 && (
                    <Sparkles className="absolute top-4 right-4 text-yellow-200 animate-pulse" size={24} />
                )}

                {/* Content */}
                <div className="relative z-10">
                    {/* Rank badge */}
                    {rank && (
                        <div className="flex items-center gap-2 mb-4 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 w-fit">
                            {getRankIcon(rank)}
                            <span className="text-lg font-bold">{getRankLabel(rank)}</span>
                            {totalStudents && (
                                <span className="text-white/70 text-sm">out of {totalStudents}</span>
                            )}
                        </div>
                    )}

                    {/* Score Display */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div>
                            <p className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-1">
                                <CountUp end={result.totalMarks} duration={1.5} />
                                <span className="text-2xl md:text-3xl opacity-70">/{result.maxMarks}</span>
                            </p>
                            <p className="text-lg md:text-xl font-semibold text-white/90">
                                <CountUp end={result.percentage} decimals={1} duration={1.5} />% Score
                            </p>
                        </div>

                        {/* Grade Badge */}
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 md:p-5 text-center border border-white/10">
                            <p className="text-3xl md:text-4xl font-extrabold">{result.grade}</p>
                            <p className="text-xs uppercase tracking-wider opacity-70 mt-1">Grade</p>
                        </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={22}
                                className={`transition-all duration-300 ${i < getPerformanceStars(result.percentage)
                                    ? 'fill-yellow-300 text-yellow-300 drop-shadow-lg'
                                    : 'text-white/30'
                                    }`}
                                style={{ animationDelay: `${i * 100}ms` }}
                            />
                        ))}
                    </div>

                    {/* Percentile */}
                    {percentile && (
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 inline-flex items-center gap-2 border border-white/10">
                            <Star className="text-yellow-300" size={16} />
                            <p className="text-sm">
                                Percentile: <span className="font-bold text-lg">{percentile}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ResultCard
