import Skeleton from "../Skeleton"

export default function HeroSkeleton() {
    return (
        <section className="relative min-h-[85vh] flex items-center pt-20 overflow-hidden bg-gray-50/50">
            {/* Background Mimic */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
                <div className="absolute bottom-40 right-10 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
            </div>

            <div className="container-cyber relative z-10 w-full">
                <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">

                    {/* Badge Skeleton */}
                    <div className="px-4 py-2 bg-white/50 rounded-full border border-gray-100 backdrop-blur-sm">
                        <Skeleton className="h-4 w-48" />
                    </div>

                    {/* Title Skeleton */}
                    <div className="space-y-3 w-full flex flex-col items-center">
                        <Skeleton className="h-10 md:h-14 w-3/4 max-w-lg rounded-xl" />
                        <Skeleton className="h-10 md:h-14 w-1/2 max-w-md rounded-xl" />
                    </div>

                    {/* Subtitle Skeleton */}
                    <div className="space-y-2 w-full flex flex-col items-center">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-56" />
                    </div>

                    {/* CTA Button Skeleton */}
                    <div className="pt-4">
                        <Skeleton className="h-12 w-40 rounded-xl" />
                    </div>

                    {/* Scroll Indicator Skeleton */}
                    <div className="pt-8 flex flex-col items-center gap-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                    </div>

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl mt-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="glass-card p-4 flex flex-col items-center gap-2 border border-gray-100 bg-white/60">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-3 w-12" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
