import Skeleton from "../Skeleton"

export default function TestimonialCardSkeleton() {
    return (
        <div className="glass-card p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
                <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-2 pt-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-20" />
            </div>
        </div>
    )
}
