import type { NodeExecutor, NodeExecutorParams } from "@/features/executions/types";

type NotifyData = {
    message?: string;
    channel?: string;
};

export const notifyExecutor: NodeExecutor<NotifyData> = async ({
    data,
    context,
}: NodeExecutorParams<NotifyData>) => {
    return {
        result: {
            notified: true,
            message: data.message ?? 'Workflow completed',
            channel: data.channel ?? 'default',
            timestamp: new Date().toISOString(),
        }
    };
};
