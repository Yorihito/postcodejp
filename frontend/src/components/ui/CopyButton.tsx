import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';
import { cn } from './Button';

interface CopyButtonProps {
    text: string;
    className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent form submission if inside a form, though type="button" handles most cases
        e.stopPropagation(); // Stop propagation to prevent triggering parent click events (e.g. card selection)

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={cn("h-8 w-8 p-0 hover:bg-slate-800/50", className)}
            title={copied ? "Copied!" : "Copy"}
        >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy</span>
        </Button>
    );
}
