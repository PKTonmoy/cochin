import Skeleton from "../Skeleton"

export default function VictoryCardSkeleton() {
    return (
        <div className="h-full rounded-[20px] bg-white border border-gray-100 overflow-hidden flex flex-col shadow-sm">
            {/* Header Mimic */}
            <div className="bg-gray-100/50 px-5 pt-6 pb-16 relative">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div>
                            <Skeleton className="h-3 w-32 mb-1" />
                            <Skeleton className="h-2 w-20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="px-5 -mt-10 relative z-10 pb-5 flex-1 flex flex-col">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex gap-4">
                        {/* Photo */}
                        <Skeleton className="w-[86px] h-[104px] rounded-[14px] flex-shrink-0" />

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-3">
                            <div>
                                <Skeleton className="h-2 w-16 mb-1" />
                                <Skeleton className="h-5 w-full" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-16 rounded-lg" />
                                <Skeleton className="h-6 w-12 rounded-lg" />
                            </div>
                            <div>
                                <Skeleton className="h-2 w-10 mb-1" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 mt-auto">
                <div className="flex justify-between items-end mb-3 px-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="w-full h-11 rounded-xl" />
            </div>
        </div>
    )
}
