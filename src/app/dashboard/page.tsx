'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SalesChart } from '@/components/modules/sales/SalesChart';
import { Button } from '@/components/ui/Button';
import { useSales } from '@/hooks/useSales';
import { useItems } from '@/hooks/useItems';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { TopItem } from '@/types/sales';
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

export default function DashboardPage() {
    const { restaurantId } = useRestaurant();
    const { showToast } = useToast();
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date()
    });

    const { 
        dailySales, 
        salesAnalytics, 
        isLoading,
        error: salesError 
    } = useSales({
        restaurantId,
        initialDate: new Date()
    });

    const { 
        menuItemsByCategory,
        isLoadingMenu,
        error: itemsError 
    } = useItems({
        restaurantId
    });

    // Handle errors
    if (salesError || itemsError) {
        showToast('Error loading dashboard data', 'error');
    }

    const handleDateRangeChange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        
        setDateRange({
            startDate: start,
            endDate: end
        });
        
        showToast(`Date range updated to last ${days} days`, 'success');
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <div className="flex space-x-4">
                    <Button 
                        variant="outline"
                        onClick={() => handleDateRangeChange(7)}
                    >
                        Last 7 Days
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={() => handleDateRangeChange(30)}
                    >
                        Last 30 Days
                    </Button>
                    <Button
                        variant="outline" 
                        onClick={() => handleDateRangeChange(90)}
                    >
                        Last 90 Days
                    </Button>
                </div>
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-lg shadow-sm"
                >
                    <h3 className="text-lg font-medium mb-2">Today's Sales</h3>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#373d20]" />
                        </div>
                    ) : (
                        <p className="text-3xl font-bold">
                            {dailySales?.total || 0} items
                        </p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-lg shadow-sm"
                >
                    <h3 className="text-lg font-medium mb-2">Average Daily Sales</h3>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#373d20]" />
                        </div>
                    ) : (
                        <p className="text-3xl font-bold">
                            {salesAnalytics?.averageDaily.toFixed(1) || 0} items
                        </p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-lg shadow-sm"
                >
                    <h3 className="text-lg font-medium mb-2">Top Category</h3>
                    {isLoadingMenu ? (
                        <div className="flex justify-center items-center h-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#373d20]" />
                        </div>
                    ) : (
                        <div>
                            <p className="text-3xl font-bold">
                                {Object.keys(menuItemsByCategory || {})[0] || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {Object.values(menuItemsByCategory || {})[0]?.length || 0} items
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-6 rounded-lg shadow-sm"
                >
                    {isLoading ? (
                        <div className="flex justify-center items-center h-[400px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#373d20]" />
                        </div>
                    ) : (
                        <SalesChart
                            data={salesAnalytics}
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                        />
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-6 rounded-lg shadow-sm"
                >
                    <h3 className="text-lg font-medium mb-4">Top Items</h3>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-[400px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#373d20]" />
                        </div>
                    ) : salesAnalytics?.topItems?.length ? (
                        <div className="space-y-4">
                            {salesAnalytics.topItems.map((item: TopItem) => (
                                <div
                                    key={item.menuItemId}
                                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <span className="font-medium">{item.name}</span>
                                    <div className="text-right">
                                        <span className="text-gray-500">{item.quantity} units</span>
                                        <span className="text-xs text-gray-400 ml-2">
                                            ({item.percentage !== undefined ? item.percentage.toFixed(1) : '0.0'}%)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-[400px] text-gray-500">
                            No sales data available
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}