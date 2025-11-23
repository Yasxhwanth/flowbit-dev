import type { NodeExecutor, NodeExecutorParams } from "@/features/executions/types";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";

type ManualTriggerData = Record<string, unknown>;

export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async ({
  nodeId,
  context,
  step,
  publish,
}: NodeExecutorParams<ManualTriggerData>) => {
    await publish(
      manualTriggerChannel().status({
        nodeId,
        status: "loading",
      }),
    );
  // TODO: Publish "loading" state for manual trigger

  const result = await step.run("manual-trigger", async () => context);

  await publish(
    manualTriggerChannel().status({
      nodeId,
      status: "success",
    }),
  );

  // TODO: Publish "success" state for manual trigger
    return result;
};