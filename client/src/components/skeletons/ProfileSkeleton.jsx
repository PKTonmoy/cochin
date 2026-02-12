import Skeleton from "../Skeleton"

export default function ProfileSkeleton() {
    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-center pt-2">
                <Skeleton className="h-8 w-32" />
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col items-center">
                <div className="mb-4 relative">
                    <Skeleton className="w-28 h-28 rounded-full" />
                </div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            {/* Student Information Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3">
                            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="w-5 h-5 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact Details Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3">
                            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-3 w-40" />
                            </div>
                            <Skeleton className="w-5 h-5 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
