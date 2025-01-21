import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { calculateDailyPrep, type PrepCalculation } from '@/lib/utils/prepCalculations';
import _ from 'lodash';
import { useToast } from '@/components/ui/Toast/ToastContext';

interface HistoricalSale {
    date: Date;
    itemId: number;
    name: string;
    quantity: number;
    unit: string;
}

interface DailyPrepBreakdownProps {
    historicalSales: HistoricalSale[];
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
    const [localBufferPercentage, setLocalBufferPercentage] = useState(initialBuffer);
    const [calculations, setCalculations] = useState<PrepCalculation[]>([]);
    const { showToast } = useToast();

    // Debounced function to update parent component
    const debouncedBufferChange = useCallback(
        _.debounce((value: number) => {
            onBufferChange(value);
            showToast(`Buffer updated to ${value}%`, 'success');
        }, 500),
        [onBufferChange, showToast]
    );

    // Update local buffer when initialBuffer changes
    useEffect(() => {
        setLocalBufferPercentage(initialBuffer);
    }, [initialBuffer]);

    // Update calculations when buffer or historical sales change
    useEffect(() => {
        const newCalculations = calculateDailyPrep(
            historicalSales, 
            currentDate, 
            localBufferPercentage
        );
        setCalculations(newCalculations);
    }, [historicalSales, currentDate, localBufferPercentage]);

    // Cleanup debounced function
    useEffect(() => {
        return () => {
            debouncedBufferChange.cancel();
        };
    }, [debouncedBufferChange]);

    const handleBufferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        setLocalBufferPercentage(value);
        debouncedBufferChange(value);
    };

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
                {calculations.map((calc) => {
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
                })}
            </div>
        </div>
    );
}