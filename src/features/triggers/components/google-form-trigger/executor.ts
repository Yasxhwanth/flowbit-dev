import type { NodeExecutor, NodeExecutorParams } from "@/features/executions/types";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";


type GoogleFormTriggerData = Record<string, unknown>;

export const googleFormTriggerExecutor: NodeExecutor<GoogleFormTriggerData> = async ({
  nodeId,
  context,
  step,
  publish,
}: NodeExecutorParams<GoogleFormTriggerData>) => {
    await publish(
      googleFormTriggerChannel().status({
        nodeId,
        status: "loading",
      }),
    );
  // TODO: Publish "loading" state for manual trigger

  const result = await step.run("google-form-trigger", async () => context);

  await publish(
    googleFormTriggerChannel().status({
      nodeId,
      status: "success",
    }),
  );

  // TODO: Publish "success" state for manual trigger
    return result;
};