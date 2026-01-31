import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'default';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            default: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 active:scale-[0.98]",
            secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700",
            ghost: "hover:bg-white/5 text-slate-400 hover:text-white",
            primary: "bg-white text-slate-900 shadow-md hover:bg-slate-50 font-medium",
            outline: "border-2 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300",
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-6 py-2.5 text-base',
            lg: 'px-8 py-3.5 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:pointer-events-none',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
