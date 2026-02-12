import Skeleton from "../Skeleton"

export default function StudentDashboardSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Welcome Component */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 space-y-3 w-full">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-10 w-32 rounded-lg mt-2" />
                    </div>
                    <Skeleton className="w-32 h-32 rounded-full hidden md:block" />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <Skeleton className="w-8 h-8 rounded-lg mb-2" />
                            <Skeleton className="h-6 w-12 mb-1" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    ))}
                </div>

                {/* Recent Results */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 p-3 border border-gray-50 rounded-xl bg-gray-50/50">
                                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-40 mb-1" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <div className="text-right">
                                    <Skeleton className="h-5 w-12 mb-1" />
                                    <Skeleton className="h-3 w-8 ml-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                    <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-5 w-40 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto mb-4" />
                    <div className="flex justify-center gap-2">
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                </div>

                {/* Upcoming Classes */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="p-4 space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <Skeleton className="h-4 w-8 mb-1" />
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                                <div className="flex-1 p-3 rounded-xl border border-gray-100">
                                    <Skeleton className="h-4 w-32 mb-1" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
