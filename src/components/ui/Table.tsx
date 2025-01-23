import { ReactNode } from 'react';

export interface Column<T> {
    header: string;
    accessor: keyof T;
    render?: (value: T[keyof T], item: T) => ReactNode;
}

export interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
}

export function Table<T extends { id?: string | number }>({
    data,
    columns,
    onRowClick
}: TableProps<T>) {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((column, i) => (
                            <th
                                key={i}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, i) => (
                        <tr
                            key={item.id || i}
                            onClick={() => onRowClick?.(item)}
                            className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                        >
                            {columns.map((column, j) => (
                                <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {column.render 
                                        ? column.render(item[column.accessor], item)
                                        : item[column.accessor]?.toString() || ''}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}