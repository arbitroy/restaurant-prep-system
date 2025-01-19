import { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: Array<{ value: string | number; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', label, error, options, ...props }, ref) => {
        return (
            <div className="space-y-1">
                {label && (
                    <label className="block text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    className={`
            block w-full rounded-md border border-gray-300 px-3 py-2 
            text-sm 
            focus:outline-none focus:ring-2 focus:ring-[#373d20] focus:border-transparent
            disabled:opacity-50 disabled:bg-gray-50
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';