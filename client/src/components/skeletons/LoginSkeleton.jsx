import Skeleton from "../Skeleton"

export default function LoginSkeleton() {
    return (
        <div className="min-h-screen flex bg-white dark:bg-gray-900 transition-colors duration-300">
            {/* Left side - Illustration Skeleton (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-100 dark:bg-gray-800 relative items-center justify-center p-12">
                <div className="w-full max-w-md text-center space-y-8">
                    {/* Logo Skeleton */}
                    <div className="flex justify-center">
                        <Skeleton className="w-24 h-24 rounded-2xl" />
                    </div>

                    {/* Title & Description Skeleton */}
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-3/4 mx-auto rounded-lg" />
                        <Skeleton className="h-4 w-1/2 mx-auto rounded" />
                    </div>

                    {/* Feature List Skeleton */}
                    <div className="space-y-4 pt-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
                                <Skeleton className="h-4 w-full max-w-[200px] rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side - Form Skeleton */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo Skeleton */}
                    <div className="lg:hidden flex flex-col items-center mb-8 space-y-4">
                        <Skeleton className="w-16 h-16 rounded-xl" />
                        <Skeleton className="h-6 w-40 rounded-lg" />
                    </div>

                    {/* Desktop Header Skeleton */}
                    <div className="hidden lg:block space-y-2 mb-8">
                        <Skeleton className="h-8 w-48 rounded-lg" />
                        <Skeleton className="h-4 w-64 rounded" />
                    </div>

                    {/* Form Fields Skeleton */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="h-14 w-full rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="h-14 w-full rounded-xl" />
                        </div>

                        {/* Button Skeleton */}
                        <Skeleton className="h-14 w-full rounded-xl mt-6" />

                        {/* Footer Links Skeleton */}
                        <div className="space-y-2 flex flex-col items-center pt-4">
                            <Skeleton className="h-4 w-40 rounded" />
                            <Skeleton className="h-4 w-32 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
