'use client';

/**
 * JsonViewer Component
 * Collapsible JSON viewer with copy functionality
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JsonViewerProps {
    data: unknown;
    title?: string;
    defaultExpanded?: boolean;
    maxHeight?: number;
}

export function JsonViewer({
    data,
    title,
    defaultExpanded = false,
    maxHeight = 300,
}: JsonViewerProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [copied, setCopied] = useState(false);

    const jsonString = JSON.stringify(data, null, 2);
    const isLarge = jsonString.length > 1000;

    async function handleCopy() {
        await navigator.clipboard.writeText(jsonString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (data === null || data === undefined) {
        return (
            <div className="text-sm text-muted-foreground italic">
                No data
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <div
                className="flex items-center justify-between px-3 py-2 bg-muted/50 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{title || 'JSON Data'}</span>
                    {isLarge && (
                        <span className="text-xs text-muted-foreground">
                            ({(jsonString.length / 1024).toFixed(1)} KB)
                        </span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCopy();
                    }}
                >
                    {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                    ) : (
                        <Copy className="h-3 w-3" />
                    )}
                </Button>
            </div>

            {expanded && (
                <div
                    className="overflow-auto bg-muted/20 p-3"
                    style={{ maxHeight }}
                >
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                        {jsonString}
                    </pre>
                </div>
            )}
        </div>
    );
}
