/**
 * Operator Options for Condition Builder
 */

import type { Operator } from './types';

export interface OperatorOption {
    label: string;
    value: Operator;
}

export const operatorOptions: OperatorOption[] = [
    { label: '>', value: '>' },
    { label: '<', value: '<' },
    { label: '>=', value: '>=' },
    { label: '<=', value: '<=' },
    { label: '==', value: '==' },
    { label: '!=', value: '!=' },
    { label: 'crosses above', value: 'CROSS_ABOVE' },
    { label: 'crosses below', value: 'CROSS_BELOW' },
];

export function getOperatorLabel(op: Operator): string {
    const found = operatorOptions.find((o) => o.value === op);
    return found?.label || op;
}
