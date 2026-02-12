import Skeleton from "../Skeleton"

export default function MobileNavSkeleton() {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-white/80 backdrop-blur-lg border border-white/20 p-2 rounded-full shadow-lg shadow-blue-500/10 lg:hidden">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full flex items-center justify-center">
                    <Skeleton className="w-6 h-6 rounded-full" />
                </div>
            ))}
        </div>
    )
}
