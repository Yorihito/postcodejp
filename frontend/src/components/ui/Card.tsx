import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from './Button';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl",
                    "dark:bg-slate-900/50 dark:border-white/5",
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = 'Card';
