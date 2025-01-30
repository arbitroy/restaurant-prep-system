'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/loading';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useQuery } from '@tanstack/react-query';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

import { formatDataForExport, exportCSV, exportXLSX, calculateTrends } from '@/lib/utils/reportUtils';
import { ReportData } from '@/types/api';
import { ApiResponse } from '@/types/common';
import React from 'react';

const COLORS = ['#373d20', '#717744', '#abac7f'] as const;
const REPORT_TYPES = ['sales', 'items', 'trends'] as const;
const EXPORT_FORMATS = ['csv', 'xlsx'] as const;

type ReportType = typeof REPORT_TYPES[number];
type ExportFormat = typeof EXPORT_FORMATS[number];

interface ChartProps {
    data: any[];
    isLoading: boolean;
    error: Error | null;
}

interface DateRange {
    startDate: Date;
    endDate: Date;
}

// Chart Error Boundary Component
class ChartErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error('Chart Error:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
                    <p className="text-red-600">Error loading chart</p>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function ReportsPage() {
    const { restaurantId } = useRestaurant();
    const { showToast } = useToast();
    const [reportType, setReportType] = useState<ReportType>('sales');
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date()
    });

    const { data: reportData, isLoading, error } = useQuery<ApiResponse<ReportData>>({
        queryKey: ['reports', restaurantId, reportType, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams({
                restaurantId: restaurantId.toString(),
                type: reportType,
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString()
            });

            const response = await fetch(`/api/reports?${params}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch report data');
            }
            return response.json();
        },
        retry: 1
    });

    const handleExport = async (format: ExportFormat) => {
        if (!reportData?.data) {
            showToast('No data to export', 'error');
            return;
        }

        try {
            const exportData = formatDataForExport(reportData.data);
            
            switch (format) {
                case 'csv':
                    exportCSV(exportData, `${reportType}_report`);
                    break;
                case 'xlsx':
                    exportXLSX(exportData, `${reportType}_report`);
                    break;
            }
            
            showToast(`Report exported successfully as ${format.toUpperCase()}`, 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Export failed';
            showToast(errorMessage, 'error');
            console.error('Export error:', error);
        }
    };

    if (error) {
        showToast('Failed to load report data', 'error');
    }

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                <div className="flex space-x-2">
                    {EXPORT_FORMATS.map(format => (
                        <Button
                            key={format}
                            onClick={() => handleExport(format)}
                            disabled={isLoading || !reportData?.data}
                        >
                            Export {format.toUpperCase()}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Report Type Selection and Date Range */}
            <div className="flex space-x-4 items-center">
                <div className="flex space-x-4">
                    {REPORT_TYPES.map(type => (
                        <Button
                            key={type}
                            variant={reportType === type ? 'primary' : 'outline'}
                            onClick={() => setReportType(type)}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)} Report
                        </Button>
                    ))}
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                    <Input
                        type="date"
                        value={dateRange.startDate.toISOString().split('T')[0]}
                        onChange={e => setDateRange(prev => ({
                            ...prev,
                            startDate: new Date(e.target.value)
                        }))}
                        className="w-40"
                    />
                    <span>to</span>
                    <Input
                        type="date"
                        value={dateRange.endDate.toISOString().split('T')[0]}
                        onChange={e => setDateRange(prev => ({
                            ...prev,
                            endDate: new Date(e.target.value)
                        }))}
                        className="w-40"
                    />
                </div>
            </div>

            {/* Report Content */}
            <LoadingState loading={isLoading} message="Loading report data...">
                <ChartErrorBoundary>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {reportData?.data && (
                            <ReportContent
                                type={reportType}
                                data={reportData.data}
                            />
                        )}
                    </div>
                </ChartErrorBoundary>
            </LoadingState>
        </div>
    );
}

function ReportContent({ type, data }: { type: ReportType; data: ReportData }) {
    switch (type) {
        case 'sales':
            return <SalesReport data={data} />;
        case 'items':
            return <ItemsReport data={data} />;
        case 'trends':
            return <TrendsReport data={data} />;
        default:
            return null;
    }
}

function SalesReport({ data }: { data: ReportData }) {
    const categoryData = React.useMemo(() => {
        return data.summary.salesByCategory.map(category => ({
            ...category,
            total: parseFloat(category.total.toString()),
            percentage: parseFloat(category.percentage.toString())
        }));
    }, [data.summary.salesByCategory]);

    const chartData = data.dailyData.map(day => ({
        ...day,
        date: new Date(day.date).toLocaleDateString(),
        total: parseInt(day.total.toString()),
    }));

    return (
        <>
            {/* Sales Overview chart stays the same */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-2 bg-white p-6 rounded-lg shadow-sm"
            >
                <h3 className="text-lg font-medium mb-4">Sales Overview</h3>
                <div className="h-96">
                    <ResponsiveContainer>
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#373d20"
                                fill="#717744"
                                fillOpacity={0.3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Fixed Category Distribution */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-2 bg-white p-6 rounded-lg shadow-sm"
            >
                <h3 className="text-lg font-medium mb-4">Category Distribution</h3>
                <div className="h-80">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                dataKey="total"
                                nameKey="category"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({
                                    cx,
                                    cy,
                                    midAngle,
                                    innerRadius,
                                    outerRadius,
                                    category,
                                    percentage
                                }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                    return (
                                        <text
                                            x={x}
                                            y={y}
                                            fill="#080808"
                                            textAnchor={x > cx ? 'start' : 'end'}
                                            dominantBaseline="central"
                                            fontSize={12}
                                        >
                                            {`${category} (${percentage.toFixed(1)}%)`}
                                        </text>
                                    );
                                }}
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${entry.category}`} 
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => [
                                    `${value.toLocaleString()}`,
                                    'Total Sales'
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Added category legend for better visibility */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    {categoryData.map((category, index) => (
                        <div 
                            key={category.category}
                            className="flex items-center space-x-2"
                        >
                            <div 
                                className="w-4 h-4 rounded-sm"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm">
                                {category.category}: {category.total.toLocaleString()} ({category.percentage.toFixed(1)}%)
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </>
    );
}

function ItemsReport({ data }: { data: ReportData }) {
    if (!data?.items?.length) {
        return (
            <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm">
                <p className="text-gray-500 text-center">No items data available</p>
            </div>
        );
    }

    const chartData = data.items
        .map(item => ({
            ...item,
            totalQuantity: Number(item.totalQuantity) || 0,
            averageDaily: Number(item.averageDaily) || 0,
            // Aggregate prep items to combine duplicates
            prepItems: Object.values(
                item.prepItems.reduce((acc, prep) => {
                    const key = `${prep.prepItemId}-${prep.name}-${prep.unit}`;
                    if (!acc[key]) {
                        acc[key] = {
                            ...prep,
                            totalUsage: 0
                        };
                    }
                    acc[key].totalUsage += prep.totalUsage;
                    return acc;
                }, {} as Record<string, typeof item.prepItems[0]>)
            ).map(prep => ({
                ...prep,
                totalUsage: Number(prep.totalUsage.toFixed(2))  // Round to 2 decimal places
            }))
        }))
        .slice(0, 10);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2 bg-white p-6 rounded-lg shadow-sm"
        >
            <h3 className="text-lg font-medium mb-4">Top Items Usage</h3>
            <div className="h-96">
                <ResponsiveContainer>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis />
                        <Tooltip 
                            formatter={(value: number) => value.toFixed(2)}
                            labelFormatter={(label) => `Item: ${label}`}
                        />
                        <Legend />
                        <Bar 
                            dataKey="totalQuantity" 
                            name="Total Usage"
                            fill="#373d20"
                        />
                        <Bar 
                            dataKey="averageDaily" 
                            name="Daily Average"
                            fill="#717744"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Prep Items Breakdown */}
            <div className="mt-8">
                <h4 className="text-md font-medium mb-4">Prep Items Breakdown</h4>
                <div className="space-y-4">
                    {chartData.map((item) => (
                        <div 
                            key={`menu-item-${item.menuItemId}`}
                            className="bg-gray-50 p-4 rounded-lg"
                        >
                            <div className="flex justify-between items-center">
                                <h5 className="font-medium">{item.name}</h5>
                                <span className="text-sm text-gray-500">
                                    Total: {item.totalQuantity.toLocaleString()} items
                                </span>
                            </div>
                            <div className="mt-2 space-y-2">
                                {item.prepItems.map((prep, index) => (
                                    <div 
                                        key={`${item.menuItemId}-${prep.prepItemId}-${index}`}
                                        className="flex justify-between text-sm"
                                    >
                                        <span>{prep.name}</span>
                                        <span className="font-medium">
                                            {prep.totalUsage.toLocaleString()} {prep.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function TrendsReport({ data }: { data: ReportData }) {
    
    // Since data contains dailyTrends directly, not nested under trends
    if (!data?.dailyTrends?.length) {
        return (
            <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm">
                <p className="text-gray-500 text-center">No trends data available</p>
            </div>
        );
    }

    // Transform daily trends data without the trends nesting
    const processedTrendsData = React.useMemo(() => {
        return data.dailyTrends.map(trend => ({
            date: trend.date,
            total: Number(trend.total),
            trend: trend.trend,
            id: `${trend.date}-${trend.total}`
        }));
    }, [data.dailyTrends]);

    const trendsData = calculateTrends(processedTrendsData);

    // Process category trends without the trends nesting
    const categoryTrendsData = React.useMemo(() => {
        if (!data.categoryTrends) return [];
        
        return data.categoryTrends.map(cat => ({
            category: cat.category,
            total: parseInt(cat.total),
            id: `${cat.category}-${cat.total}`
        }));
    }, [data.categoryTrends]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-2 bg-white p-6 rounded-lg shadow-sm"
            >
                <h3 className="text-lg font-medium mb-4">Sales Trends</h3>
                <div className="h-96">
                    <ResponsiveContainer>
                        <LineChart data={trendsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="date"
                                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <YAxis />
                            <Tooltip
                                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                formatter={(value: number) => [`${value.toFixed(0)}`, 'Sales']}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="total"
                                name="Actual"
                                stroke="#373d20"
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="ema"
                                name="Trend"
                                stroke="#717744"
                                strokeDasharray="5 5"
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Category Distribution */}
            {categoryTrendsData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-2 bg-white p-6 rounded-lg shadow-sm mt-6"
                >
                    <h4 className="text-md font-medium mb-4">Category Distribution</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categoryTrendsData.map((category) => (
                            <div
                                key={category.id}
                                className="bg-gray-50 p-4 rounded-lg"
                            >
                                <div className="font-medium">{category.category}</div>
                                <div className="text-2xl mt-1">
                                    {category.total.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Predictions */}
            {data.predictions && data.predictions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-2 bg-white p-6 rounded-lg shadow-sm mt-6"
                >
                    <h4 className="text-md font-medium mb-4">Sales Predictions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {data.predictions.slice(-3).map((prediction) => (
                            <div
                                key={`prediction-${prediction.date}`}
                                className="bg-gray-50 p-4 rounded-lg"
                            >
                                <div className="text-sm text-gray-500">
                                    {new Date(prediction.date).toLocaleDateString()}
                                </div>
                                <div className="mt-1 text-2xl font-semibold">
                                    {prediction.predictedTotal.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Predicted Sales
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </>
    );
}