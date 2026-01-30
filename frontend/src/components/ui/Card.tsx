import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from './Button';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-xl border border-white/20 bg-white/70 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 dark:text-white dark:shadow-2xl',
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = 'Card';
