'use client';

/**
 * NodeBase - Base component for custom workflow nodes
 */

import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface NodeBaseProps {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    color: 'indigo' | 'blue' | 'amber' | 'red' | 'green';
    selected?: boolean;
    status?: 'valid' | 'warning' | 'error';
    children?: React.ReactNode;
}

const colorClasses = {
    indigo: {
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/30',
        iconBg: 'bg-indigo-500/20',
        iconText: 'text-indigo-500',
        glow: 'ring-indigo-500/50',
    },
    blue: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        iconBg: 'bg-blue-500/20',
        iconText: 'text-blue-500',
        glow: 'ring-blue-500/50',
    },
    amber: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        iconBg: 'bg-amber-500/20',
        iconText: 'text-amber-500',
        glow: 'ring-amber-500/50',
    },
    red: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        iconBg: 'bg-red-500/20',
        iconText: 'text-red-500',
        glow: 'ring-red-500/50',
    },
    green: {
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        iconBg: 'bg-green-500/20',
        iconText: 'text-green-500',
        glow: 'ring-green-500/50',
    },
};

const statusColors = {
    valid: 'bg-green-500',
    warning: 'bg-orange-500',
    error: 'bg-red-500',
};

export function NodeBase({
    title,
    subtitle,
    icon,
    color,
    selected,
    status,
    children,
}: NodeBaseProps) {
    const colors = colorClasses[color];

    return (
        <div
            className={cn(
                'relative min-w-[180px] rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-sm',
                'transition-all duration-200 ease-in-out',
                'hover:shadow-md hover:scale-[1.02]',
                colors.border,
                selected && `ring-2 ${colors.glow} shadow-lg`
            )}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background"
            />

            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center',
                        colors.iconBg,
                        colors.iconText
                    )}
                >
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{title}</h3>
                        {status && (
                            <div className={cn('w-2 h-2 rounded-full', statusColors[status])} />
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                    )}
                </div>
            </div>

            {/* Body */}
            {children && (
                <div className="mt-3 pt-3 border-t border-border/50">{children}</div>
            )}

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background"
            />
        </div>
    );
}
