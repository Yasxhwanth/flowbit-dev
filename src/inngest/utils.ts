import { Connection, Node } from "@/generated/prisma/client";
import toposort from "toposort";
import { inngest } from "./client";

export const topologicalSort = (
  nodes: Node[],
  connections: Connection[],
): Node[] => {
  // If no connections, return node as-is (they're all independent)
  if (connections.length === 0) {
    return nodes;
  }

  // Create edges array for toposort
  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ]);
  
  // Track which nodes are connected (have edges)
  const connectedNodeIds = new Set<string>();
  
  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  }

  // Find nodes with no connections (isolated nodes)
  const isolatedNodeIds = nodes
    .filter((node) => !connectedNodeIds.has(node.id))
    .map((node) => node.id);
  
  // Perform topological sort
  let sortedNodeIds: string[] = [];
  try {
    if (edges.length > 0) {
      sortedNodeIds = toposort(edges);
      sortedNodeIds = [...new Set(sortedNodeIds)];
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error("Workflow contains a cycle");
    }
    throw error;
  }
  
  // Combine sorted nodes with isolated nodes (nodes with no connections)
  // Isolated nodes can be added at the end in any order
  const allSortedIds = [...sortedNodeIds, ...isolatedNodeIds];
  
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return allSortedIds.map((id) => nodeMap.get(id)!).filter(Boolean);
};

export const sendWorkflowExecution = async (data: {
  workflowId: string;
  [key: string]: any;
}) => {
  return inngest.send({
    name: "workflows/execute.workflow",
    data,
  });
};