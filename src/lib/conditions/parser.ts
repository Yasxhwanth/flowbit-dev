/**
 * Parser for Condition Expressions
 * Builds an AST from tokens using recursive descent parsing
 * 
 * Grammar:
 *   expression → or_expr
 *   or_expr    → and_expr ( "OR" and_expr )*
 *   and_expr   → comparison ( "AND" comparison )*
 *   comparison → primary ( OPERATOR primary )?
 *   primary    → IDENTIFIER | NUMBER | "(" expression ")"
 */

import {
    Token,
    TokenType,
    ASTNode,
    NodeType,
    ParserError,
} from './types';

/**
 * Parser class for building AST from tokens
 */
class Parser {
    private tokens: Token[];
    private position: number;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.position = 0;
    }

    /**
     * Parse tokens into an AST
     */
    parse(): ASTNode {
        const result = this.parseOrExpr();

        if (!this.isAtEnd()) {
            throw new ParserError(
                `Unexpected token: ${this.current().value}`,
                this.current().position
            );
        }

        return result;
    }

    /**
     * Parse OR expressions (lowest precedence)
     */
    private parseOrExpr(): ASTNode {
        let left = this.parseAndExpr();

        while (this.match(TokenType.LOGICAL, 'OR')) {
            const right = this.parseAndExpr();
            left = {
                type: NodeType.BINARY_EXPR,
                operator: 'OR',
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse AND expressions
     */
    private parseAndExpr(): ASTNode {
        let left = this.parseComparison();

        while (this.match(TokenType.LOGICAL, 'AND')) {
            const right = this.parseComparison();
            left = {
                type: NodeType.BINARY_EXPR,
                operator: 'AND',
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse comparison expressions
     */
    private parseComparison(): ASTNode {
        const left = this.parsePrimary();

        if (this.check(TokenType.OPERATOR)) {
            const operator = this.advance().value as '>' | '<' | '>=' | '<=' | '==' | '!=';
            const right = this.parsePrimary();

            return {
                type: NodeType.COMPARISON_EXPR,
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse primary expressions (identifiers, numbers, parentheses)
     */
    private parsePrimary(): ASTNode {
        // Number
        if (this.check(TokenType.NUMBER)) {
            const token = this.advance();
            return {
                type: NodeType.NUMBER,
                value: parseFloat(token.value),
            };
        }

        // Identifier
        if (this.check(TokenType.IDENTIFIER)) {
            const token = this.advance();
            return {
                type: NodeType.IDENTIFIER,
                name: token.value,
            };
        }

        // Parenthesized expression
        if (this.check(TokenType.LPAREN)) {
            this.advance(); // consume '('
            const expr = this.parseOrExpr();

            if (!this.check(TokenType.RPAREN)) {
                throw new ParserError('Expected closing parenthesis', this.current().position);
            }
            this.advance(); // consume ')'

            return expr;
        }

        throw new ParserError(
            `Unexpected token: ${this.current().value || 'EOF'}`,
            this.current().position
        );
    }

    // Helper methods

    private current(): Token {
        return this.tokens[this.position];
    }

    private isAtEnd(): boolean {
        return this.current().type === TokenType.EOF;
    }

    private check(type: TokenType): boolean {
        return !this.isAtEnd() && this.current().type === type;
    }

    private match(type: TokenType, value?: string): boolean {
        if (this.check(type)) {
            if (value === undefined || this.current().value === value) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private advance(): Token {
        if (!this.isAtEnd()) {
            this.position++;
        }
        return this.tokens[this.position - 1];
    }
}

/**
 * Parse an expression string into an AST
 * @param tokens - Array of tokens from the lexer
 * @returns AST root node
 */
export function parse(tokens: Token[]): ASTNode {
    const parser = new Parser(tokens);
    return parser.parse();
}
