'use client';

/**
 * IndicatorNode - Custom node for indicators
 */

import { Activity } from 'lucide-react';
import { NodeBase } from './NodeBase';
import { getIndicatorPreview } from '@/lib/workflow/node-preview';

interface IndicatorConfig {
    type: string;
    period?: number;
}

interface IndicatorNodeData {
    indicators?: IndicatorConfig[];
}

interface IndicatorNodeProps {
    data: IndicatorNodeData;
    selected?: boolean;
}

export function IndicatorNode({ data, selected }: IndicatorNodeProps) {
    const indicators = data.indicators || [];
    const count = indicators.length;
    const preview = getIndicatorPreview(data);

    return (
        <NodeBase
            title="Indicators"
            subtitle={count > 0 ? `${count} indicator${count > 1 ? 's' : ''}` : 'No indicators'}
            icon={<Activity size={18} />}
            color="blue"
            selected={selected}
            status={count > 0 ? 'valid' : 'warning'}
        >
            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {preview}
            </div>
        </NodeBase>
    );
}
