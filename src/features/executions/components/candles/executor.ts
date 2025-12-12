import type { NodeExecutor, NodeExecutorParams } from "@/features/executions/types";
import { fetchCandles } from "@/lib/broker";

type CandlesData = {
    symbol: string;
    securityId: string;
    exchangeSegment: 'NSE_EQ' | 'BSE_EQ' | 'NSE_FNO' | 'BSE_FNO' | 'MCX_COMM' | 'NSE_CURRENCY' | 'BSE_CURRENCY';
    interval: '1m' | '5m' | '15m' | '30m' | '1h' | '1d';
    fromTimestamp?: number;
    toTimestamp?: number;
};

export const candlesExecutor: NodeExecutor<CandlesData> = async ({
    data,
}: NodeExecutorParams<CandlesData>) => {
    const request = {
        symbol: data.symbol,
        securityId: data.securityId,
        exchangeSegment: data.exchangeSegment,
        interval: data.interval,
        fromTimestamp: data.fromTimestamp,
        toTimestamp: data.toTimestamp,
    };

    const result = await fetchCandles(request);
    return { result };
};
