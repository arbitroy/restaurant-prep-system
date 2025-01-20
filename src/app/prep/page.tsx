'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PrepCalculator } from '@/components/modules/prep/PrepCalculator';
import { PrepSheet } from '@/components/modules/prep/PrepSheet';
import { PrepSettingsForm } from '@/components/forms/PrepSettingsForm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePrep } from '@/hooks/usePrep';
import { PREP_SHEETS } from '@/lib/constants/prep-items';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { useQuery } from '@tanstack/react-query';

export default function PrepPage() {
    const { restaurantId } = useRestaurant();
    const { showToast } = useToast();
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [activeView, setActiveView] = useState<'calculator' | 'tasks'>('calculator');
    const printRef = useRef<HTMLDivElement>(null);

    const {
        prepSheets,
        isLoading,
        selectedDate,
        setSelectedDate,
        selectedSheet,
        setSelectedSheet,
        prepItems
    } = usePrep({
        restaurantId
    });

    // Fetch prep tasks for the day
    const { data: prepTasks } = useQuery({
        queryKey: ['prepTasks', restaurantId, selectedDate],
        queryFn: async () => {
            const response = await fetch(
                `/api/prep/tasks?restaurantId=${restaurantId}&date=${selectedDate.toISOString()}`
            );
            if (!response.ok) throw new Error('Failed to fetch prep tasks');
            return response.json();
        }
    });

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) {
            showToast('Nothing to print', 'error');
            return;
        }

        try {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                showToast('Failed to open print window', 'error');
                return;
            }

            const styles = Array.from(document.styleSheets)
                .map(sheet => {
                    try {
                        return Array.from(sheet.cssRules)
                            .map(rule => rule.cssText)
                            .join('\n');
                    } catch {
                        return '';
                    }
                })
                .join('\n');

            printWindow.document.write(`
                <html>
                    <head>
                        <style>${styles}</style>
                    </head>
                    <body>
                        ${content.outerHTML}
                    </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            showToast('Print job sent successfully', 'success');
        } catch (error) {
            showToast('Failed to print', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-semibold text-gray-900">Prep Management</h1>
                    <div className="flex space-x-2">
                        <Button
                            variant={activeView === 'calculator' ? 'primary' : 'outline'}
                            onClick={() => setActiveView('calculator')}
                        >
                            Calculator
                        </Button>
                        <Button
                            variant={activeView === 'tasks' ? 'primary' : 'outline'}
                            onClick={() => setActiveView('tasks')}
                        >
                            Tasks
                        </Button>
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
                    <Button
                        variant="outline"
                        onClick={() => setShowPrintPreview(!showPrintPreview)}
                    >
                        {showPrintPreview ? 'Hide Preview' : 'Print Preview'}
                    </Button>
                    {showPrintPreview && (
                        <Button onClick={handlePrint}>
                            Print Sheets
                        </Button>
                    )}
                </div>
            </div>

            {showSettings && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm p-6"
                >
                    <h2 className="text-lg font-medium mb-4">Prep Settings</h2>
                    <PrepSettingsForm
                        restaurantId={restaurantId}
                        prepItems={prepItems}
                        onClose={() => setShowSettings(false)}
                    />
                </motion.div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
            ) : showPrintPreview ? (
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
                </div>
            ) : activeView === 'calculator' ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <PrepCalculator
                        requirements={prepSheets.flatMap(sheet => sheet.items)}
                        onSheetChange={setSelectedSheet}
                        onPrint={() => {
                            setShowPrintPreview(true);
                            showToast('Switched to print preview', 'info');
                        }}
                    />
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {PREP_SHEETS.map((sheetName) => {
                        const sheet = prepSheets.find(s => s.sheetName === sheetName);
                        if (!sheet?.items.length) return null;

                        return (
                            <div key={sheetName} className="mb-8">
                                <PrepSheet
                                    title={sheetName}
                                    date={selectedDate}
                                    requirements={sheet.items}
                                    showControls={true}
                                />
                            </div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}