import Skeleton from "../Skeleton"

export default function AttendanceSkeleton() {
    return (
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 px-1 sm:px-0">
            <div className="mb-6">
                <Skeleton className="h-6 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
            </div>

            <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left Col (Stats + Calendar) */}
                <div className="lg:col-span-1 space-y-4 md:space-y-6">
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <Skeleton className="h-24 rounded-lg" />
                        <Skeleton className="h-24 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        <Skeleton className="h-20 rounded-lg" />
                        <Skeleton className="h-20 rounded-lg" />
                        <Skeleton className="h-20 rounded-lg" />
                    </div>
                    {/* Calendar */}
                    <div className="card p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <Skeleton className="h-5 w-32" />
                            <div className="flex gap-1">
                                <Skeleton className="w-8 h-8 rounded-lg" />
                                <Skeleton className="w-8 h-8 rounded-lg" />
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {[...Array(35)].map((_, i) => (
                                <Skeleton key={i} className="aspect-square rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Col (List) */}
                <div className="lg:col-span-2">
                    <div className="card shadow-sm h-full">
                        <div className="p-4 border-b flex justify-between items-center">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-8 w-32 rounded-lg" />
                        </div>
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-start gap-4">
                                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-4 w-16 rounded-full" />
                                        </div>
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
