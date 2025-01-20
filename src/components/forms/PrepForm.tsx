'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { MenuItem, PrepItem } from '@/types/common';
import { usePrep } from '@/hooks/usePrep';
import { UNITS, PREP_SHEETS } from '@/lib/constants/prep-items';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PrepFormProps {
    restaurantId: number;
    onSubmit?: () => void;
    onCancel?: () => void;
}

export function PrepForm({ 
    restaurantId, 
    onSubmit,
    onCancel
}: PrepFormProps) {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<{
        name: string;
        unit: string;
        sheetName: string;
    }>({
        name: '',
        unit: UNITS[0],
        sheetName: PREP_SHEETS[0]
    });

    const addPrepItem = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch('/api/items/prep', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    restaurantId
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add prep item');
            }
            
            return response.json();
        },
        onSuccess: () => {
            showToast('Prep item added successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['prepItems'] });
            onSubmit?.();
            // Reset form
            setFormData({
                name: '',
                unit: UNITS[0],
                sheetName: PREP_SHEETS[0]
            });
        },
        onError: (error: any) => {
            showToast(error.message || 'Failed to add prep item', 'error');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.unit || !formData.sheetName) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        addPrepItem.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Item Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({
                    ...prev,
                    name: e.target.value
                }))}
                placeholder="Enter prep item name"
                required
            />
            
            <Select
                label="Unit"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({
                    ...prev,
                    unit: e.target.value
                }))}
                options={UNITS.map(unit => ({
                    value: unit,
                    label: unit
                }))}
                required
            />

            <Select
                label="Prep Sheet"
                value={formData.sheetName}
                onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sheetName: e.target.value
                }))}
                options={PREP_SHEETS.map(sheet => ({
                    value: sheet,
                    label: sheet
                }))}
                required
            />

            <div className="flex space-x-4">
                <Button
                    type="submit"
                    className="flex-1"
                    isLoading={addPrepItem.status === 'pending'}
                >
                    Add Prep Item
                </Button>
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}