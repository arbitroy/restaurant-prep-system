import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast/ToastContext';

const CATEGORIES = [
    'Appetizers',
    'Mains',
    'Sides',
    'Desserts',
    'Beverages',
    'Specials'
];

interface MenuItemFormProps {
    restaurantId: number;
    onSubmit: () => void;
    onCancel: () => void;
    initialData?: {
        id?: number;
        name: string;
        category: string;
    };
}

export function MenuItemForm({ 
    restaurantId, 
    onSubmit, 
    onCancel, 
    initialData 
}: MenuItemFormProps) {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        category: initialData?.category || CATEGORIES[0]
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/items/menu', {
                method: initialData?.id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    id: initialData?.id,
                    restaurantId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save menu item');
            }

            showToast(
                `Menu item ${initialData?.id ? 'updated' : 'added'} successfully`, 
                'success'
            );
            onSubmit();
        } catch (error) {
            showToast('Failed to save menu item', 'error');
        } finally {
            setIsLoading(false);
        }
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
                required
            />
            <Select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({
                    ...prev,
                    category: e.target.value
                }))}
                options={CATEGORIES.map(cat => ({
                    value: cat,
                    label: cat
                }))}
                required
            />
            <div className="flex space-x-4">
                <Button
                    type="submit"
                    isLoading={isLoading}
                    className="flex-1"
                >
                    {initialData?.id ? 'Update' : 'Add'} Item
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}