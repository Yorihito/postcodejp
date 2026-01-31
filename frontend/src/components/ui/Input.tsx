import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from './Button';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl",
                    "text-white placeholder:text-slate-500 font-medium",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    className
                )}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
