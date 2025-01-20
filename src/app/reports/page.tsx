'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useQuery } from '@tanstack/react-query';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#373d20', '#717744', '#abac7f'];
type ReportType = 'sales' | 'items' | 'trends';
type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export default function ReportsPage() {
    const { restaurantId } = useRestaurant();
    const { showToast } = useToast();
    const [reportType, setReportType] = useState<ReportType>('sales');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date()
    });

    // Fetch report data
    const { data: reportData, isLoading } = useQuery({
        queryKey: ['reports', restaurantId, reportType, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams({
                restaurantId: restaurantId.toString(),
                type: reportType,
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString()
            });

            const response = await fetch(`/api/reports?${params}`);
            if (!response.ok) throw new Error('Failed to fetch report data');
            return response.json();
        }
    });

    const handleExport = (format: ExportFormat) => {
        if (!reportData?.data) {
            showToast('No data to export', 'error');
            return;
        }

        try {
            const exportData = formatDataForExport(reportData.data, reportType);
            
            switch (format) {
                case 'csv':
                    exportCSV(exportData, `${reportType}_report`);
                    break;
                case 'xlsx':
                    exportXLSX(exportData, `${reportType}_report`);
                    break;
                case 'pdf':
                    exportPDF(exportData, `${reportType}_report`);
                    break;
            }

            showToast(`Report exported successfully as ${format.toUpperCase()}`, 'success');
        } catch (error) {
            showToast('Failed to export report', 'error');
        }
    };

    const formatDataForExport = (data: any, type: ReportType) => {
        switch (type) {
            case 'sales':
                return {
                    summary: {
                        totalSales: data.summary.totalSales,
                        averageDaily: data.summary.averageDaily,
                        byCategory: data.summary.salesByCategory
                    },
                    daily: data.dailyData
                };
            case 'items':
                return {
                    items: data.items.map((item: any) => ({
                        name: item.menu_item_name,
                        category: item.category,
                        totalQuantity: item.total_quantity,
                        averageDaily: item.average_daily,
                        prepItems: item.prep_items
                    }))
                };
            case 'trends':
                return {
                    dailyTrends: data.dailyTrends,
                    categoryTrends: data.categoryTrends,
                    predictions: data.predictions
                };
            default:
                return data;
        }
    };

    const exportCSV = (data: any, filename: string) => {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
    };

    const exportXLSX = (data: any, filename: string) => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(flattenData(data));
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    const exportPDF = (data: any, filename: string) => {
        // Implementation would require a PDF library
        showToast('PDF export coming soon', 'info');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                <div className="flex space-x-2">
                    <Button onClick={() => handleExport('csv')}>
                        Export CSV
                    </Button>
                    <Button onClick={() => handleExport('xlsx')}>
                        Export Excel
                    </Button>
                    <Button onClick={() => handleExport('pdf')}>
                        Export PDF
                    </Button>
                </div>
            </div>

            <div className="flex space-x-4 items-center">
                <div className="flex space-x-4">
                    <Button
                        variant={reportType === 'sales' ? 'primary' : 'outline'}
                        onClick={() => setReportType('sales')}
                    >
                        Sales Report
                    </Button>
                    <Button
                        variant={reportType === 'items' ? 'primary' : 'outline'}
                        onClick={() => setReportType('items')}
                    >
                        Item Usage
                    </Button>
                    <Button
                        variant={reportType === 'trends' ? 'primary' : 'outline'}
                        onClick={() => setReportType('trends')}
                    >
                        Trends
                    </Button>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                    <Input
                        type="date"
                        value={dateRange.startDate.toISOString().split('T')[0]}
                        onChange={(e) => setDateRange(prev => ({
                            ...prev,
                            startDate: new Date(e.target.value)
                        }))}
                        className="w-40"
                    />
                    <span>to</span>
                    <Input
                        type="date"
                        value={dateRange.endDate.toISOString().split('T')[0]}
                        onChange={(e) => setDateRange(prev => ({
                            ...prev,
                            endDate: new Date(e.target.value)
                        }))}
                        className="w-40"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {reportType === 'sales' && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-2 bg-white p-6 rounded-lg shadow-sm"
                            >
                                <h3 className="text-lg font-medium mb-4">Sales Over Time</h3>
                                <div className="h-96">
                                    <ResponsiveContainer>
                                        <AreaChart data={reportData?.data?.dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area 
                                                type="monotone" 
                                                dataKey="total" 
                                                stroke="#373d20" 
                                                fill="#717744" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white p-6 rounded-lg shadow-sm"
                            >
                                <h3 className="text-lg font-medium mb-4">Sales by Category</h3>
                                <div className="h-80">
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={reportData?.data?.summary.salesByCategory}
                                                dataKey="total"
                                                nameKey="category"
                                                labelLine={false}
                                            >
                                                {reportData?.data?.summary.salesByCategory.map((_: any, index: number) => (
                                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        </>
                    )}

                    {reportType === 'items' && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-2 bg-white p-6 rounded-lg shadow-sm"
                            >
                                <h3 className="text-lg font-medium mb-4">Item Usage Breakdown</h3>
                                <div className="h-96">
                                    <ResponsiveContainer>
                                        <BarChart data={reportData?.data?.items}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="menu_item_name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="total_quantity" fill="#373d20" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        </>
                    )}

                    {reportType === 'trends' && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-2 bg-white p-6 rounded-lg shadow-sm"
                            >
                                <h3 className="text-lg font-medium mb-4">Trend Analysis</h3>
                                <div className="h-96">
                                    <ResponsiveContainer>
                                        <LineChart data={reportData?.data?.dailyTrends}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line 
                                                type="monotone" 
                                                dataKey="total" 
                                                stroke="#373d20" 
                                                name="Actual"
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="predictedTotal" 
                                                stroke="#717744" 
                                                strokeDasharray="5 5"
                                                name="Predicted"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// Helper functions for data conversion
function convertToCSV(data: any): string {
    const items = flattenData(data);
    const headers = Object.keys(items[0]);
    const rows = items.map(item => headers.map(header => item[header]).join(','));
    return [headers.join(','), ...rows].join('\n');
}

function flattenData(data: any): any[] {
    if (Array.isArray(data)) {
        return data.map(item => flattenObject(item));
    }
    return [flattenObject(data)];
}

function flattenObject(obj: any, prefix = ''): any {
    return Object.keys(obj).reduce((acc: any, k: string) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
}