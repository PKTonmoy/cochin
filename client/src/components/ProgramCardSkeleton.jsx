import Skeleton from './Skeleton'

const ProgramCardSkeleton = () => {
    return (
        <div className="glass-card overflow-hidden h-full">
            {/* Hero Image Skeleton */}
            <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                <Skeleton className="w-24 h-24 rounded-3xl" />
            </div>

            {/* Body Skeleton */}
            <div className="p-6 space-y-4">
                {/* Title & Desc */}
                <div>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3 mt-1" />
                </div>

                {/* Features */}
                <div className="space-y-2 pt-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-4 w-8" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ProgramCardSkeleton
