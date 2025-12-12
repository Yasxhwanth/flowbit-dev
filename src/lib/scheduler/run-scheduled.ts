/**
 * Scheduled Workflow Runner
 * Runs all active workflows on a cron schedule
 */

import prisma from '@/lib/db';
import type { ScheduledResult, WorkflowRunResult } from './types';
import { executeWorkflow, type WorkflowGraph, type WorkflowNode, type ExecutionLog } from '../workflow';
import type { NodeType as WorkflowNodeType } from '../workflow/types';

/**
 * Map Prisma NodeType to workflow executor NodeType
 * Falls back to null for unsupported types
 */
function mapNodeType(prismaType: string): WorkflowNodeType | null {
    const typeMap: Record<string, WorkflowNodeType> = {
        // Add mappings as trading node types are added to Prisma schema
        // For now, return null for existing types (they use the Inngest executor)
    };

    return typeMap[prismaType] ?? null;
}

/**
 * Convert Prisma workflow to WorkflowGraph format
 */
function convertToWorkflowGraph(
    workflow: {
        userId: string;
        nodes: Array<{ id: string; type: string; data: unknown }>;
        connections: Array<{ fromNodeId: string; toNodeId: string }>;
    }
): WorkflowGraph | null {
    // Convert nodes - skip if any unsupported types
    const nodes: WorkflowNode[] = [];

    for (const node of workflow.nodes) {
        const mappedType = mapNodeType(node.type);

        if (!mappedType) {
            // Unsupported node type - skip this workflow
            return null;
        }

        nodes.push({
            id: node.id,
            type: mappedType,
            data: (node.data as Record<string, unknown>) ?? {},
        });
    }

    // Convert edges
    const edges = workflow.connections.map((conn) => ({
        source: conn.fromNodeId,
        target: conn.toNodeId,
    }));

    return { userId: workflow.userId, nodes, edges };
}

/**
 * Run all active workflows
 * 
 * @returns Summary of scheduled run
 * 
 * @example
 * ```typescript
 * const result = await runScheduled();
 * // { total: 5, success: 4, failed: 1, skipped: 0, results: [...] }
 * ```
 */
export async function runScheduled(): Promise<ScheduledResult> {
    const startTime = performance.now();
    const results: WorkflowRunResult[] = [];
    let success = 0;
    let failed = 0;
    let skipped = 0;

    try {
        // Load all workflows with their nodes and connections
        const workflows = await prisma.workflow.findMany({
            include: {
                nodes: true,
                connections: true,
            },
        });

        for (const workflow of workflows) {
            const workflowStartTime = performance.now();

            try {
                // Skip workflows with no nodes
                if (!workflow.nodes || workflow.nodes.length === 0) {
                    skipped++;
                    results.push({
                        workflowId: workflow.id,
                        workflowName: workflow.name,
                        ok: false,
                        logs: [],
                        error: 'Workflow has no nodes',
                        durationMs: performance.now() - workflowStartTime,
                    });
                    continue;
                }

                // Convert to WorkflowGraph format
                const graph = convertToWorkflowGraph(workflow);

                if (!graph) {
                    // Workflow uses unsupported node types (e.g., Inngest-based)
                    skipped++;
                    results.push({
                        workflowId: workflow.id,
                        workflowName: workflow.name,
                        ok: false,
                        logs: [],
                        error: 'Workflow uses unsupported node types for scheduled execution',
                        durationMs: performance.now() - workflowStartTime,
                    });
                    continue;
                }

                // Log workflow execution with userId for audit
                console.log(`[Scheduler] Executing workflow: ${workflow.id}, userId: ${workflow.userId}, name: ${workflow.name}`);

                // Execute the workflow
                const result = await executeWorkflow(graph);

                if (result.success) {
                    success++;
                    results.push({
                        workflowId: workflow.id,
                        workflowName: workflow.name,
                        ok: true,
                        logs: result.logs,
                        durationMs: result.totalDurationMs,
                    });
                } else {
                    failed++;
                    const lastError = result.logs.find((log) => log.error)?.error;
                    results.push({
                        workflowId: workflow.id,
                        workflowName: workflow.name,
                        ok: false,
                        logs: result.logs,
                        error: lastError ?? 'Unknown execution error',
                        durationMs: result.totalDurationMs,
                    });
                }
            } catch (error) {
                failed++;
                results.push({
                    workflowId: workflow.id,
                    workflowName: workflow.name,
                    ok: false,
                    logs: [],
                    error: error instanceof Error ? error.message : 'Unknown error',
                    durationMs: performance.now() - workflowStartTime,
                });
            }
        }

        return {
            total: workflows.length,
            success,
            failed,
            skipped,
            results,
            timestamp: new Date().toISOString(),
            totalDurationMs: performance.now() - startTime,
        };
    } catch (error) {
        // Database error or other critical failure
        return {
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0,
            results: [{
                workflowId: 'unknown',
                workflowName: 'unknown',
                ok: false,
                logs: [],
                error: `Failed to load workflows: ${error instanceof Error ? error.message : 'Unknown error'}`,
                durationMs: performance.now() - startTime,
            }],
            timestamp: new Date().toISOString(),
            totalDurationMs: performance.now() - startTime,
        };
    }
}
