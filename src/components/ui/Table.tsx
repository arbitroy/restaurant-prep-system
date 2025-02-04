import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessor: keyof T;
    render?: (value: T[keyof T], item: T) => ReactNode;
    priority?: 'high' | 'medium' | 'low'; // For mobile display priority
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
    const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

    const toggleRow = (id: string | number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click handler
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Get high priority columns for mobile view
    const primaryColumns = columns.filter(col => col.priority === 'high' || !col.priority);
    const secondaryColumns = columns.filter(col => col.priority === 'medium' || col.priority === 'low');

    return (
        <div className="w-full">
            {/* Desktop view */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
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

            {/* Mobile view */}
            <div className="md:hidden space-y-4">
                {data.map((item, i) => {
                    const id = item.id || i;
                    const isExpanded = expandedRows.has(id);

                    return (
                        <div
                            key={id}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                            onClick={() => onRowClick?.(item)}
                        >
                            <div className="p-4">
                                {/* Primary columns always visible */}
                                <div className="space-y-2">
                                    {primaryColumns.map((column, j) => (
                                        <div key={j} className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">
                                                {column.header}
                                            </span>
                                            <span className="text-sm font-medium">
                                                {column.render
                                                    ? column.render(item[column.accessor], item)
                                                    : item[column.accessor]?.toString() || ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Expandable secondary columns */}
                                {secondaryColumns.length > 0 && (
                                    <button
                                        onClick={(e) => toggleRow(id, e)}
                                        className="mt-2 w-full flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                        <span className="mr-2">
                                            {isExpanded ? 'Show less' : 'Show more'}
                                        </span>
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                )}

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                        {secondaryColumns.map((column, j) => (
                                            <div key={j} className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">
                                                    {column.header}
                                                </span>
                                                <span className="text-sm">
                                                    {column.render
                                                        ? column.render(item[column.accessor], item)
                                                        : item[column.accessor]?.toString() || ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}