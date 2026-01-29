/**
 * Countdown Timer Component
 * Shows countdown to an upcoming event
 */

import { useState, useEffect } from 'react'
import { Clock, AlertCircle } from 'lucide-react'

export default function CountdownTimer({ targetDate, targetTime, label, onExpired }) {
    const [timeLeft, setTimeLeft] = useState(null)
    const [isExpired, setIsExpired] = useState(false)

    useEffect(() => {
        function calculateTimeLeft() {
            const now = new Date()
            let target = new Date(targetDate)

            // Combine date and time if time is provided
            if (targetTime) {
                const [hours, minutes] = targetTime.split(':').map(Number)
                target.setHours(hours, minutes, 0, 0)
            }

            const difference = target - now

            if (difference <= 0) {
                setIsExpired(true)
                setTimeLeft(null)
                onExpired?.()
                return null
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24))
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
            const minutes = Math.floor((difference / (1000 * 60)) % 60)
            const seconds = Math.floor((difference / 1000) % 60)

            return { days, hours, minutes, seconds, total: difference }
        }

        // Initial calculation
        setTimeLeft(calculateTimeLeft())

        // Update every second
        const timer = setInterval(() => {
            const result = calculateTimeLeft()
            if (result === null) {
                clearInterval(timer)
            } else {
                setTimeLeft(result)
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [targetDate, targetTime, onExpired])

    if (isExpired) {
        return (
            <div className="flex items-center gap-2 text-orange-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Starting now!</span>
            </div>
        )
    }

    if (!timeLeft) {
        return (
            <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Loading...</span>
            </div>
        )
    }

    const isUrgent = timeLeft.total < 60 * 60 * 1000 // Less than 1 hour
    const isWarning = timeLeft.total < 24 * 60 * 60 * 1000 // Less than 24 hours

    return (
        <div className={`rounded-lg p-3 ${isUrgent
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : isWarning
                    ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}>
            {label && (
                <p className={`text-xs font-medium mb-2 ${isUrgent ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                    {label}
                </p>
            )}
            <div className="flex items-center justify-center gap-2">
                {timeLeft.days > 0 && (
                    <TimeUnit value={timeLeft.days} label="days" isUrgent={isUrgent} />
                )}
                <TimeUnit value={timeLeft.hours} label="hrs" isUrgent={isUrgent} />
                <span className={`text-xl font-bold ${isUrgent ? 'text-red-500' : 'text-gray-400'}`}>:</span>
                <TimeUnit value={timeLeft.minutes} label="min" isUrgent={isUrgent} />
                <span className={`text-xl font-bold ${isUrgent ? 'text-red-500' : 'text-gray-400'}`}>:</span>
                <TimeUnit value={timeLeft.seconds} label="sec" isUrgent={isUrgent} />
            </div>
        </div>
    )
}

function TimeUnit({ value, label, isUrgent }) {
    return (
        <div className="flex flex-col items-center">
            <span className={`text-2xl font-bold tabular-nums ${isUrgent ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}>
                {String(value).padStart(2, '0')}
            </span>
            <span className={`text-xs ${isUrgent ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                }`}>
                {label}
            </span>
        </div>
    )
}
