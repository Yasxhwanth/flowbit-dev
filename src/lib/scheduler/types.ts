/**
 * Scheduler Types
 * Type definitions for scheduled workflow execution
 */

import type { ExecutionLog } from '../workflow/types';

/**
 * Result of a single workflow run
 */
export interface WorkflowRunResult {
    /** Workflow ID */
    workflowId: string;
    /** Workflow name */
    workflowName: string;
    /** Whether execution succeeded */
    ok: boolean;
    /** Execution logs */
    logs: ExecutionLog[];
    /** Error message if failed */
    error?: string;
    /** Duration in milliseconds */
    durationMs: number;
}

/**
 * Summary of scheduled run
 */
export interface ScheduledResult {
    /** Total workflows processed */
    total: number;
    /** Number of successful runs */
    success: number;
    /** Number of failed runs */
    failed: number;
    /** Number of skipped (inactive or invalid) */
    skipped: number;
    /** Individual workflow results */
    results: WorkflowRunResult[];
    /** Timestamp of run */
    timestamp: string;
    /** Total duration in milliseconds */
    totalDurationMs: number;
}

/**
 * Error when scheduler fails
 */
export class SchedulerError extends Error {
    constructor(
        message: string,
        public readonly code: string
    ) {
        super(message);
        this.name = 'SchedulerError';
    }
}
