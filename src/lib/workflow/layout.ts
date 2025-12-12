/**
 * Workflow Layout Utility
 * Uses dagre for automatic DAG layout of workflow nodes
 */

import dagre from 'dagre';

interface LayoutNode {
    id: string;
    position?: { x: number; y: number };
    width?: number;
    height?: number;
    [key: string]: unknown;
}

interface LayoutEdge {
    source: string;
    target: string;
    [key: string]: unknown;
}

interface LayoutOptions {
    /** Layout direction: LR (left-right) or TB (top-bottom) */
    direction?: 'LR' | 'TB';
    /** Horizontal spacing between nodes */
    nodeSpacing?: number;
    /** Vertical spacing between ranks */
    rankSpacing?: number;
    /** Default node width */
    nodeWidth?: number;
    /** Default node height */
    nodeHeight?: number;
}

const defaultOptions: Required<LayoutOptions> = {
    direction: 'LR',
    nodeSpacing: 100,
    rankSpacing: 200,
    nodeWidth: 200,
    nodeHeight: 80,
};

/**
 * Auto-layout nodes using dagre algorithm
 */
export function autoLayout<N extends LayoutNode, E extends LayoutEdge>(
    nodes: N[],
    edges: E[],
    options: LayoutOptions = {}
): { nodes: N[]; edges: E[] } {
    const opts = { ...defaultOptions, ...options };

    // Create a new directed graph
    const g = new dagre.graphlib.Graph();

    // Set graph options
    g.setGraph({
        rankdir: opts.direction,
        nodesep: opts.nodeSpacing,
        ranksep: opts.rankSpacing,
        marginx: 50,
        marginy: 50,
    });

    // Default edge label
    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes to the graph
    for (const node of nodes) {
        g.setNode(node.id, {
            width: node.width ?? opts.nodeWidth,
            height: node.height ?? opts.nodeHeight,
        });
    }

    // Add edges to the graph
    for (const edge of edges) {
        g.setEdge(edge.source, edge.target);
    }

    // Run the layout algorithm
    dagre.layout(g);

    // Apply calculated positions to nodes
    const laidOutNodes = nodes.map((node) => {
        const nodeWithPos = g.node(node.id);
        if (nodeWithPos) {
            return {
                ...node,
                position: {
                    x: nodeWithPos.x - (node.width ?? opts.nodeWidth) / 2,
                    y: nodeWithPos.y - (node.height ?? opts.nodeHeight) / 2,
                },
            };
        }
        return node;
    });

    return {
        nodes: laidOutNodes,
        edges,
    };
}

/**
 * Snap a position to grid
 */
export function snapToGrid(
    position: { x: number; y: number },
    gridSize: number = 16
): { x: number; y: number } {
    return {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
    };
}

/**
 * Get optimal position for a new node
 */
export function getNewNodePosition(
    existingNodes: LayoutNode[],
    edges: LayoutEdge[],
    nodeWidth: number = 200,
    nodeHeight: number = 80
): { x: number; y: number } {
    if (existingNodes.length === 0) {
        return { x: 100, y: 100 };
    }

    // Find rightmost node
    let maxX = 0;
    let maxY = 0;

    for (const node of existingNodes) {
        const x = (node.position?.x ?? 0) + (node.width ?? nodeWidth);
        const y = node.position?.y ?? 0;
        if (x > maxX) {
            maxX = x;
            maxY = y;
        }
    }

    // Position new node to the right
    return snapToGrid({
        x: maxX + 100,
        y: maxY,
    });
}
