'use client';

/**
 * Custom Workflow Nodes
 */

export { NodeBase } from './NodeBase';
export { CandleNode } from './CandleNode';
export { IndicatorNode } from './IndicatorNode';
export { ConditionNode } from './ConditionNode';
export { OrderNode } from './OrderNode';
export { NotifyNode } from './NotifyNode';

import { CandleNode } from './CandleNode';
import { IndicatorNode } from './IndicatorNode';
import { ConditionNode } from './ConditionNode';
import { OrderNode } from './OrderNode';
import { NotifyNode } from './NotifyNode';

// Node types mapping for React Flow
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nodeTypes: Record<string, React.ComponentType<any>> = {
    candles: CandleNode,
    indicators: IndicatorNode,
    condition: ConditionNode,
    order: OrderNode,
    notify: NotifyNode,
};
