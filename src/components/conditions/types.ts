/**
 * Condition Builder Types
 */

export type OperandType = 'indicator' | 'number' | 'price';

export interface Operand {
    type: OperandType;
    value: string | number;
}

export type Operator = '>' | '<' | '>=' | '<=' | '==' | '!=' | 'CROSS_ABOVE' | 'CROSS_BELOW';

export interface ConditionRowData {
    id: string;
    left: Operand;
    operator: Operator;
    right: Operand;
}

export type GroupType = 'AND' | 'OR';

export interface ConditionGroupData {
    id: string;
    type: GroupType;
    children: Array<ConditionRowData | ConditionGroupData>;
}

export function isConditionGroup(item: ConditionRowData | ConditionGroupData): item is ConditionGroupData {
    return 'children' in item;
}

export function createEmptyRow(id?: string): ConditionRowData {
    return {
        id: id || `row_${Date.now()}`,
        left: { type: 'indicator', value: '' },
        operator: '>',
        right: { type: 'number', value: 0 },
    };
}

export function createEmptyGroup(type: GroupType = 'AND', id?: string): ConditionGroupData {
    return {
        id: id || `group_${Date.now()}`,
        type,
        children: [createEmptyRow()],
    };
}
