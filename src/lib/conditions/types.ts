/**
 * Condition Evaluation Engine Types
 * Types for tokenizer, parser, and evaluator
 */

// ============================================================================
// Token Types
// ============================================================================

export enum TokenType {
    IDENTIFIER = 'IDENTIFIER',
    NUMBER = 'NUMBER',
    OPERATOR = 'OPERATOR',
    LOGICAL = 'LOGICAL',
    LPAREN = 'LPAREN',
    RPAREN = 'RPAREN',
    EOF = 'EOF',
}

export interface Token {
    type: TokenType;
    value: string;
    position: number;
}

// ============================================================================
// AST Node Types
// ============================================================================

export enum NodeType {
    BINARY_EXPR = 'BINARY_EXPR',
    COMPARISON_EXPR = 'COMPARISON_EXPR',
    IDENTIFIER = 'IDENTIFIER',
    NUMBER = 'NUMBER',
}

export interface BinaryExprNode {
    type: NodeType.BINARY_EXPR;
    operator: 'AND' | 'OR';
    left: ASTNode;
    right: ASTNode;
}

export interface ComparisonExprNode {
    type: NodeType.COMPARISON_EXPR;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    left: ASTNode;
    right: ASTNode;
}

export interface IdentifierNode {
    type: NodeType.IDENTIFIER;
    name: string;
}

export interface NumberNode {
    type: NodeType.NUMBER;
    value: number;
}

export type ASTNode = BinaryExprNode | ComparisonExprNode | IdentifierNode | NumberNode;

// ============================================================================
// Indicator Types
// ============================================================================

export interface MACDIndicatorValue {
    line: number;
    signal: number;
    histogram: number;
}

export type IndicatorValue = number | MACDIndicatorValue;
export type IndicatorRecord = Record<string, IndicatorValue>;

// ============================================================================
// Result Types
// ============================================================================

export interface EvaluationResult {
    conditionMet: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export class ConditionError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly position?: number
    ) {
        super(message);
        this.name = 'ConditionError';
    }
}

export class LexerError extends ConditionError {
    constructor(message: string, position: number) {
        super(message, 'LEXER_ERROR', position);
        this.name = 'LexerError';
    }
}

export class ParserError extends ConditionError {
    constructor(message: string, position?: number) {
        super(message, 'PARSER_ERROR', position);
        this.name = 'ParserError';
    }
}

export class EvaluatorError extends ConditionError {
    constructor(message: string) {
        super(message, 'EVALUATOR_ERROR');
        this.name = 'EvaluatorError';
    }
}
