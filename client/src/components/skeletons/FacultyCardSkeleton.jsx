import Skeleton from "../Skeleton"

export default function FacultyCardSkeleton() {
    return (
        <div className="glass-card p-6 text-center bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-1" />
            <Skeleton className="h-3 w-1/3 mt-1" />
        </div>
    )
}
