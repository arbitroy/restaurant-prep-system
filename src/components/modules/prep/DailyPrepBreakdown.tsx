import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { calculateDailyPrep } from '@/lib/utils/prepCalculations';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { HistoricalUsage, PrepCalculation } from '@/types/prep';
import _ from 'lodash';

interface DailyPrepBreakdownProps {
    historicalSales: HistoricalUsage[];
    currentDate: Date;
    onBufferChange: (value: number) => void;
    initialBuffer?: number;
}

export default function DailyPrepBreakdown({
    historicalSales,
    currentDate,
    onBufferChange,
    initialBuffer = 50
}: DailyPrepBreakdownProps) {
    const [calculations, setCalculations] = useState<PrepCalculation[]>([]);
    const [localBuffer, setLocalBuffer] = useState(initialBuffer);
    const { showToast } = useToast();


    useEffect(() => {
        if (historicalSales.length > 0) {
            try {
                // Ensure dates are properly converted
                const processedSales = historicalSales.map(sale => ({
                    ...sale,
                    date: new Date(sale.date)
                }));
                
                const results = calculateDailyPrep(processedSales, currentDate, localBuffer);
                setCalculations(results);
            } catch (error) {
                console.error('Error calculating prep requirements:', error);
                showToast('Error calculating prep requirements', 'error');
            }
        }
    }, [historicalSales, currentDate, localBuffer, showToast]);

    const handleBufferChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 0 || value > 100) {
            showToast('Buffer must be between 0 and 100', 'error');
            return;
        }
        setLocalBuffer(value);
        // Apply debounce directly in the handler
        _.debounce(() => onBufferChange(value), 300)();
    }, [onBufferChange, showToast]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg">
                <label className="text-sm font-medium">Buffer Percentage:</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={localBuffer}
                    onChange={handleBufferChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#373d20]"
                />
                <span className="text-sm font-medium">{localBuffer}%</span>
            </div>

            <div className="space-y-4">
                {calculations.map((calc) => (
                    <motion.div
                        key={`calc-${calc.itemId}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-4 rounded-lg shadow-sm"
                    >
                        <h3 className="font-medium text-lg mb-3">{calc.name}</h3>
                        <div className="grid grid-cols-7 gap-2">
                            {calc.dailyRequirements.map((day, dayIndex) => (
                                <div
                                    key={`${calc.itemId}-day-${dayIndex}`}
                                    className={`p-2 rounded ${
                                        day.percentage > 0 ? 'bg-[#abac7f]/20' : 'bg-gray-50'
                                    }`}
                                >
                                    <div className="text-xs font-medium">{day.day}</div>
                                    <div className="text-sm">
                                        {day.quantity.toFixed(1)} {calc.unit}
                                    </div>
                                    {day.percentage > 0 && (
                                        <div className="text-xs text-gray-500">
                                            {day.percentage}%
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-right font-medium">
                            Required: {calc.totalRequired} {calc.unit}
                            {calc.bufferPercentage > 0 && (
                                <span className="ml-2 text-sm text-gray-500">
                                    (With {calc.bufferPercentage}% buffer)
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}