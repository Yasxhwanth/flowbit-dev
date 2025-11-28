import type { NodeExecutor, NodeExecutorParams } from "@/features/executions/types";
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger";


type StripeTriggerData = Record<string, unknown>;

export const stripeTriggerExecutor: NodeExecutor<StripeTriggerData> = async ({
  nodeId,
  context,
  step,
  publish,
}: NodeExecutorParams<StripeTriggerData>) => {
  await publish(
    stripeTriggerChannel().status({
      nodeId,
      status: "loading",
    }),
  );
  // TODO: Publish "loading" state for manual trigger

  const result = await step.run("stripe-trigger", async () => context);

  await publish(
    stripeTriggerChannel().status({
      nodeId,
      status: "success",
    }),
  );

  // TODO: Publish "success" state for manual trigger
  return { result };
};