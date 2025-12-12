/**
 * Evaluator for Condition Expressions
 * Evaluates AST nodes against indicator values
 */

import {
    ASTNode,
    NodeType,
    IndicatorRecord,
    EvaluatorError,
} from './types';

/**
 * Resolve an identifier to its numeric value from the indicators record
 * Supports nested keys like "MACD.line"
 */
function resolveIdentifier(name: string, indicators: IndicatorRecord): number {
    const parts = name.split('.');

    // Simple key (e.g., "RSI_14")
    if (parts.length === 1) {
        const value = indicators[name];

        if (value === undefined) {
            throw new EvaluatorError(`Unknown indicator: ${name}`);
        }

        if (typeof value === 'number') {
            return value;
        }

        throw new EvaluatorError(
            `Indicator ${name} is an object, use dot notation (e.g., ${name}.line)`
        );
    }

    // Nested key (e.g., "MACD.line")
    const [key, property] = parts;
    const value = indicators[key];

    if (value === undefined) {
        throw new EvaluatorError(`Unknown indicator: ${key}`);
    }

    if (typeof value === 'number') {
        throw new EvaluatorError(`Indicator ${key} is a number, not an object`);
    }

    const nested = value[property as keyof typeof value];

    if (nested === undefined) {
        throw new EvaluatorError(`Unknown property: ${property} on ${key}`);
    }

    return nested;
}

/**
 * Evaluate an AST node and return its numeric value (for operands)
 */
function evaluateValue(node: ASTNode, indicators: IndicatorRecord): number {
    switch (node.type) {
        case NodeType.NUMBER:
            return node.value;

        case NodeType.IDENTIFIER:
            return resolveIdentifier(node.name, indicators);

        default:
            throw new EvaluatorError(`Cannot evaluate node type as value: ${node.type}`);
    }
}

/**
 * Apply a comparison operator to two values
 */
function applyComparison(
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=',
    left: number,
    right: number
): boolean {
    switch (operator) {
        case '>':
            return left > right;
        case '<':
            return left < right;
        case '>=':
            return left >= right;
        case '<=':
            return left <= right;
        case '==':
            return left === right;
        case '!=':
            return left !== right;
        default:
            throw new EvaluatorError(`Unknown operator: ${operator}`);
    }
}

/**
 * Evaluate an AST node and return a boolean result
 */
function evaluateNode(node: ASTNode, indicators: IndicatorRecord): boolean {
    switch (node.type) {
        case NodeType.BINARY_EXPR: {
            const left = evaluateNode(node.left, indicators);
            const right = evaluateNode(node.right, indicators);

            if (node.operator === 'AND') {
                return left && right;
            } else {
                return left || right;
            }
        }

        case NodeType.COMPARISON_EXPR: {
            const left = evaluateValue(node.left, indicators);
            const right = evaluateValue(node.right, indicators);
            return applyComparison(node.operator, left, right);
        }

        case NodeType.IDENTIFIER:
        case NodeType.NUMBER:
            // Standalone values are truthy if non-zero
            return evaluateValue(node, indicators) !== 0;

        default:
            throw new EvaluatorError(`Unknown node type: ${(node as ASTNode).type}`);
    }
}

/**
 * Evaluate an AST against indicator values
 * @param ast - The AST root node
 * @param indicators - Record of indicator values
 * @returns Boolean result of the evaluation
 */
export function evaluate(ast: ASTNode, indicators: IndicatorRecord): boolean {
    return evaluateNode(ast, indicators);
}
