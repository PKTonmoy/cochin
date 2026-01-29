/**
 * Result Card Component
 * Beautiful animated result display with confetti for top performers
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
            {/* Confetti celebration for top 3 */}
            {showCelebration && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={rank === 1 ? 300 : rank === 2 ? 200 : 100}
                    gravity={0.3}
                    colors={['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#7B68EE', '#32CD32']}
                />
            )}

            {/* Main Card */}
            <div className={`
                relative overflow-hidden rounded-2xl shadow-2xl
                bg-gradient-to-br ${getGradeGradient(result.grade)}
                text-white p-6 md:p-8
                animate-fadeIn
            `}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24" />

                {/* Sparkle effect for top ranks */}
                {rank && rank <= 3 && (
                    <Sparkles className="absolute top-4 right-4 text-yellow-200 animate-pulse" size={24} />
                )}

                {/* Content */}
                <div className="relative z-10">
                    {/* Rank badge */}
                    {rank && (
                        <div className="flex items-center gap-2 mb-4">
                            {getRankIcon(rank)}
                            <span className="text-lg font-bold">{getRankLabel(rank)}</span>
                            {totalStudents && (
                                <span className="text-white/70 text-sm">out of {totalStudents}</span>
                            )}
                        </div>
                    )}

                    {/* Score Display */}
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <p className="text-5xl md:text-6xl font-extrabold mb-1">
                                <CountUp end={result.totalMarks} duration={1.5} />
                                <span className="text-3xl opacity-70">/{result.maxMarks}</span>
                            </p>
                            <p className="text-xl font-semibold">
                                <CountUp end={result.percentage} decimals={1} duration={1.5} />% Score
                            </p>
                        </div>

                        {/* Grade Badge */}
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                            <p className="text-4xl font-extrabold">{result.grade}</p>
                            <p className="text-xs uppercase tracking-wider opacity-70">Grade</p>
                        </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={24}
                                className={`transition-all duration-300 ${i < getPerformanceStars(result.percentage)
                                        ? 'fill-yellow-300 text-yellow-300'
                                        : 'text-white/30'
                                    }`}
                                style={{ animationDelay: `${i * 100}ms` }}
                            />
                        ))}
                    </div>

                    {/* Percentile */}
                    {percentile && (
                        <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 inline-block">
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
