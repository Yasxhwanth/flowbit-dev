/**
 * Graph Utilities for Workflow Execution
 * DAG validation, topological sorting, and helper functions
 */

import {
    type WorkflowNode,
    type WorkflowEdge,
    GraphValidationError,
    CycleDetectedError,
} from './types';

/**
 * Validate the workflow graph structure
 * @param nodes - Workflow nodes
 * @param edges - Workflow edges
 * @throws GraphValidationError if graph is invalid
 */
export function validateGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
    if (!nodes || nodes.length === 0) {
        throw new GraphValidationError('Workflow must have at least one node');
    }

    // Check for duplicate node IDs
    const nodeIds = new Set<string>();
    for (const node of nodes) {
        if (!node.id?.trim()) {
            throw new GraphValidationError('All nodes must have a valid ID');
        }
        if (nodeIds.has(node.id)) {
            throw new GraphValidationError(`Duplicate node ID: ${node.id}`);
        }
        nodeIds.add(node.id);
    }

    // Validate node types
    const validTypes = ['candles', 'indicators', 'condition', 'order', 'notify'];
    for (const node of nodes) {
        if (!validTypes.includes(node.type)) {
            throw new GraphValidationError(
                `Invalid node type "${node.type}" for node ${node.id}. Must be one of: ${validTypes.join(', ')}`
            );
        }
    }

    // Validate edges reference existing nodes
    for (const edge of edges) {
        if (!nodeIds.has(edge.source)) {
            throw new GraphValidationError(`Edge references unknown source node: ${edge.source}`);
        }
        if (!nodeIds.has(edge.target)) {
            throw new GraphValidationError(`Edge references unknown target node: ${edge.target}`);
        }
        if (edge.source === edge.target) {
            throw new GraphValidationError(`Self-loop detected on node: ${edge.source}`);
        }
    }
}

/**
 * Perform topological sort using Kahn's algorithm
 * @param nodes - Workflow nodes
 * @param edges - Workflow edges
 * @returns Nodes in topologically sorted order
 * @throws CycleDetectedError if a cycle is detected
 */
export function topoSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    // Build adjacency list and in-degree map
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    for (const node of nodes) {
        adjacency.set(node.id, []);
        inDegree.set(node.id, 0);
    }

    // Build graph
    for (const edge of edges) {
        adjacency.get(edge.source)!.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }

    // Find all nodes with no incoming edges
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
        if (degree === 0) {
            queue.push(nodeId);
        }
    }

    // Process nodes in topological order
    const sorted: string[] = [];
    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        sorted.push(nodeId);

        // Reduce in-degree for adjacent nodes
        for (const neighbor of adjacency.get(nodeId) ?? []) {
            const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
            inDegree.set(neighbor, newDegree);

            if (newDegree === 0) {
                queue.push(neighbor);
            }
        }
    }

    // Check for cycle (not all nodes processed)
    if (sorted.length !== nodes.length) {
        // Find nodes that are part of the cycle
        const cycleNodes = nodes
            .filter((n) => !sorted.includes(n.id))
            .map((n) => n.id);
        throw new CycleDetectedError(cycleNodes);
    }

    // Map back to node objects
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    return sorted.map((id) => nodeMap.get(id)!);
}

/**
 * Find a node by ID
 * @param id - Node ID to find
 * @param nodes - Array of nodes to search
 * @returns Node or undefined
 */
export function getNodeById(id: string, nodes: WorkflowNode[]): WorkflowNode | undefined {
    return nodes.find((n) => n.id === id);
}

/**
 * Get all input values for a node from upstream outputs
 * @param nodeId - Target node ID
 * @param context - Execution context with node outputs
 * @param edges - Workflow edges
 * @returns Object with upstream node outputs keyed by source node ID
 */
export function getInputsForNode(
    nodeId: string,
    context: Map<string, unknown>,
    edges: WorkflowEdge[]
): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};

    // Find all edges targeting this node
    const incomingEdges = edges.filter((e) => e.target === nodeId);

    for (const edge of incomingEdges) {
        if (context.has(edge.source)) {
            inputs[edge.source] = context.get(edge.source);
        }
    }

    return inputs;
}

/**
 * Get all terminal nodes (nodes with no outgoing edges)
 * @param nodes - Workflow nodes
 * @param edges - Workflow edges
 * @returns Array of terminal nodes
 */
export function getTerminalNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    const sourceNodes = new Set(edges.map((e) => e.source));
    return nodes.filter((n) => !sourceNodes.has(n.id));
}
