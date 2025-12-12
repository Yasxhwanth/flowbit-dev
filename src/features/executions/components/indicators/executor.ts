import type { NodeExecutor, NodeExecutorParams } from "@/features/executions/types";
import { calculateIndicators } from "@/lib/indicators";

type IndicatorsData = {
    indicators: Array<{
        type: string;
        period?: number;
        source?: string;
        fastPeriod?: number;
        slowPeriod?: number;
        signalPeriod?: number;
    }>;
};

export const indicatorsExecutor: NodeExecutor<IndicatorsData> = async ({
    data,
    context,
}: NodeExecutorParams<IndicatorsData>) => {
    // In Inngest, context might need to be resolved from upstream steps
    // For now, this is a placeholder implementation

    // TODO: Resolve upstream candle data from context/inputs
    const candleData = {
        open: [],
        high: [],
        low: [],
        close: [],
        volume: [],
        timestamps: [],
    };

    const result = await calculateIndicators(candleData, data.indicators as any);
    return { result };
};
