import Skeleton from "../Skeleton"

export default function NavbarSkeleton() {
    return (
        <header className="hidden lg:block fixed top-0 left-0 right-0 z-50 py-4">
            <div className="relative max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between">
                    {/* Logo Skeleton */}
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="space-y-1">
                            <Skeleton className="w-32 h-6" />
                            <Skeleton className="w-24 h-3" />
                        </div>
                    </div>

                    {/* Navigation Skeleton */}
                    <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-full border border-gray-100">
                        <Skeleton className="w-16 h-8 rounded-full" />
                        <Skeleton className="w-20 h-8 rounded-full" />
                        <Skeleton className="w-16 h-8 rounded-full" />
                        <Skeleton className="w-20 h-8 rounded-full" />
                    </div>

                    {/* Actions Skeleton */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 bg-white/50 rounded-full px-4 py-2 border border-gray-100">
                            <Skeleton className="w-9 h-9 rounded-full" />
                            <div className="space-y-1 hidden xl:block">
                                <Skeleton className="w-12 h-2" />
                                <Skeleton className="w-24 h-4" />
                            </div>
                        </div>
                        <Skeleton className="w-32 h-12 rounded-xl" />
                    </div>
                </div>
            </div>
        </header>
    )
}
