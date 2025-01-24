import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { calculateDailyPrep } from '@/lib/utils/prepCalculations';
import _ from 'lodash';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { HistoricalUsage, PrepCalculation } from '@/types/prep';
import { LoadingSpinner } from '@/components/ui/loading';

interface DailyPrepBreakdownProps {
    historicalSales: HistoricalUsage[];
    currentDate: Date;
    onBufferChange: (value: number) => void;
    initialBuffer?: number;
    isLoading?: boolean;
}

export default function DailyPrepBreakdown({
    historicalSales,
    currentDate,
    onBufferChange,
    initialBuffer = 50,
    isLoading = false
}: DailyPrepBreakdownProps) {
    const [localBufferPercentage, setLocalBufferPercentage] = useState(initialBuffer);
    const [calculations, setCalculations] = useState<PrepCalculation[]>([]);
    const { showToast } = useToast();

    // Create a ref for the debounced function
    const debouncedFn = useRef(_.debounce((value: number) => {
        try {
            onBufferChange(value);
            showToast(`Buffer updated to ${value}%`, 'success');
        } catch (error) {
            showToast('Failed to update buffer percentage', 'error');
        }
    }, 500));

    // Update local buffer and trigger debounced change
    const handleBufferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 0 || value > 100) {
            showToast('Buffer must be between 0 and 100', 'error');
            return;
        }
        setLocalBufferPercentage(value);
        debouncedFn.current(value);
    };

    // Update local buffer when initial buffer changes
    useEffect(() => {
        setLocalBufferPercentage(initialBuffer);
    }, [initialBuffer]);

    // Cleanup debounced function
    useEffect(() => {
        const currentFn = debouncedFn.current;
        return () => {
            currentFn.cancel();
        };
    }, []);

    // Update calculations when buffer or historical sales change
    useEffect(() => {
        try {
            const newCalculations = calculateDailyPrep(
                historicalSales,
                currentDate,
                localBufferPercentage
            );
            setCalculations(newCalculations);
        } catch (error) {
            showToast('Error calculating prep requirements', 'error');
        }
    }, [historicalSales, currentDate, localBufferPercentage]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Next Day Buffer:</label>
                    <span className="text-sm font-medium">{localBufferPercentage}%</span>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={localBufferPercentage}
                        onChange={handleBufferChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#373d20]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {calculations.length > 0 ? (
                    calculations.map((calc) => {
                        const itemKey = `prep-item-${calc.itemId}`;

                        return (
                            <motion.div
                                key={itemKey}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-4 rounded-lg shadow-sm"
                            >
                                <h3 className="font-medium text-lg mb-3">{calc.name}</h3>
                                <div className="grid grid-cols-7 gap-2">
                                    {calc.dailyRequirements.map((day, index) => {
                                        const dayKey = `${itemKey}-day-${day.day}-${index}`;
                                        return (
                                            <div
                                                key={dayKey}
                                                className={`p-2 rounded ${
                                                    day.percentage > 0
                                                        ? 'bg-[#abac7f] text-white'
                                                        : 'bg-gray-100'
                                                }`}
                                            >
                                                <div className="text-xs font-medium">{day.day}</div>
                                                <div className="text-sm">
                                                    {day.quantity.toFixed(1)} {calc.unit}
                                                </div>
                                                {day.percentage > 0 && (
                                                    <div className="text-xs">({day.percentage}%)</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 text-right font-medium">
                                    Total Required: {calc.totalRequired.toFixed(1)} {calc.unit}
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        No historical data available for calculations
                    </div>
                )}
            </div>
        </div>
    );
}