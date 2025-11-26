"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
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
} from "@xyflow/react";
import { ErrorView, LoadingView } from "@/components/entity-components";
import { useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";
import "@xyflow/react/dist/style.css";
import { nodeComponents } from "@/config/node-components";
import { AddNodeButton } from "./add-node-button";
import { useSetAtom } from "jotai";
import { editorAtom } from "./store/atoms";
import { NodeType } from "@/generated/prisma/enums";
import { ExecuteWorkflowButton } from "./execute-workflow-button";

export const EditorLoading = () => {
  return <LoadingView message="Loading editor..." />;
};

export const EditorError = () => {
  return <ErrorView message="Error loading editor" />;
};

const createInitialNode = (): Node => ({
  id:
    typeof crypto !== "undefined"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  type: NodeType.INITIAL,
  position: { x: 0, y: 0 },
  data: {},
});

const normalizeNodes = (nodes: Node[]): Node[] => {
  // If there is at least one non-initial node, drop all INITIAL nodes (the "+" placeholder)
  const hasRealNode = nodes.some((node) => node.type !== NodeType.INITIAL);

  if (hasRealNode) {
    return nodes.filter((node) => node.type !== NodeType.INITIAL);
  }

  // If there are no nodes at all, add a placeholder initial node
  if (nodes.length === 0) {
    return [createInitialNode()];
  }

  return nodes;
};

export const Editor = ({ workflowId }: { workflowId: string }) => {
  const workflow = useSuspenseWorkflow(workflowId);

  const setEditor = useSetAtom(editorAtom);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Initialize from server once per workflow id (don't overwrite local edits on refetch)
  useEffect(() => {
    const initialNodes = workflow?.nodes ?? [];
    setNodes(normalizeNodes(initialNodes));
    setEdges(workflow?.edges ?? []);
  }, [workflowId]);


  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) =>
        normalizeNodes(applyNodeChanges(changes, nodesSnapshot)),
      ),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const hasManualTrigger = useMemo(() => {
    return nodes.some((node) => node.type === NodeType.MANUAL_TRIGGER);
  }, [nodes]);


  return (

    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeComponents}
        onInit={setEditor}
        fitView
        proOptions={{ hideAttribution: true }}
        snapGrid={[10, 10]}
        snapToGrid
        panOnScroll
        panOnDrag={false}
        selectionOnDrag
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <AddNodeButton />
        </Panel>
        {hasManualTrigger && (
        <Panel position="bottom-center">
          <ExecuteWorkflowButton workflowId={workflowId} />
        </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
