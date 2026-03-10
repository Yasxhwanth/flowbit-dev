import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
// Assuming there isn't a custom wait channel, we'll just log or use a general one.
// We can use the context/publish if we want.

type WaitData = {
    duration?: string;
};

export const waitExecutor: NodeExecutor<WaitData> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
}) => {
    if (!data.duration) {
        throw new NonRetriableError("Duration is required for WAIT node");
    }

    // Optionally compile Handlebars if dynamic duration is needed
    const duration = Handlebars.compile(data.duration)(context);

    try {
        // Inngest step.sleep accepts times like "5m", "1h", "2s"
        await step.sleep(`wait-${nodeId}`, duration);

        return { ...context };
    } catch (error) {
        throw error;
    }
};
