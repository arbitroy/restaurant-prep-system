import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PrepRequirement } from '@/types/prep';
import { PREP_SHEETS } from '@/lib/constants/prep-items';

interface PrepCalculatorProps {
    requirements: PrepRequirement[];
    onSheetChange?: (sheet: string) => void;
    onPrint?: () => void;
}

export function PrepCalculator({
    requirements,
    onSheetChange,
    onPrint
}: PrepCalculatorProps) {
    const [selectedSheet, setSelectedSheet] = useState<string>(PREP_SHEETS[0]);

    const handleSheetChange = (sheet: string) => {
        setSelectedSheet(sheet);
        onSheetChange?.(sheet);
    };

    const filteredRequirements = requirements.filter(
        req => req.sheetName === selectedSheet
    );

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
                        onClick={onPrint}
                    >
                        Print Sheet
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredRequirements.map((req) => (
                    <motion.div
                        key={req.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 border rounded-lg"
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

                {filteredRequirements.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                        No prep requirements for this sheet
                    </p>
                )}
            </div>
        </motion.div>
    );
}
