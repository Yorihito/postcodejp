import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from './Button';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    'flex h-12 w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 text-base transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-400 dark:focus:bg-slate-950 dark:focus:ring-blue-400/20',
                    className
                )}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
