import { motion } from 'framer-motion';
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

        const variants = {
            primary: 'bg-[#373d20] text-white hover:bg-[#717744]',
            secondary: 'bg-[#717744] text-white hover:bg-[#abac7f]',
            outline: 'border border-[#373d20] text-[#373d20] hover:bg-[#373d20] hover:text-white'
        };

        const sizes = {
            sm: 'h-9 px-3 text-sm',
            md: 'h-10 py-2 px-4',
            lg: 'h-11 px-8'
        };

        return (
            <motion.button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                whileTap={{ scale: 0.95 }}
                {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
            >
                {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : null}
                {children}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
