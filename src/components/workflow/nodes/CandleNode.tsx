'use client';

/**
 * CandleNode - Custom node for candle data
 */

import { CandlestickChart } from 'lucide-react';
import { NodeBase } from './NodeBase';
import { getCandlePreview } from '@/lib/workflow/node-preview';

interface CandleNodeData {
    symbol?: string;
    interval?: string;
    broker?: string;
}

interface CandleNodeProps {
    data: CandleNodeData;
    selected?: boolean;
}

export function CandleNode({ data, selected }: CandleNodeProps) {
    const hasRequired = data.symbol && data.broker;
    const preview = getCandlePreview(data);

    return (
        <NodeBase
            title="Candles"
            subtitle={`${data.symbol || 'No symbol'} · ${data.interval || '1d'}`}
            icon={<CandlestickChart size={18} />}
            color="indigo"
            selected={selected}
            status={hasRequired ? 'valid' : 'warning'}
        >
            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {preview}
            </div>
        </NodeBase>
    );
}
