/**
 * Lexer/Tokenizer for Condition Expressions
 * Converts expression string into tokens
 */

import { Token, TokenType, LexerError } from './types';

/**
 * Tokenize an expression string into an array of tokens
 * @param expression - The expression to tokenize
 * @returns Array of tokens
 */
export function tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;

    while (position < expression.length) {
        const char = expression[position];

        // Skip whitespace
        if (/\s/.test(char)) {
            position++;
            continue;
        }

        // Number (including decimals and negative numbers)
        if (/[0-9]/.test(char) || (char === '-' && /[0-9]/.test(expression[position + 1] ?? ''))) {
            const start = position;
            if (char === '-') position++;

            while (position < expression.length && /[0-9.]/.test(expression[position])) {
                position++;
            }

            const value = expression.slice(start, position);
            tokens.push({ type: TokenType.NUMBER, value, position: start });
            continue;
        }

        // Identifier (letters, numbers, underscores, dots)
        if (/[a-zA-Z_]/.test(char)) {
            const start = position;

            while (position < expression.length && /[a-zA-Z0-9_.]/.test(expression[position])) {
                position++;
            }

            const value = expression.slice(start, position);

            // Check if it's a logical operator
            if (value === 'AND' || value === 'OR') {
                tokens.push({ type: TokenType.LOGICAL, value, position: start });
            } else {
                tokens.push({ type: TokenType.IDENTIFIER, value, position: start });
            }
            continue;
        }

        // Multi-character operators
        if (position + 1 < expression.length) {
            const twoChar = expression.slice(position, position + 2);
            if (['>=', '<=', '==', '!='].includes(twoChar)) {
                tokens.push({ type: TokenType.OPERATOR, value: twoChar, position });
                position += 2;
                continue;
            }
        }

        // Single-character operators
        if (['>', '<'].includes(char)) {
            tokens.push({ type: TokenType.OPERATOR, value: char, position });
            position++;
            continue;
        }

        // Parentheses
        if (char === '(') {
            tokens.push({ type: TokenType.LPAREN, value: char, position });
            position++;
            continue;
        }

        if (char === ')') {
            tokens.push({ type: TokenType.RPAREN, value: char, position });
            position++;
            continue;
        }

        // Unknown character
        throw new LexerError(`Unexpected character: ${char}`, position);
    }

    // Add EOF token
    tokens.push({ type: TokenType.EOF, value: '', position });

    return tokens;
}
