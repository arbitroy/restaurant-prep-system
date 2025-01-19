import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="block text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            block w-full rounded-md border border-gray-300 px-3 py-2 
            text-sm placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-[#373d20] focus:border-transparent
            disabled:opacity-50 disabled:bg-gray-50
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';