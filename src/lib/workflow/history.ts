/**
 * History Manager for Workflow Editor
 * Provides undo/redo functionality with snapshot-based history
 */

import type { Node, Edge } from '@xyflow/react';

export interface EditorSnapshot {
    nodes: Node[];
    edges: Edge[];
}

const MAX_HISTORY_SIZE = 50;

export class HistoryManager {
    private undoStack: EditorSnapshot[] = [];
    private redoStack: EditorSnapshot[] = [];

    /**
     * Push a new snapshot to history
     * Clears redo stack and prevents duplicate snapshots
     */
    push(snapshot: EditorSnapshot): void {
        // Prevent pushing duplicate consecutive snapshots
        const lastSnapshot = this.undoStack[this.undoStack.length - 1];
        if (lastSnapshot && this.areSnapshotsEqual(lastSnapshot, snapshot)) {
            return;
        }

        // Deep clone to prevent mutations
        const clonedSnapshot = this.cloneSnapshot(snapshot);

        this.undoStack.push(clonedSnapshot);

        // Clear redo stack when new change is made
        this.redoStack = [];

        // Limit history size
        if (this.undoStack.length > MAX_HISTORY_SIZE) {
            this.undoStack.shift();
        }
    }

    /**
     * Undo last change
     * Returns previous snapshot or null if can't undo
     */
    undo(): EditorSnapshot | null {
        if (!this.canUndo()) {
            return null;
        }

        const current = this.undoStack.pop()!;
        this.redoStack.push(current);

        const previous = this.undoStack[this.undoStack.length - 1];
        return previous ? this.cloneSnapshot(previous) : null;
    }

    /**
     * Redo last undone change
     * Returns next snapshot or null if can't redo
     */
    redo(): EditorSnapshot | null {
        if (!this.canRedo()) {
            return null;
        }

        const next = this.redoStack.pop()!;
        this.undoStack.push(next);

        return this.cloneSnapshot(next);
    }

    /**
     * Check if undo is available
     */
    canUndo(): boolean {
        return this.undoStack.length > 1;
    }

    /**
     * Check if redo is available
     */
    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /**
     * Clear all history
     */
    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Deep clone snapshot to prevent mutations
     */
    private cloneSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
        return {
            nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
            edges: JSON.parse(JSON.stringify(snapshot.edges)),
        };
    }

    /**
     * Check if two snapshots are equal (shallow comparison)
     */
    private areSnapshotsEqual(a: EditorSnapshot, b: EditorSnapshot): boolean {
        if (a.nodes.length !== b.nodes.length || a.edges.length !== b.edges.length) {
            return false;
        }

        // Check if node IDs and positions are the same
        for (let i = 0; i < a.nodes.length; i++) {
            const nodeA = a.nodes[i];
            const nodeB = b.nodes.find((n) => n.id === nodeA.id);

            if (!nodeB) return false;

            if (
                nodeA.position.x !== nodeB.position.x ||
                nodeA.position.y !== nodeB.position.y ||
                JSON.stringify(nodeA.data) !== JSON.stringify(nodeB.data)
            ) {
                return false;
            }
        }

        // Check if edges are the same
        for (let i = 0; i < a.edges.length; i++) {
            const edgeA = a.edges[i];
            const edgeB = b.edges.find((e) => e.id === edgeA.id);

            if (!edgeB || edgeA.source !== edgeB.source || edgeA.target !== edgeB.target) {
                return false;
            }
        }

        return true;
    }
}
