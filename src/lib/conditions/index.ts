/**
 * Condition Evaluation Engine
 * Safe parser for evaluating trading indicator conditions
 */

import { tokenize } from './lexer';
import { parse } from './parser';
import { evaluate } from './evaluator';
import type { IndicatorRecord, EvaluationResult } from './types';

// Re-export types and errors
export type {
    IndicatorRecord,
    IndicatorValue,
    MACDIndicatorValue,
    EvaluationResult,
    Token,
    ASTNode,
} from './types';

export {
    ConditionError,
    LexerError,
    ParserError,
    EvaluatorError,
} from './types';

/**
 * Evaluate a condition expression against indicator values
 * 
 * @param indicators - Record of indicator values
 * @param expression - Condition expression string
 * @returns Object containing conditionMet boolean
 * 
 * @example
 * ```typescript
 * const indicators = {
 *   RSI_14: 25,
 *   SMA_20: 150,
 *   SMA_50: 145,
 *   MACD: { line: 1.5, signal: 1.2, histogram: 0.3 }
 * };
 * 
 * evaluateCondition(indicators, "RSI_14 < 30");
 * // { conditionMet: true }
 * 
 * evaluateCondition(indicators, "SMA_20 > SMA_50 AND RSI_14 < 40");
 * // { conditionMet: true }
 * 
 * evaluateCondition(indicators, "MACD.line > MACD.signal");
 * // { conditionMet: true }
 * ```
 */
export function evaluateCondition(
    indicators: IndicatorRecord,
    expression: string
): EvaluationResult {
    // Tokenize the expression
    const tokens = tokenize(expression);

    // Parse tokens into AST
    const ast = parse(tokens);

    // Evaluate AST against indicators
    const conditionMet = evaluate(ast, indicators);

    return { conditionMet };
}
