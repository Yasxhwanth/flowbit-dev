'use client';

/**
 * ConditionNode - Custom node for conditions
 */

import { GitCompare } from 'lucide-react';
import { NodeBase } from './NodeBase';
import { getConditionPreview } from '@/lib/workflow/node-preview';

interface ConditionNodeData {
    expression?: string;
    tree?: unknown;
}

interface ConditionNodeProps {
    data: ConditionNodeData;
    selected?: boolean;
}

function simplifyExpression(expr: string): string {
    if (!expr) return 'No condition';

    let simplified = expr
        .replace(/_(\d+)/g, '$1')
        .replace(/\./g, ' ')
        .toUpperCase();

    if (simplified.length > 30) {
        simplified = simplified.slice(0, 27) + '...';
    }

    return simplified;
}

export function ConditionNode({ data, selected }: ConditionNodeProps) {
    const hasExpression = !!data.expression;
    const simplified = simplifyExpression(data.expression || '');
    const preview = getConditionPreview(data);

    return (
        <NodeBase
            title="Condition"
            subtitle={simplified}
            icon={<GitCompare size={18} />}
            color="amber"
            selected={selected}
            status={hasExpression ? 'valid' : 'warning'}
        >
            <div className="text-xs font-mono bg-muted/50 rounded p-1.5 line-clamp-2 mt-1">
                {preview}
            </div>
        </NodeBase>
    );
}
