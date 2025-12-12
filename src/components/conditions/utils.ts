/**
 * Expression Generator Utils
 */

import type { ConditionRowData, ConditionGroupData, Operand } from './types';
import { isConditionGroup } from './types';

/**
 * Convert operand to string
 */
function operandToString(operand: Operand): string {
    if (operand.type === 'number') {
        return String(operand.value);
    }
    return String(operand.value);
}

/**
 * Generate expression from a single row
 */
function rowToExpression(row: ConditionRowData): string {
    const left = operandToString(row.left);
    const right = operandToString(row.right);

    switch (row.operator) {
        case 'CROSS_ABOVE':
            return `CROSS(${left}, ${right}) == 1`;
        case 'CROSS_BELOW':
            return `CROSS(${left}, ${right}) == -1`;
        default:
            return `${left} ${row.operator} ${right}`;
    }
}

/**
 * Generate expression from a group
 */
function groupToExpression(group: ConditionGroupData): string {
    if (group.children.length === 0) {
        return 'true';
    }

    const parts: string[] = [];

    for (const child of group.children) {
        if (isConditionGroup(child)) {
            parts.push(`(${groupToExpression(child)})`);
        } else {
            parts.push(rowToExpression(child));
        }
    }

    return parts.join(` ${group.type} `);
}

/**
 * Generate expression string from condition tree
 */
export function generateExpression(group: ConditionGroupData): string {
    const expr = groupToExpression(group);
    return expr;
}

/**
 * Parse simple expression back to structured format (basic support)
 */
export function parseExpression(expression: string): ConditionGroupData | null {
    // Basic parsing - for complex expressions, use the structured data
    if (!expression || expression.trim() === '') {
        return null;
    }

    // Try to parse simple expressions like "sma_20 > sma_50"
    const simpleMatch = expression.match(/^(\w+(?:\.\w+)?)\s*(>|<|>=|<=|==|!=)\s*(\w+(?:\.\w+)?|\d+(?:\.\d+)?)$/);

    if (simpleMatch) {
        const [, left, op, right] = simpleMatch;
        const isRightNumber = /^\d+(?:\.\d+)?$/.test(right);

        return {
            id: 'root',
            type: 'AND',
            children: [
                {
                    id: 'row_1',
                    left: { type: 'indicator', value: left },
                    operator: op as ConditionRowData['operator'],
                    right: isRightNumber
                        ? { type: 'number', value: parseFloat(right) }
                        : { type: 'indicator', value: right },
                },
            ],
        };
    }

    return null;
}
