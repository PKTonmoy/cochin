import Skeleton from "../Skeleton"

export default function ResultsV2Skeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 rounded-lg" />
                        <Skeleton className="h-4 w-64 rounded" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg" />
                </div>

                {/* Quick Stats Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-16 rounded" />
                                    <Skeleton className="h-3 w-24 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Grid Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trend Chart Skeleton */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <Skeleton className="h-6 w-40 mb-6 rounded" />
                        <div className="h-64 w-full flex items-end gap-2">
                            {[...Array(10)].map((_, i) => (
                                <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                            ))}
                        </div>
                    </div>

                    {/* Radar Chart Skeleton */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <Skeleton className="h-6 w-40 mb-6 rounded" />
                        <div className="h-64 w-full flex items-center justify-center">
                            <Skeleton className="w-48 h-48 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Search & Filter Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-3">
                        <Skeleton className="h-11 flex-1 rounded-xl" />
                        <Skeleton className="h-11 w-full md:w-48 rounded-xl" />
                    </div>
                </div>

                {/* Results List Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-48 rounded" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-4 w-24 rounded" />
                                    <Skeleton className="h-4 w-20 rounded-full" />
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <Skeleton className="h-6 w-16 ml-auto rounded" />
                                <Skeleton className="h-4 w-10 ml-auto rounded" />
                            </div>
                            <Skeleton className="w-5 h-5 rounded-full ml-2" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
