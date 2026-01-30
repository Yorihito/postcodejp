import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from './Button';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950',
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = 'Card';
