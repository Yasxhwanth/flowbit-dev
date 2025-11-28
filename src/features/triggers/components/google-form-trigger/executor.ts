import type { NodeExecutor, NodeExecutorParams, WorkflowContext } from "@/features/executions/types";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";

type GoogleFormTriggerData = Record<string, unknown>;

interface GoogleFormContext extends WorkflowContext {
  googleForm: {
    formId: string;
    formTitle: string;
    responseId: string;
    timestamp: string;
    respondentEmail: string;
    responses: Record<string, any>;
    raw: any;
  };
}

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

  const result = await step.run("google-form-trigger", async () => {
    return context as GoogleFormContext;
  });

  await publish(
    googleFormTriggerChannel().status({
      nodeId,
      status: "success",
    }),
  );

  // TODO: Publish "success" state for manual trigger
  return { result };
};
