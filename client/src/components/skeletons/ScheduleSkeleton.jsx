import Skeleton from "../Skeleton"

export default function ScheduleSkeleton() {
    return (
        <div className="p-4 md:p-6 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="w-32 h-9 rounded-lg hidden md:block" />
            </div>

            {/* Week Navigation (Mobile) */}
            <div className="md:hidden card p-3 mb-4 space-y-3">
                <div className="flex justify-between items-center">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            </div>

            {/* Desktop Week View */}
            <div className="hidden md:block card p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-2">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="w-16 h-8 rounded-lg" />
                    </div>
                    <Skeleton className="w-48 h-6" />
                </div>
                <div className="grid grid-cols-7 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} className="p-4 rounded-xl border border-gray-200 min-h-[200px]">
                            <Skeleton className="h-4 w-8 mx-auto mb-1" />
                            <Skeleton className="h-6 w-6 mx-auto mb-4" />
                            <Skeleton className="h-12 w-full rounded-lg mb-2" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Event List */}
            <div className="md:hidden space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="card p-4 border-l-4 border-l-gray-200">
                        <div className="flex gap-3">
                            <div className="w-[50px] flex flex-col items-center">
                                <Skeleton className="h-4 w-10 mb-1" />
                                <Skeleton className="h-3 w-8" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-16 rounded-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-3 w-12" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
