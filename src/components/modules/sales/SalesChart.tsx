import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { SalesAnalytics } from '@/types/sales';

interface SalesChartProps {
    data: SalesAnalytics;
    startDate: Date;
    endDate: Date;
}

type ViewType = 'daily' | 'weekly' | 'monthly';

export function SalesChart({ data, startDate, endDate }: SalesChartProps) {
    const [viewType, setViewType] = useState<ViewType>('daily');

    const chartData = [
        { name: 'Average Daily', value: data.averageDaily },
        { name: 'Average Weekly', value: data.averageWeekly / 7 }, // Normalize to daily
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Sales Overview</h3>
                <div className="flex space-x-2">
                    <Button
                        variant={viewType === 'daily' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setViewType('daily')}
                    >
                        Daily
                    </Button>
                    <Button
                        variant={viewType === 'weekly' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setViewType('weekly')}
                    >
                        Weekly
                    </Button>
                    <Button
                        variant={viewType === 'monthly' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setViewType('monthly')}
                    >
                        Monthly
                    </Button>
                </div>
            </div>

            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#373d20"
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500">Trend</h4>
                    <div className="mt-1 flex items-center">
                        <span className="text-2xl font-semibold">
                            {data.trendPercentage > 0 ? '+' : ''}{data.trendPercentage}%
                        </span>
                        <span className={`ml-2 ${data.trendPercentage > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                            vs. previous period
                        </span>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500">Top Item</h4>
                    <div className="mt-1">
                        <span className="text-2xl font-semibold">
                            {data.topItems[0]?.name}
                        </span>
                        <span className="ml-2 text-gray-500">
                            ({data.topItems[0]?.quantity} units)
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}