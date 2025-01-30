'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PrepCalculator } from '@/components/modules/prep/PrepCalculator';
import { PrepSheet } from '@/components/modules/prep/PrepSheet';
import { PrepSettingsForm } from '@/components/forms/PrepSettingsForm';
import DailyPrepBreakdown from '@/components/modules/prep/DailyPrepBreakdown';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePrep } from '@/hooks/usePrep';
import { PREP_SHEETS } from '@/lib/constants/prep-items';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { PrepView, PrepItemFormData, PrepRequirement } from '@/types/prep';
import { usePrepTasks } from '@/hooks/usePrepTasks';

export default function PrepPage() {
    const { restaurantId } = useRestaurant();
    const { showToast } = useToast();
    const [showSettings, setShowSettings] = useState(false);
    const [activeView, setActiveView] = useState<PrepView>('calculator');
    const [bufferPercentage, setBufferPercentage] = useState(50);
    const printRef = useRef<HTMLDivElement>(null);

    const {
        prepSheets,
        historicalSales,
        prepItems,
        isLoading,
        error,
        selectedDate,
        setSelectedDate,
        updatePrepItemOrder,
        isUpdatingOrder,
        optimisticUpdates
    } = usePrep({
        restaurantId,
        bufferPercentage
    });

    const {
        updateTask
    } = usePrepTasks({
        restaurantId,
        date: selectedDate
    });

    const handlePrint = () => {
        if (!printRef.current) {
            showToast('Nothing to print', 'error');
            return;
        }

        try {
            window.print();
            showToast('Print job sent successfully', 'success');
        } catch (error) {
            showToast('Failed to print', 'error');
            console.error('Print error:', error);
        }
    };

    const handleBufferChange = (value: number) => {
        setBufferPercentage(value);
        showToast(`Buffer percentage updated to ${value}%`, 'success');
    };

    type UpdateTaskInput = {
        id: number;
        completedQuantity?: number;
        status?: 'pending' | 'in_progress' | 'completed';
        notes?: string;
    };

    const handleTaskUpdate = async (task: UpdateTaskInput): Promise<void> => {
        await updateTask.mutateAsync(task);
    };

    const prepItemsForSettings: PrepItemFormData[] = prepItems.map(item => ({
        ...item,
        restaurantId
    }));

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#373d20]" />
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    <p>Error loading prep data: {error.message}</p>
                    <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </Button>
                </div>
            );
        }

        switch (activeView) {
            case 'calculator': {
                // Transform prepSheets into PrepRequirements array
                const requirements = (prepSheets as unknown as PrepRequirement[]);
                return (
                    <div className="space-y-6">
                        <PrepCalculator
                            requirements={requirements}
                            currentDate={selectedDate}
                            bufferPercent={bufferPercentage}
                            restaurantId={restaurantId}
                            onOrderChange={updatePrepItemOrder}
                            isUpdating={isUpdatingOrder}
                            optimisticUpdates={optimisticUpdates}
                        />
                        <DailyPrepBreakdown
                            historicalSales={historicalSales}
                            currentDate={selectedDate}
                            onBufferChange={handleBufferChange}
                            initialBuffer={bufferPercentage}
                        />
                    </div>
                );
            }

            case 'tasks':
                return (
                    <div className="space-y-8">
                        {PREP_SHEETS.map((sheetName) => {
                            const sheetRequirements = ((prepSheets as unknown) as PrepRequirement[])
                                .filter(s => s.sheetName === sheetName);

                            // Only render if we have requirements for this sheet
                            if (sheetRequirements.length === 0) return null;
                            return (
                                <PrepSheet
                                    key={`${sheetName}-${selectedDate.toISOString()}`}
                                    title={sheetName}
                                    date={selectedDate}
                                    requirements={sheetRequirements}
                                    restaurantId={restaurantId}
                                    showControls
                                    onTaskUpdate={handleTaskUpdate}
                                    isUpdating={updateTask.isLoading}
                                />
                            );
                        })}
                    </div>
                );

            case 'print':
                if (prepSheets.length === 0) {
                    return (
                        <div className="p-4 bg-yellow-50 rounded-lg">
                            <p className="text-yellow-700">No prep sheets available to print.</p>
                        </div>
                    );
                }

                return (
                    <div ref={printRef}>
                        {PREP_SHEETS.map(sheetName => {
                            const sheetRequirements = ((prepSheets as unknown) as PrepRequirement[])
                                .filter(s => s.sheetName === sheetName);

                            // Only render if we have requirements for this sheet
                            if (sheetRequirements.length === 0) return null;

                            return (
                                <div key={sheetName} className="mb-8 page-break-after-always">
                                    <PrepSheet
                                        restaurantId={restaurantId}
                                        title={sheetName}
                                        date={selectedDate}
                                        requirements={sheetRequirements}
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

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-semibold text-gray-900">Prep Management</h1>
                    <div className="flex space-x-2">
                        {(['calculator', 'tasks', 'print'] as const).map(view => (
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
                        onChange={e => setSelectedDate(new Date(e.target.value))}
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

            {showSettings && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm p-6"
                >
                    <h2 className="text-lg font-medium mb-4">Prep Settings</h2>
                    <PrepSettingsForm
                        restaurantId={restaurantId}
                        prepItems={prepItemsForSettings}
                        onClose={() => setShowSettings(false)}
                    />
                </motion.div>
            )}

            {renderContent()}
        </div>
    );
}