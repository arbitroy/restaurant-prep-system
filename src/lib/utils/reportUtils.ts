import { ReportData } from '@/types/api';
import * as XLSX from 'xlsx';

// Helper type for flattened data
interface FlattenedRow {
    [key: string]: string | number | boolean;
}

interface DailyData {
    date: string;
    total: number;
    items?: Array<{
        menuItemId: number;
        name: string;
        quantity: number;
    }>;
}

interface TrendData extends DailyData {
    trend: number;
    ema: number;
}


export function calculateTrends(data: DailyData[]): TrendData[] {
    // Constants for EMA calculation
    const smoothingFactor = 0.3; // Adjustable between 0 and 1
    const minDataPoints = 2; // Minimum points needed for trend

    return data.map((day, index, array) => {
        // Calculate trend percentage
        let trend = 0;
        if (index >= minDataPoints) {
            const prevTotal = parseFloat(array[index - 1].total.toString());
            const currentTotal = parseFloat(day.total.toString());
            
            if (prevTotal > 0) {
                trend = ((currentTotal - prevTotal) / prevTotal) * 100;
            }
        }

        // Calculate Exponential Moving Average (EMA)
        const currentTotal = parseFloat(day.total.toString());
        const ema = index > 0
            ? array[index - 1].total * (1 - smoothingFactor) + currentTotal * smoothingFactor
            : currentTotal;

        return {
            ...day,
            trend: parseFloat(trend.toFixed(2)),
            ema: parseFloat(ema.toFixed(2))
        };
    });
}


function flattenSummaryData(summary: ReportData['summary']): FlattenedRow[] {
    const baseData = {
        'Total Sales': summary.totalSales,
        'Average Daily': summary.averageDaily,
    };

    // Create separate rows for category data
    return [
        baseData,
        ...summary.salesByCategory.map(category => ({
            Category: category.category,
            Total: category.total,
            Percentage: category.percentage
        }))
    ];
}

function flattenDailyData(dailyData: ReportData['dailyData']): FlattenedRow[] {
    return dailyData.map(day => ({
        Date: day.date,
        Total: day.total,
        ...day.items.reduce((acc, item, index) => ({
            ...acc,
            [`Item_${index + 1}_Name`]: item.name,
            [`Item_${index + 1}_Quantity`]: item.quantity
        }), {})
    }));
}

function flattenItemsData(items: NonNullable<ReportData['items']>): FlattenedRow[] {
    return items.map(item => ({
        Name: item.name,
        Category: item.category,
        'Total Quantity': item.totalQuantity,
        'Average Daily': item.averageDaily,
        'Prep Items': item.prepItems
            .map(prep => `${prep.name}: ${prep.totalUsage} ${prep.unit}`)
            .join('; ')
    }));
}

export function formatDataForExport(data: ReportData): FlattenedRow[] {
    const rows: FlattenedRow[] = [];

    // Add a type identifier to each row
    if (data.summary) {
        rows.push(...flattenSummaryData(data.summary).map(row => ({
            Type: 'Summary',
            ...row
        })));
    }

    if (data.dailyData) {
        rows.push(...flattenDailyData(data.dailyData).map(row => ({
            Type: 'Daily',
            ...row
        })));
    }

    if (data.items) {
        rows.push(...flattenItemsData(data.items).map(row => ({
            Type: 'Item',
            ...row
        })));
    }

    if (data.dailyTrends) {
        rows.push(...data.dailyTrends.map(trend => ({
            Type: 'Trend',
            Date: trend.date,
            Total: trend.total,
            Trend: trend.trend
        })));
    }

    return rows;
}

export function exportCSV(data: FlattenedRow[], filename: string): void {
    // Get all unique headers
    const headers = Array.from(
        new Set(
            data.flatMap(row => Object.keys(row))
        )
    );

    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header] ?? '';
                // Properly escape and quote strings
                return typeof value === 'string' && value.includes(',')
                    ? `"${value.replace(/"/g, '""')}"` 
                    : value;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
}

export function exportXLSX(data: FlattenedRow[], filename: string): void {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}.xlsx`);
}