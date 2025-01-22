'use client';

import { JSX, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PrepCalculator } from '@/components/modules/prep/PrepCalculator';
import { PrepSheet } from '@/components/modules/prep/PrepSheet';
import { PrepSettingsForm } from '@/components/forms/PrepSettingsForm';
import DailyPrepBreakdown from '@/components/modules/prep/DailyPrepBreakdown';
import PrepSheetOrganizer from '@/components/modules/prep/PrepSheetOrganizer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePrep } from '@/hooks/usePrep';
import { PREP_SHEETS } from '@/lib/constants/prep-items';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { useQuery } from '@tanstack/react-query';
import type {
    PrepSheet as PrepSheetType,
    PrepTask,
    HistoricalUsage,
    PrepItemBase
} from '@/types/prep';

type PrepView = 'calculator' | 'tasks' | 'organize' | 'print' | 'settings';


interface PrepControlsProps {
    activeView: PrepView;
    setActiveView: (view: PrepView) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    setShowSettings: (show: boolean) => void;
}

interface PrepContentProps {
    activeView: PrepView;
    prepSheets: PrepSheetType[];
    historicalSales: HistoricalUsage[];
    selectedDate: Date;
    bufferPercentage: number;
    setSelectedSheet: (sheet: string) => void;
    handleBufferChange: (value: number) => void;
    handleOrderChange: (items: PrepItemBase[]) => Promise<void>;
    handlePrint: () => void;
    printRef: React.RefObject<HTMLDivElement>;
}

function PrepControls({
    activeView,
    setActiveView,
    selectedDate,
    setSelectedDate,
    setShowSettings
}: PrepControlsProps): JSX.Element {
    return (
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-semibold text-gray-900">Prep Management</h1>
                <div className="flex space-x-2">
                    {(['calculator', 'tasks', 'organize', 'print'] as const).map((view) => (
                        <Button
                            key={view}
                            variant={activeView === view ? 'primary' : 'outline'}
                            onClick={() => setActiveView(view)}
                        >
                            {view.charAt(0).toUpperCase() + view.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="flex space-x-4">
                <Input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="w-48"
                />
                <Button
                    variant="outline"
                    onClick={() => setShowSettings(true)}
                >
                    Settings
                </Button>
            </div>
        </div>
    );
}

function PrepContent({
    activeView,
    prepSheets,
    historicalSales,
    selectedDate,
    bufferPercentage,
    setSelectedSheet,
    handleBufferChange,
    handleOrderChange,
    handlePrint,
    printRef
}: PrepContentProps): JSX.Element {
    if (activeView === 'calculator') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <PrepCalculator
                    requirements={prepSheets.flatMap(sheet => sheet.items)}
                    onSheetChange={setSelectedSheet}
                    onPrint={() => handlePrint()}
                />
                <div className="mt-6">
                <DailyPrepBreakdown
                historicalSales={historicalSales.map(sale => ({
                    ...sale,
                    date: new Date(sale.date),
                    itemId: sale.prepItemId,
                    name: sale.name,
                }))}
                currentDate={selectedDate}
                onBufferChange={handleBufferChange}
                initialBuffer={bufferPercentage}
            />
                </div>
            </motion.div>
        );
    }

    if (activeView === 'tasks') {
        return (
            <>
                {PREP_SHEETS.map((sheetName) => {
                    const sheet = prepSheets.find(s => s.sheetName === sheetName);
                    if (!sheet?.items.length) return null;

                    return (
                        <div
                            key={`sheet-${sheetName}-${selectedDate.toISOString()}`}
                            className="mb-8"
                        >
                            <PrepSheet
                                title={sheetName}
                                date={selectedDate}
                                requirements={sheet.items}
                                showControls
                            />
                        </div>
                    );
                })}
            </>
        );
    }

    if (activeView === 'organize') {
        return (
            <PrepSheetOrganizer
                items={prepSheets.flatMap(sheet => sheet.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    sheetName: sheet.sheetName,
                    order: item.order || 0,
                    unit: item.unit
                })))}
                onOrderChange={handleOrderChange}
            />
        );
    }

    // Print view
    if (prepSheets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p>No prep sheets available</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSelectedSheet(PREP_SHEETS[0])}
                >
                    Create Prep Requirements
                </Button>
            </div>
        );
    }

    return (
        <div ref={printRef}>
            {PREP_SHEETS.map((sheetName) => {
                const sheet = prepSheets.find(s => s.sheetName === sheetName);
                if (!sheet?.items.length) return null;

                return (
                    <div key={sheetName} className="mb-8 page-break-after-always">
                        <PrepSheet
                            title={sheetName}
                            date={selectedDate}
                            requirements={sheet.items}
                            showControls={false}
                        />
                    </div>
                );
            })}
            <div className="flex justify-end mt-4">
                <Button onClick={handlePrint}>
                    Print Sheets
                </Button>
            </div>
        </div>
    );
}

