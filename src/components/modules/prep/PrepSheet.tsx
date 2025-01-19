import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { PrepRequirement } from '@/types/prep';

interface PrepSheetProps {
    title: string;
    date: Date;
    requirements: PrepRequirement[];
}

export const PrepSheet = forwardRef<HTMLDivElement, PrepSheetProps>(
    ({ title, date, requirements }, ref) => {
        return (
            <div ref={ref} className="bg-white p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold">{title}</h2>
                        <p className="text-gray-500">
                            {date.toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="space-y-8">
                        {requirements.length > 0 ? (
                            Object.entries(
                                requirements.reduce((acc, req) => {
                                    if (!acc[req.sheetName]) {
                                        acc[req.sheetName] = [];
                                    }
                                    acc[req.sheetName].push(req);
                                    return acc;
                                }, {} as Record<string, PrepRequirement[]>)
                            ).map(([sheetName, items]) => (
                                <div key={sheetName} className="space-y-4">
                                    <h3 className="text-xl font-semibold border-b pb-2">
                                        {sheetName}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-4 border rounded-lg flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-gray-500">{item.unit}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">
                                                        {item.quantity}
                                                    </p>
                                                    <div className="h-8 w-16 border-b border-gray-300 mt-2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                No prep requirements found
                            </p>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t">
                        <div className="grid grid-cols-3 gap-8">
                            <div>
                                <p className="text-sm text-gray-500">Prepared By</p>
                                <div className="h-8 border-b border-gray-300 mt-2" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Checked By</p>
                                <div className="h-8 border-b border-gray-300 mt-2" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Date/Time</p>
                                <div className="h-8 border-b border-gray-300 mt-2" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);