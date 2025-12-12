"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import { useSetAtom } from "jotai";
import { RotateCcw, RotateCw, Trash2, Settings, Loader2, AlertCircle, Save, Clock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";

import { Button } from "@/components/ui/button";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";
import { editorAtom } from "./store/atoms";
import { HistoryManager } from "@/lib/workflow/history";
import { nodeComponents } from "@/config/node-components";
import { AddNodeButton } from "./add-node-button";
import { ExecuteWorkflowButton } from "./execute-workflow-button";
import { WorkflowSettingsPanel } from "@/components/workflow/WorkflowSettingsPanel";

const createInitialNode = (): Node => ({
  id:
    typeof crypto !== "undefined"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  type: "INITIAL",
  position: { x: 0, y: 0 },
  data: {},
});

const normalizeNodes = (nodes: Node[]): Node[] => {
  // If there is at least one non-initial node, drop all INITIAL nodes (the "+" placeholder)
  const hasRealNode = nodes.some((node) => node.type !== "INITIAL");

  if (hasRealNode) {
    return nodes.filter((node) => node.type !== "INITIAL");
  }

  // If there are no nodes at all, add a placeholder initial node
  if (nodes.length === 0) {
    return [createInitialNode()];
  }

  return nodes;
};

import { VersionHistoryPanel } from "@/components/workflow/VersionHistoryPanel";

export const Editor = ({ workflowId }: { workflowId: string }) => {
  const workflow = useSuspenseWorkflow(workflowId);

  const setEditor = useSetAtom(editorAtom);

  const [nodes, setNodes] = useState<Node[]>(() => {
    const initialNodes = workflow?.nodes ?? [];
    return normalizeNodes(initialNodes);
  });
  const [edges, setEdges] = useState<Edge[]>(() => workflow?.edges ?? []);

  // History manager for undo/redo
  const history = useRef(new HistoryManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Track selected nodes for multi-select operations
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);

  const updateWorkflowMutation = trpc.workflows.update.useMutation();
  const [isSaving, setIsSaving] = useState(false);
  const utils = trpc.useUtils();

  const handleSave = useCallback(async () => {
    if (!workflow) return;
    setIsSaving(true);
    try {
      await updateWorkflowMutation.mutateAsync({
        id: workflow.id,
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
        edges: edges.map(e => ({
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle || null,
          targetHandle: e.targetHandle || null,
        })),
      });
      toast.success("Workflow saved");
      utils.workflowVersion.getVersions.invalidate({ workflowId: workflow.id });
    } catch (error) {
      toast.error("Failed to save workflow");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, [workflow, nodes, edges, updateWorkflowMutation, utils]);

  // Sync with server data if workflowId changes (though usually this component remounts)
  useEffect(() => {
    const initialNodes = workflow?.nodes ?? [];
    setNodes(normalizeNodes(initialNodes));
    setEdges(workflow?.edges ?? []);

    // Push initial state to history
    history.current.clear();
    history.current.push({
      nodes: normalizeNodes(initialNodes),
      edges: workflow?.edges ?? [],
    });
    setCanUndo(false);
    setCanRedo(false);
  }, [workflowId, workflow]);

  // Push to history after changes
  const pushHistory = useCallback(() => {
    history.current.push({ nodes, edges });
    setCanUndo(history.current.canUndo());
    setCanRedo(history.current.canRedo());
  }, [nodes, edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nodesSnapshot) =>
        normalizeNodes(applyNodeChanges(changes, nodesSnapshot))
      );
      // Push to history after a small delay to batch rapid changes
      setTimeout(() => pushHistory(), 100);
    },
    [pushHistory]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot));
      setTimeout(() => pushHistory(), 100);
    },
    [pushHistory]
  );
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot));
      setTimeout(() => pushHistory(), 100);
    },
    [pushHistory]
  );

  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    const snapshot = history.current.undo();
    if (snapshot) {
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setCanUndo(history.current.canUndo());
      setCanRedo(history.current.canRedo());
    }
  }, []);

  const handleRedo = useCallback(() => {
    const snapshot = history.current.redo();
    if (snapshot) {
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setCanUndo(history.current.canUndo());
      setCanRedo(history.current.canRedo());
    }
  }, []);

  // Delete selected nodes
  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length === 0) return;

    const selectedIds = new Set(selectedNodes.map((n) => n.id));

    setNodes((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    setEdges((prev) =>
      prev.filter(
        (e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)
      )
    );

    setSelectedNodes([]);
    setTimeout(() => pushHistory(), 100);
  }, [selectedNodes, pushHistory]);

  // Handle selection changes
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedNodes(params.nodes);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Undo: Ctrl+Z (or Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y (Cmd+Shift+Z or Cmd+Y on Mac)
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        handleRedo();
      }

      // Delete: Delete or Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        // Don't delete if typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          return;
        }
        e.preventDefault();
        deleteSelectedNodes();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, deleteSelectedNodes]);

  const hasManualTrigger = useMemo(() => {
    return nodes.some((node) => node.type === "MANUAL_TRIGGER");
  }, [nodes]);

  const isDirty = useMemo(() => {
    const savedNodes = normalizeNodes(workflow?.nodes ?? []);
    const savedEdges = workflow?.edges ?? [];

    return (
      JSON.stringify(nodes) !== JSON.stringify(savedNodes) ||
      JSON.stringify(edges) !== JSON.stringify(savedEdges)
    );
  }, [workflow, nodes, edges]);

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeComponents}
        onInit={setEditor}
        fitView
        proOptions={{ hideAttribution: true }}
        snapGrid={[10, 10]}
        snapToGrid
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        selectNodesOnDrag={false}
        panOnDrag={false}
        panOnScroll
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              title="Save Workflow"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelectedNodes}
              disabled={selectedNodes.length === 0}
              title={`Delete Selected (${selectedNodes.length})`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              title="Workflow Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVersionPanelOpen(true)}
              title="Version History"
            >
              <Clock className="h-4 w-4" />
            </Button>
            <AddNodeButton />
          </div>
        </Panel>

        {hasManualTrigger && (
          <Panel position="bottom-center">
            <ExecuteWorkflowButton workflowId={workflowId} isDirty={isDirty} />
          </Panel>
        )}
      </ReactFlow>

      {
        workflow && (
          <>
            <WorkflowSettingsPanel
              open={settingsOpen}
              workflow={workflow as any}
              onClose={() => setSettingsOpen(false)}
              onSave={() => {
                window.location.reload();
              }}
            />
            <VersionHistoryPanel
              open={versionPanelOpen}
              onOpenChange={setVersionPanelOpen}
              workflowId={workflow.id}
              onRestore={() => {
                window.location.reload();
              }}
            />
          </>
        )
      }
    </div>
  );
};

export const EditorLoading = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
};

export const EditorError = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-lg font-medium text-muted-foreground">
        Failed to load editor
      </p>
    </div>
  );
};