export default function PrepPage(): JSX.Element {
    const { restaurantId } = useRestaurant();
    const { showToast } = useToast();
    const [showSettings, setShowSettings] = useState(false);
    const [activeView, setActiveView] = useState<PrepView>('calculator');
    const [bufferPercentage, setBufferPercentage] = useState(50);
    const printRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

    const {
        prepSheets = [],
        historicalSales = [],
        prepItems = [],
        isLoading,
        error,
        selectedDate,
        setSelectedDate,
        setSelectedSheet,
        updatePrepItemOrder,
    } = usePrep({
        restaurantId,
        bufferPercentage
    });

    // Fetch prep tasks
    useQuery({
        queryKey: ['prepTasks', restaurantId, selectedDate],
        queryFn: async () => {
            const response = await fetch(
                `/api/prep/tasks?restaurantId=${restaurantId}&date=${selectedDate.toISOString()}`
            );
            if (!response.ok) throw new Error('Failed to fetch prep tasks');
            return response.json() as Promise<{ data: PrepTask[] }>;
        }
    });

    const handlePrint = (): void => {
        if (!printRef.current) {
            showToast('Nothing to print', 'error');
            return;
        }

        try {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                showToast('Failed to open print window', 'error');
                return;
            }

            printWindow.document.write(generatePrintContent(printRef.current.outerHTML));
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            showToast('Print job sent successfully', 'success');
        } catch (error) {
            showToast('Failed to print', 'error');
            console.error('Print error:', error);
        }
    };

    const handleBufferChange = (value: number): void => {
        setBufferPercentage(value);
        showToast(`Buffer percentage updated to ${value}%`, 'success');
    };

    const handleOrderChange = async (items: PrepItemBase[]): Promise<void> => {
        try {
            // Convert PrepItemOrganizer to PrepOrderUpdate
            const updates = items.map(({ id, order, sheetName }) => ({
                id,
                order: order ?? 0, // Provide a default value of 0 if order is undefined
                sheetName
            }));
            
            await updatePrepItemOrder(updates);
            showToast('Prep item order updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update item order', 'error');
            console.error('Order update error:', error);
        }
    };

    return (
        <div className="space-y-6">
            <PrepControls
                activeView={activeView}
                setActiveView={setActiveView}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setShowSettings={setShowSettings}
            />

            {showSettings && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm p-6"
                >
                    <h2 className="text-lg font-medium mb-4">Prep Settings</h2>
                    <PrepSettingsForm
                        restaurantId={restaurantId}
                        prepItems={prepItems.map(item => ({
                            ...item,
                            restaurantId
                        }))}
                        onClose={() => setShowSettings(false)}
                    />
                </motion.div>
            )}

            {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    <p>Error loading prep data. Please try again.</p>
                    <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </Button>
                </div>
            ) : isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#373d20]" />
                </div>
            ) : (
                <PrepContent
                    activeView={activeView}
                    prepSheets={prepSheets}
                    historicalSales={historicalSales}
                    selectedDate={selectedDate}
                    bufferPercentage={bufferPercentage}
                    setSelectedSheet={setSelectedSheet}
                    handleBufferChange={handleBufferChange}
                    handleOrderChange={handleOrderChange}
                    handlePrint={handlePrint}
                    printRef={printRef}
                />
            )}
        </div>
    );
}

// Helper function for print content
function generatePrintContent(content: string): string {
    return `
        <html>
            <head>
                <title>Prep Sheets</title>
                <style>
                    @media print {
                        .page-break { page-break-after: always; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 8px; text-align: left; }
                        th { border-bottom: 2px solid #000; }
                        td { border-bottom: 1px solid #ddd; }
                    }
                </style>
            </head>
            <body>${content}</body>
        </html>
    `;
}