import Skeleton from "../Skeleton"

export default function ResultCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Grade Circle */}
                    <Skeleton className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <Skeleton className="h-5 w-1/2 mb-2" />
                        <div className="flex gap-2">
                            <Skeleton className="h-4 w-20 rounded-lg" />
                            <Skeleton className="h-4 w-16 rounded-lg" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                        <Skeleton className="h-6 w-16 mb-1 ml-auto" />
                        <Skeleton className="h-4 w-12 ml-auto" />
                    </div>
                    <Skeleton className="w-10 h-10 rounded-full" />
                </div>
            </div>
        </div>
    )
}
