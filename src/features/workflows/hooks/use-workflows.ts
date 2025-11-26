"use client";

import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWorkflowsParams } from "./use-workflows-params";
import superjson from "superjson";
import type { Node, Edge } from "@xyflow/react";

export type WorkflowGraph = {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
};

/**
 * Hook to fetch all workflows using suspense
 *
 * ⚠️ Intended for SERVER components only. Using this in client components
 * can cause render / fetch loops.
 */
export const useSuspenseWorkflows = () => {
  const [params] = useWorkflowsParams();

  const safeParams = {
    ...params,
    page: Number(params.page) || 1,
    pageSize: Number(params.pageSize) || 5,
  };

  return trpc.workflows.getMany.useSuspenseQuery(safeParams);
};

/**
 * Client-safe hook for workflows list (non-Suspense).
 */
export const useWorkflows = () => {
  const [params] = useWorkflowsParams();

  const safeParams = {
    ...params,
    page: Number(params.page) || 1,
    pageSize: Number(params.pageSize) || 5,
  };

  return trpc.workflows.getMany.useQuery(safeParams);
};

/**
 * Hook to fetch a single workflow using suspense
 */
export const useSuspenseWorkflow = (workflowId: string) => {
  const [data] = trpc.workflows.getOne.useSuspenseQuery({ id: workflowId });

  if (data && typeof data === "object" && "json" in data && "meta" in data) {
    return superjson.deserialize<WorkflowGraph>(data as any);
  }

  return data as WorkflowGraph | undefined;
};

/**
 * Hook to create a workflow
 */
export const useCreateWorkflow = () => {
  const utils = trpc.useUtils();
  const router = useRouter();

  return trpc.workflows.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Workflow "${data.name}" created`);
      router.push(`/workflows/${data.id}`);
      utils.workflows.getMany.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to create workflow: ${error.message}`);
    },
  });
};

export const useRemoveWorkflow = () => {
  const utils = trpc.useUtils();

  return trpc.workflows.remove.useMutation({
    onSuccess: (data) => {
      toast.success(`Workflow "${data.name}" removed`);
      utils.workflows.getMany.invalidate();
      utils.workflows.getOne.invalidate({ id: data.id });
    },
  });
};

/**
 * Hook to update workflow name
 */
export const useUpdateWorkflowName = () => {
  const utils = trpc.useUtils();

  return trpc.workflows.updateName.useMutation({
    onSuccess: (data) => {
      toast.success(`Workflow "${data.name}" updated`);
      utils.workflows.getMany.invalidate();
      utils.workflows.getOne.invalidate({ id: data.id });
    },
    onError: (error: any) => {
      toast.error(`Failed to update workflow: ${error.message}`);
    },
  });
};

export const useUpdateWorkflow = () => {
  const utils = trpc.useUtils();

  return trpc.workflows.update.useMutation({
    onSuccess: (_, variables) => {
      toast.success("Workflow saved");
      utils.workflows.getMany.invalidate();
      utils.workflows.getOne.invalidate({ id: variables.id });
    },
    onError: (error: any) => {
      toast.error(`Failed to save workflow: ${error.message}`);
    },
  });
};

/**
 * FIXED – Hook to execute workflow
 */
export const useExecuteWorkflow = () => {
  return trpc.workflows.execute.useMutation({
    onSuccess: (data) => {
      toast.success(`Workflow "${data.name}" executed`);
    },
    onError: (error: any) => {
      toast.error(`Failed to execute workflow: ${error.message}`);
    },
  });
};
