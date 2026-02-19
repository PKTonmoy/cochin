import Skeleton from "../Skeleton"

/**
 * Attendance Dashboard Skeleton
 * Matches the premium dashboard layout: stats cards, calendar, charts, list
 */
export default function AttendanceSkeleton() {
    return (
        <div className="max-w-7xl mx-auto space-y-5 md:space-y-6 px-3 sm:px-4 md:px-0 py-4 md:py-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-7 w-52 mb-1.5" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-10 w-28 rounded-xl" />
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card p-4 md:p-5">
                        <Skeleton className="h-3 w-16 mb-3" />
                        <Skeleton className="h-8 w-20 mb-2" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left: Calendar + Donut */}
                <div className="lg:col-span-1 space-y-4 md:space-y-5">
                    {/* Calendar */}
                    <div className="card p-4 md:p-5">
                        <div className="flex justify-between items-center mb-4">
                            <Skeleton className="h-5 w-32" />
                            <div className="flex gap-1">
                                <Skeleton className="w-9 h-9 rounded-xl" />
                                <Skeleton className="w-9 h-9 rounded-xl" />
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {[...Array(7)].map((_, i) => (
                                <Skeleton key={`h-${i}`} className="h-4 rounded" />
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {[...Array(35)].map((_, i) => (
                                <Skeleton key={i} className="aspect-square rounded-xl" />
                            ))}
                        </div>
                        <div className="flex justify-center gap-4 mt-4">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="h-3 w-14" />
                            ))}
                        </div>
                    </div>

                    {/* Donut */}
                    <div className="card p-4 md:p-5">
                        <Skeleton className="h-5 w-40 mb-4" />
                        <div className="flex items-center justify-center gap-6">
                            <Skeleton className="w-[120px] h-[120px] rounded-full" />
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Trend + List */}
                <div className="lg:col-span-2 space-y-4 md:space-y-5">
                    {/* Trend Chart */}
                    <div className="card p-4 md:p-5">
                        <div className="flex justify-between items-center mb-4">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                        <div className="flex items-end gap-2 h-[140px] justify-center">
                            {[60, 80, 45, 90, 70, 85].map((h, i) => (
                                <Skeleton
                                    key={i}
                                    className="w-8 rounded-md"
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* History List */}
                    <div className="card">
                        <div className="p-4 border-b flex justify-between items-center">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-9 w-32 rounded-xl" />
                        </div>
                        <div className="divide-y">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="p-4 flex items-start gap-4">
                                    <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                        </div>
                                        <Skeleton className="h-3 w-36" />
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
