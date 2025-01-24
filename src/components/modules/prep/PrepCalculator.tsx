import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/loading';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { PrepRequirement } from '@/types/prep';
import { PREP_SHEETS } from '@/lib/constants/prep-items';

interface PrepCalculatorProps {
    requirements: PrepRequirement[];
    isLoading?: boolean;
    onSheetChange?: (sheet: string) => void;
    onPrint?: () => void;
}

export function PrepCalculator({
    requirements,
    isLoading = false,
    onSheetChange,
    onPrint
}: PrepCalculatorProps) {
    const [selectedSheet, setSelectedSheet] = useState<string>(PREP_SHEETS[0]);
    const { showToast } = useToast();

    const handleSheetChange = (sheet: string) => {
        try {
            setSelectedSheet(sheet);
            onSheetChange?.(sheet);
            showToast('Sheet changed successfully', 'success');
        } catch (error) {
            showToast('Failed to change sheet', 'error');
        }
    };

    const handlePrint = () => {
        try {
            onPrint?.();
            showToast('Preparing print view...', 'success');
        } catch (error) {
            showToast('Failed to print prep sheet', 'error');
        }
    };

    // Ensure requirements array is unique by id
    const uniqueRequirements = requirements.filter((req, index, self) =>
        index === self.findIndex((r) => r.id === req.id)
    );

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-center items-center h-48">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Prep Calculator</h3>
                <div className="flex space-x-2">
                    <Select
                        value={selectedSheet}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        options={PREP_SHEETS.map(sheet => ({
                            value: sheet,
                            label: sheet
                        }))}
                    />
                    <Button
                        variant="outline"
                        onClick={handlePrint}
                    >
                        Print Sheet
                    </Button>
                </div>
            </div>

            {uniqueRequirements.length > 0 ? (
                <div className="space-y-4">
                    {uniqueRequirements.map((req) => (
                        <motion.div
                            key={`req-${req.id}-${req.name}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-medium">{req.name}</h4>
                                    <p className="text-sm text-gray-500">
                                        Required: {req.quantity} {req.unit}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Next Day Buffer</p>
                                    <p className="font-medium">
                                        +{Math.ceil(req.quantity * 0.5)} {req.unit}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <p>No prep requirements for this sheet</p>
                    <Button
                        variant="outline"
                        onClick={() => handleSheetChange(PREP_SHEETS[0])}
                        className="mt-2"
                    >
                        Reset Sheet
                    </Button>
                </div>
            )}
        </motion.div>
    );
}