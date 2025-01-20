// src/components/forms/PrepSettingsForm.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { PrepItem } from '@/types/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PrepSettingsFormProps {
    restaurantId: number;
    prepItems: PrepItem[];
    onClose: () => void;
}

export function PrepSettingsForm({ 
    restaurantId, 
    prepItems, 
    onClose 
}: PrepSettingsFormProps) {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [selectedItem, setSelectedItem] = useState<string>('');
    const [settings, setSettings] = useState({
        bufferPercentage: 50,
        minimumQuantity: 0
    });

    const updateSettings = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch('/api/prep/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update settings');
            return response.json();
        },
        onSuccess: () => {
            showToast('Prep settings updated successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['prepSettings'] });
            onClose();
        },
        onError: () => {
            showToast('Failed to update prep settings', 'error');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) {
            showToast('Please select a prep item', 'error');
            return;
        }

        updateSettings.mutate({
            restaurantId,
            prepItemId: parseInt(selectedItem),
            ...settings
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <Select
                label="Prep Item"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                options={Array.isArray(prepItems) ? prepItems.map(item => ({
                    value: item.id.toString(),
                    label: `${item.name} (${item.unit})`
                })) : []}
            />
            <Input
                type="number"
                label="Buffer Percentage"
                min="0"
                max="200"
                value={settings.bufferPercentage}
                onChange={(e) => setSettings(prev => ({
                    ...prev,
                    bufferPercentage: parseInt(e.target.value)
                }))}
                className="w-full"
            />
            <Input
                type="number"
                label="Minimum Quantity"
                min="0"
                step="0.1"
                value={settings.minimumQuantity}
                onChange={(e) => setSettings(prev => ({
                    ...prev,
                    minimumQuantity: parseFloat(e.target.value)
                }))}
                className="w-full"
            />
            <div className="flex space-x-4">
                <Button
                    type="submit"
                    onClick={handleSubmit}
                    isLoading={updateSettings.status === 'pending'}
                    className="flex-1"
                >
                    Save Settings
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                >
                    Cancel
                </Button>
            </div>
        </motion.div>
    );
}