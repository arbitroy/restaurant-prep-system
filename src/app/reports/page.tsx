'use client';

import { useState } from 'react';
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
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

import { formatDataForExport, exportCSV, exportXLSX } from '@/lib/utils/reportUtils';
import { ReportData } from '@/types/api';
import { ApiResponse } from '@/types/common';

const COLORS = ['#373d20', '#717744', '#abac7f'] as const;
const REPORT_TYPES = ['sales', 'items', 'trends'] as const;
const EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'] as const;

type ReportType = typeof REPORT_TYPES[number];
type ExportFormat = typeof EXPORT_FORMATS[number];

interface DateRange {
    startDate: Date;
    endDate: Date;
}

export default function ReportsPage() {
    const { restaurantId } = useRestaurant();
    const { showToast } = useToast();
    const [reportType, setReportType] = useState<ReportType>('sales');
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date()
    });

    const { data: reportData, isLoading } = useQuery<ApiResponse<ReportData>>({
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

    const handleExport = (format: ExportFormat): void => {
        if (!reportData?.data) {
            showToast('No data to export', 'error');
            return;
        }
    
        try {
            // Format the data into a flat structure
            const exportData = formatDataForExport(reportData.data);
            
            switch (format) {
                case 'csv':
                    exportCSV(exportData, `${reportType}_report`);
                    break;
                case 'xlsx':
                    exportXLSX(exportData, `${reportType}_report`);
                    break;
                case 'pdf':
                    showToast('PDF export coming soon', 'info');
                    break;
            }
    
            showToast(`Report exported successfully as ${format.toUpperCase()}`, 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred during export';
            showToast(errorMessage, 'error');
            console.error('Export error:', error);
        }
    };

    const handleDateChange = (field: keyof DateRange) => (
        event: React.ChangeEvent<HTMLInputElement>
    ): void => {
        const newDate = new Date(event.target.value);
        setDateRange(prev => ({
            ...prev,
            [field]: newDate
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                <div className="flex space-x-2">
                    {EXPORT_FORMATS.map(format => (
                        <Button 
                            key={format}
                            onClick={() => handleExport(format)}
                        >
                            Export {format.toUpperCase()}
                        </Button>
                    ))}
                </div>
            </div>

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
                        onChange={handleDateChange('startDate')}
                        className="w-40"
                    />
                    <span>to</span>
                    <Input
                        type="date"
                        value={dateRange.endDate.toISOString().split('T')[0]}
                        onChange={handleDateChange('endDate')}
                        className="w-40"
                    />
                </div>
            </div>

            <LoadingState 
                loading={isLoading}
                message="Loading report data..."
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {reportData?.data && (
                        <ReportContent 
                            type={reportType}
                            data={reportData.data}
                        />
                    )}
                </div>
            </LoadingState>
        </div>
    );
}

interface ReportContentProps {
    type: ReportType;
    data: ReportData;
}

function ReportContent({ type, data }: ReportContentProps) {
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
    if (!data.dailyData || !data.summary) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-2 bg-white p-6 rounded-lg shadow-sm"
            >
                <h3 className="text-lg font-medium mb-4">Sales Over Time</h3>
                <div className="h-96">
                    <ResponsiveContainer>
                        <AreaChart data={data.dailyData}>
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
                                data={data.summary.salesByCategory}
                                dataKey="total"
                                nameKey="category"
                                labelLine={false}
                            >
                                {data.summary.salesByCategory.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </>
    );
}

function ItemsReport({ data }: { data: ReportData }) {
    if (!data.items) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2 bg-white p-6 rounded-lg shadow-sm"
        >
            <h3 className="text-lg font-medium mb-4">Item Usage</h3>
            <div className="h-96">
                <ResponsiveContainer>
                    <BarChart data={data.items}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalQuantity" fill="#373d20" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}

function TrendsReport({ data }: { data: ReportData }) {
    if (!data.trends?.dailyTrends) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2 bg-white p-6 rounded-lg shadow-sm"
        >
            <h3 className="text-lg font-medium mb-4">Trends Analysis</h3>
            <div className="h-96">
                <ResponsiveContainer>
                    <LineChart data={data.trends.dailyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#373d20" 
                            activeDot={{ r: 8 }} 
                        />
                        <Line 
                            type="monotone" 
                            dataKey="trend" 
                            stroke="#717744" 
                            strokeDasharray="5 5" 
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}