/**
 * Skeleton Component
 * Reusable loading placeholder with shimmer effect
 */
export default function Skeleton({ className = '', ...props }) {
    return (
        <div
            className={`shimmer bg-gray-200 rounded-lg ${className}`}
            {...props}
        />
    )
}
