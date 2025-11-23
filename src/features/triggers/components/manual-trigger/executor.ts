import type { NodeExecutor, NodeExecutorParams } from "@/features/executions/types";

type ManualTriggerData = Record<string, unknown>;

export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async ({
  nodeId,
  context,
  step,
}: NodeExecutorParams<ManualTriggerData>) => {
  // TODO: Publish "loading" state for manual trigger

  const result = await step.run("manual-trigger", async () => context);

  // TODO: Publish "success" state for manual trigger
    return result;
};