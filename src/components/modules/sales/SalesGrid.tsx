import { motion } from 'framer-motion';
import { SalesEntry } from '@/types/sales';
import { Column, Table } from '@/components/ui/Table';

interface ExtendedSalesEntry extends SalesEntry {
    name: string;
    category: string;
}

interface SalesGridProps {
    sales: ExtendedSalesEntry[];
    onDelete?: (id: number) => void;
}

export function SalesGrid({ sales, onDelete }: SalesGridProps) {
    const columns: Column<ExtendedSalesEntry>[] = [
        {
            header: 'Item',
            accessor: 'name'
        },
        {
            header: 'Category',
            accessor: 'category'
        },
        {
            header: 'Quantity',
            accessor: 'quantity'
        },
        {
            header: 'Time',
            accessor: 'createdAt',
            render: (value) => {
                if (value instanceof Date) {
                    return value.toLocaleTimeString();
                }
                return '';
            }
        },
        {
            header: 'Actions',
            accessor: 'id',
            render: (value, _item) => {
                if (typeof value === 'number' && onDelete) {
                    return (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();  // Prevent row click
                                onDelete(value);
                            }}
                            className="text-red-500 hover:text-red-700 transition-colors"
                        >
                            Delete
                        </button>
                    );
                }
                return null;
            }
        }
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
            <Table<ExtendedSalesEntry>
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