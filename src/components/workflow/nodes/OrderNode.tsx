'use client';

/**
 * OrderNode - Custom node for orders
 */

import { ArrowUpDown } from 'lucide-react';
import { NodeBase } from './NodeBase';
import { getOrderPreview } from '@/lib/workflow/node-preview';

interface OrderNodeData {
    side?: 'BUY' | 'SELL';
    quantity?: number;
    orderType?: string;
    price?: number;
    dryRun?: boolean;
}

interface OrderNodeProps {
    data: OrderNodeData;
    selected?: boolean;
}

export function OrderNode({ data, selected }: OrderNodeProps) {
    const side = data.side || 'BUY';
    const quantity = data.quantity || 1;
    const orderType = data.orderType || 'MARKET';
    const isDryRun = data.dryRun ?? true;
    const preview = getOrderPreview(data);

    return (
        <NodeBase
            title={`${side} Order`}
            subtitle={`${quantity} qty · ${orderType}`}
            icon={<ArrowUpDown size={18} />}
            color="red"
            selected={selected}
            status="valid"
        >
            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {preview}
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">Mode:</span>
                <span className={isDryRun ? 'text-orange-500' : 'text-green-500'}>
                    {isDryRun ? 'Paper' : 'Live'}
                </span>
            </div>
        </NodeBase>
    );
}
