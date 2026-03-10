import type { NodeExecutor, NodeExecutorParams } from "@/features/executions/types";
// Mock or generic schedule channel if it existed
// import { scheduleTriggerChannel } from "@/inngest/channels/schedule-trigger";

type ScheduleTriggerData = Record<string, unknown>;

export const scheduleTriggerExecutor: NodeExecutor<ScheduleTriggerData> = async ({
    nodeId,
    context,
    step,
    publish,
}: NodeExecutorParams<ScheduleTriggerData>) => {
    // Normally the schedule trigger is what starts the workflow.
    // When it executes, it just passes context forward.
    const result = await step.run("schedule-trigger", async () => {
        return {
            ...context,
            schedule: {
                timestamp: new Date().toISOString()
            }
        };
    });

    return { result };
};
