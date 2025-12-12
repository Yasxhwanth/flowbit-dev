"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Loader2 } from "lucide-react";
import { AIExplanationPanel } from "@/components/ai/AIExplanationPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function ExecutionDetailPage() {
  const params = useParams();
  const executionId = params.executionId as string;

  const { data: execution, isLoading, error } = trpc.executions.getOne.useQuery({
    id: executionId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        Failed to load execution details.
      </div>
    );
  }

  // Extract logs and trades from output if available
  // Assuming output structure { logs: [], trades: [] } or similar
  const output = execution.output as any || {};
  const logs = output.logs || [];
  const trades = output.trades || [];

  // Map connections to edges format expected by AI
  const edges = execution.workflow.connections.map((conn) => ({
    id: conn.id,
    source: conn.fromNodeId,
    target: conn.toNodeId,
    sourceHandle: conn.fromOutput,
    targetHandle: conn.toInput,
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Execution Details</h1>
          <p className="text-muted-foreground">
            ID: {execution.id} • {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
          </p>
        </div>
        <Badge variant={execution.status === "SUCCESS" ? "default" : "destructive"}>
          {execution.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* AI Explanation Panel */}
          <AIExplanationPanel
            executionId={execution.id}
            workflowName={execution.workflow.name}
            nodes={execution.workflow.nodes}
            edges={edges}
            trades={trades}
            logs={logs}
          />

          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="bg-muted/50 p-4 rounded-md font-mono text-xs overflow-x-auto max-h-[400px]">
                  {logs.map((log: any, i: number) => (
                    <div key={i} className="mb-1">
                      <span className="text-muted-foreground">[{new Date(log.timestamp || Date.now()).toLocaleTimeString()}]</span>{" "}
                      <span className={log.level === "ERROR" ? "text-destructive" : ""}>{log.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">No logs available.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{execution.workflow.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Nodes</span>
                  <span className="font-medium">{execution.workflow.nodes.length}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{execution.status}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}