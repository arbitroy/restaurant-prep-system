import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';

interface RestaurantFormProps {
    onSubmit: () => void;
    onCancel: () => void;
    initialData?: {
        id?: number;
        name: string;
    };
}

export function RestaurantForm({ onSubmit, onCancel, initialData }: RestaurantFormProps) {
    const { showToast } = useToast();
    const [name, setName] = useState(initialData?.name || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/restaurants', {
                method: initialData?.id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: initialData?.id,
                    name,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save restaurant');
            }

            showToast(
                `Restaurant ${initialData?.id ? 'updated' : 'created'} successfully`, 
                'success'
            );
            onSubmit();
        } catch {
            showToast('Failed to save restaurant', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Restaurant Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter restaurant name"
            />
            <div className="flex space-x-4">
                <Button
                    type="submit"
                    isLoading={isLoading}
                    className="flex-1"
                >
                    {initialData?.id ? 'Update' : 'Create'} Restaurant
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