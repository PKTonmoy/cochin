import Skeleton from "../Skeleton"

export default function DashboardV2Skeleton() {
    return (
        <div className="min-h-screen bg-[var(--light)]">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                {/* Hero Section Skeleton */}
                <div className="relative overflow-hidden rounded-2xl bg-white p-6 md:p-8 border border-gray-200">
                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-4 h-4 rounded-full" />
                                <Skeleton className="h-4 w-48 rounded" />
                            </div>
                            <Skeleton className="h-10 w-64 rounded-lg" />
                            <Skeleton className="h-5 w-40 rounded" />
                        </div>

                        {/* Quick Stats Skeleton */}
                        <div className="flex gap-3 flex-wrap">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="px-4 py-3 rounded-2xl min-w-[100px] border border-gray-100 bg-gray-50">
                                    <Skeleton className="h-8 w-16 mx-auto mb-2 rounded" />
                                    <Skeleton className="h-3 w-12 mx-auto rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Grid Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Attendance Overview Skeleton */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 h-[300px]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-40 rounded" />
                                    <Skeleton className="h-4 w-24 rounded" />
                                </div>
                                <Skeleton className="h-10 w-32 rounded-lg" />
                            </div>
                            <Skeleton className="h-48 w-full rounded-xl" />
                        </div>

                        {/* Upcoming Classes Skeleton */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-32 rounded" />
                                        <Skeleton className="h-3 w-24 rounded" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-20 rounded" />
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                                        <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-3/4 rounded" />
                                            <Skeleton className="h-3 w-1/2 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Results Skeleton */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-32 rounded" />
                                        <Skeleton className="h-3 w-24 rounded" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-20 rounded" />
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32 rounded" />
                                                <Skeleton className="h-3 w-24 rounded" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-right">
                                            <Skeleton className="h-5 w-16 ml-auto rounded" />
                                            <Skeleton className="h-3 w-10 ml-auto rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column Skeleton */}
                    <div className="space-y-6">
                        {/* Next Event Widget */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 h-48">
                            <Skeleton className="h-4 w-24 mb-4 rounded" />
                            <Skeleton className="h-8 w-3/4 mb-2 rounded" />
                            <Skeleton className="h-4 w-1/2 mb-6 rounded" />
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map(i => (
                                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                                ))}
                            </div>
                        </div>

                        {/* Upcoming Tests Widget */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200">
                            <div className="flex items-center gap-3 mb-4">
                                <Skeleton className="w-10 h-10 rounded-xl" />
                                <Skeleton className="h-5 w-32 rounded" />
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-3 rounded-xl border border-gray-100 bg-gray-50 space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-24 rounded" />
                                            <Skeleton className="h-4 w-12 rounded-full" />
                                        </div>
                                        <Skeleton className="h-3 w-32 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quote Widget */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
                            <Skeleton className="w-8 h-8 mx-auto mb-3 rounded-full" />
                            <Skeleton className="h-4 w-full mb-2 rounded" />
                            <Skeleton className="h-4 w-5/6 mx-auto mb-4 rounded" />
                            <Skeleton className="h-3 w-24 mx-auto rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
