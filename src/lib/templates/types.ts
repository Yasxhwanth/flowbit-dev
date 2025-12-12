/**
 * Strategy Template Types
 */

import type { WorkflowGraph } from '../workflow/types';

/**
 * Parameter definition for a template
 */
export interface TemplateParameter {
    /** Parameter key */
    key: string;
    /** Display label */
    label: string;
    /** Parameter type */
    type: 'number' | 'string' | 'select';
    /** Default value */
    defaultValue: number | string;
    /** Min value (for numbers) */
    min?: number;
    /** Max value (for numbers) */
    max?: number;
    /** Options (for select type) */
    options?: Array<{ value: string | number; label: string }>;
}

/**
 * Strategy template definition
 */
export interface StrategyTemplate {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Brief description */
    description: string;
    /** Category/tag */
    category: 'trend' | 'momentum' | 'volatility' | 'breakout';
    /** Parameter definitions */
    parameters: TemplateParameter[];
    /** Build workflow from parameters */
    buildWorkflow: (params: Record<string, number | string>) => WorkflowGraph;
}

/**
 * Template list response
 */
export interface TemplateListItem {
    id: string;
    name: string;
    description: string;
    category: string;
    parameters: TemplateParameter[];
}
