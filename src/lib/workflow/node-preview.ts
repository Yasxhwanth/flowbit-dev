/**
 * Node Preview Helpers
 * Generate concise preview text for workflow nodes
 */

interface CandleData {
    symbol?: string;
    interval?: string;
    broker?: string;
}

interface IndicatorData {
    indicators?: Array<{ type: string; period?: number }>;
}

interface ConditionData {
    expression?: string;
    tree?: unknown;
}

interface OrderData {
    side?: string;
    quantity?: number;
    orderType?: string;
    price?: number;
    dryRun?: boolean;
}

interface NotifyData {
    channel?: string;
    message?: string;
}

export function getCandlePreview(data: CandleData): string {
    const parts: string[] = [];

    if (data.symbol) parts.push(`Symbol: ${data.symbol}`);
    if (data.interval) parts.push(`Interval: ${data.interval}`);
    if (data.broker) parts.push(`Broker: ${data.broker}`);

    return parts.length > 0 ? parts.join(' • ') : 'No configuration';
}

export function getIndicatorPreview(data: IndicatorData): string {
    if (!data.indicators || data.indicators.length === 0) {
        return 'No indicators';
    }

    return data.indicators
        .map((ind) => {
            const name = ind.type.toUpperCase();
            const period = ind.period ? `(${ind.period})` : '';
            return `${name}${period}`;
        })
        .join(', ');
}

export function getConditionPreview(data: ConditionData): string {
    if (data.expression) {
        return data.expression;
    }

    // If structured tree exists, try to generate expression
    // For now, just show placeholder
    if (data.tree) {
        return 'Custom condition';
    }

    return 'No condition';
}

export function getOrderPreview(data: OrderData): string {
    const side = data.side || 'BUY';
    const qty = data.quantity || 1;
    const orderType = data.orderType || 'MARKET';
    const dryRun = data.dryRun ? ' (dry-run)' : '';

    if (orderType === 'LIMIT' && data.price) {
        return `${side} ${qty} @ LIMIT ${data.price}${dryRun}`;
    }

    return `${side} ${qty} @ ${orderType}${dryRun}`;
}

export function getNotifyPreview(data: NotifyData): string {
    const channel = data.channel || 'Discord';
    const message = data.message || 'Notification triggered';

    // Truncate long messages
    const truncated = message.length > 40
        ? message.substring(0, 40) + '...'
        : message;

    return `${channel}: ${truncated}`;
}
