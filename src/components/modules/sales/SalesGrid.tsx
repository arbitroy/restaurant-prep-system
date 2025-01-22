import { motion } from 'framer-motion';
import { Table } from '@/components/ui/Table';
import { SalesEntry } from '@/types/sales';

interface ExtendedSalesEntry extends SalesEntry {
    name: string;
    category: string;
}

interface SalesGridProps {
    sales: ExtendedSalesEntry[];
    onDelete?: (id: number) => void;
}

export function SalesGrid({ sales, onDelete }: SalesGridProps) {
    const columns = [
        {
            header: 'Item',
            accessor: 'name' as keyof ExtendedSalesEntry,
        },
        {
            header: 'Category',
            accessor: 'category' as keyof ExtendedSalesEntry,
        },
        {
            header: 'Quantity',
            accessor: 'quantity' as keyof ExtendedSalesEntry,
        },
        {
            header: 'Time',
            accessor: 'createdAt' as keyof ExtendedSalesEntry,
            render: (value: Date) => value?.toLocaleTimeString(),
        },
        {
            header: 'Actions',
            accessor: 'id' as keyof ExtendedSalesEntry,
            render: (value: number) => onDelete && (
                <button
                    onClick={() => onDelete(value)}
                    className="text-red-500 hover:text-red-700"
                >
                    Delete
                </button>
            ),
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
            <div className="p-4 border-b">
                <h3 className="text-lg font-medium">Today's Sales</h3>
            </div>
            <Table
                data={sales}
                columns={columns}
            />
            <div className="p-4 bg-gray-50 border-t">
                <div className="flex justify-between items-center">
                    <span className="font-medium">Total Items:</span>
                    <span>{sales.reduce((sum, sale) => sum + sale.quantity, 0)}</span>
                </div>
            </div>
        </motion.div>
    );
}