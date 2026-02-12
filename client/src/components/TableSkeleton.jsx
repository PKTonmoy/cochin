import Skeleton from './Skeleton'

const TableSkeleton = ({ rows = 5, columns = 5 }) => {
    return (
        <div className="overflow-x-auto">
            <table className="table w-full">
                <thead>
                    <tr>
                        {Array(columns).fill(0).map((_, i) => (
                            <th key={i}>
                                <Skeleton className="h-4 w-24" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array(rows).fill(0).map((_, i) => (
                        <tr key={i}>
                            {Array(columns).fill(0).map((_, j) => (
                                <td key={j}>
                                    <Skeleton className="h-4 w-full" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default TableSkeleton
