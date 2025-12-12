/**
 * Strategy Templates Index
 */

import { smaCrossoverTemplate } from './presets/sma-crossover';
import { rsiTemplate } from './presets/rsi';
import { macdTemplate } from './presets/macd';
import { breakoutTemplate, nr7BreakoutTemplate } from './presets/breakout';
import type { StrategyTemplate, TemplateListItem } from './types';

// All available templates
export const templates: StrategyTemplate[] = [
    smaCrossoverTemplate,
    rsiTemplate,
    macdTemplate,
    breakoutTemplate,
    nr7BreakoutTemplate,
];

// Get template by ID
export function getTemplateById(id: string): StrategyTemplate | undefined {
    return templates.find((t) => t.id === id);
}

// Get template list (without buildWorkflow function)
export function getTemplateList(): TemplateListItem[] {
    return templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        parameters: t.parameters,
    }));
}

// Re-export types
export type { StrategyTemplate, TemplateParameter, TemplateListItem } from './types';
