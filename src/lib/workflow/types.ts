/**
 * Workflow Executor Types
 * Type definitions for DAG-based workflow execution
 */

// ============================================================================
// Node Types
// ============================================================================

/**
 * Supported workflow node types
 */
export type NodeType = 'candles' | 'indicators' | 'condition' | 'order' | 'notify';

/**
 * Workflow node definition
 */
export interface WorkflowNode {
    /** Unique node identifier */
    id: string;
    /** Node type determines which action to execute */
    type: NodeType;
    /** Node-specific configuration data */
    data: Record<string, unknown>;
}

/**
 * Edge connecting two nodes (directed)
 */
export interface WorkflowEdge {
    /** Source node ID (upstream) */
    source: string;
    /** Target node ID (downstream) */
    target: string;
}

/**
 * Complete workflow graph definition
 */
export interface WorkflowGraph {
    /** User ID for credential lookup */
    userId?: string;
    /** All nodes in the workflow */
    nodes: WorkflowNode[];
    /** Edges defining data flow */
    edges: WorkflowEdge[];
}

// ============================================================================
// Execution Types
// ============================================================================

/**
 * Log entry for a single node execution
 */
export interface ExecutionLog {
    /** Node that was executed */
    nodeId: string;
    /** Type of node */
    type: NodeType;
    /** Input data passed to the node */
    input: unknown;
    /** Output produced by the node */
    output: unknown;
    /** Execution duration in milliseconds */
    durationMs: number;
    /** Error if execution failed */
    error?: string;
}

/**
 * Final workflow execution result
 */
export interface WorkflowResult {
    /** Execution logs for all nodes */
    logs: ExecutionLog[];
    /** Output from the final node(s) */
    finalOutput: unknown;
    /** Whether the entire workflow succeeded */
    success: boolean;
    /** Total execution time in milliseconds */
    totalDurationMs: number;
}

/**
 * Context map storing node outputs during execution
 */
export type ExecutionContext = Map<string, unknown>;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base workflow error
 */
export class WorkflowError extends Error {
    constructor(
        message: string,
        public readonly code: string
    ) {
        super(message);
        this.name = 'WorkflowError';
    }
}

/**
 * Error when graph validation fails
 */
export class GraphValidationError extends WorkflowError {
    constructor(message: string) {
        super(message, 'GRAPH_VALIDATION_ERROR');
        this.name = 'GraphValidationError';
    }
}

/**
 * Error when a cycle is detected in the graph
 */
export class CycleDetectedError extends WorkflowError {
    constructor(public readonly cycle?: string[]) {
        super(
            `Cycle detected in workflow graph${cycle ? `: ${cycle.join(' -> ')}` : ''}`,
            'CYCLE_DETECTED'
        );
        this.name = 'CycleDetectedError';
    }
}

/**
 * Error when node execution fails
 */
export class NodeExecutionError extends WorkflowError {
    constructor(
        public readonly nodeId: string,
        public readonly nodeType: NodeType,
        public readonly originalError: Error
    ) {
        super(
            `Node ${nodeId} (${nodeType}) failed: ${originalError.message}`,
            'NODE_EXECUTION_ERROR'
        );
        this.name = 'NodeExecutionError';
    }
}
