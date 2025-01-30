import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PrepRequirement, TaskUpdate } from '@/types/prep';
import { PrepTaskItem } from './PrepTaskItem';

interface PrepSheetProps {
    title: string;
    date: Date;
    requirements: PrepRequirement[];
    showControls?: boolean;
    onTaskUpdate?: (update: TaskUpdate) => Promise<void>;
    isUpdating?: boolean;
}

export function PrepSheet({
    title,
    date,
    requirements,
    showControls = true,
    onTaskUpdate,
    isUpdating
}: PrepSheetProps) {
    const [showCompleted, setShowCompleted] = useState(false);

    const visibleRequirements = showCompleted
        ? requirements
        : requirements.filter(req =>
            !req.task || req.task.status !== 'completed'
        );

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <p className="text-gray-500">{date.toLocaleDateString()}</p>
                </div>
                {showControls && (
                    <Button
                        variant="outline"
                        onClick={() => setShowCompleted(!showCompleted)}
                    >
                        {showCompleted ? 'Hide Completed' : 'Show Completed'}
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {visibleRequirements.map((requirement) => (
                    <PrepTaskItem
                        key={requirement.id}
                        requirement={requirement}
                        onTaskUpdate={onTaskUpdate}
                        isUpdating={isUpdating}
                    />
                ))}
            </div>
        </div>
    );
}