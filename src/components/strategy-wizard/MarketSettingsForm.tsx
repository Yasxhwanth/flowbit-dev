'use client';

/**
 * MarketSettingsForm Component
 * Step 2: Configure market settings
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface MarketSettings {
    symbol: string;
    interval: string;
    broker: string;
    securityId?: string;
    exchangeSegment?: string;
}

interface MarketSettingsFormProps {
    value: MarketSettings;
    onChange: (settings: MarketSettings) => void;
}

export function MarketSettingsForm({ value, onChange }: MarketSettingsFormProps) {
    function update(field: keyof MarketSettings, val: string) {
        onChange({ ...value, [field]: val });
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Market Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Choose the symbol and timeframe for your strategy
                </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol *</Label>
                    <Input
                        id="symbol"
                        value={value.symbol}
                        onChange={(e) => update('symbol', e.target.value.toUpperCase())}
                        placeholder="e.g., RELIANCE, NIFTY"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="interval">Interval *</Label>
                    <Select value={value.interval} onValueChange={(v) => update('interval', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1m">1 Minute</SelectItem>
                            <SelectItem value="5m">5 Minutes</SelectItem>
                            <SelectItem value="15m">15 Minutes</SelectItem>
                            <SelectItem value="30m">30 Minutes</SelectItem>
                            <SelectItem value="1h">1 Hour</SelectItem>
                            <SelectItem value="1d">1 Day</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="broker">Broker *</Label>
                    <Select value={value.broker} onValueChange={(v) => update('broker', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select broker" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dhan">Dhan</SelectItem>
                            <SelectItem value="fyers">Fyers</SelectItem>
                            <SelectItem value="angel">Angel One</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {value.broker === 'dhan' && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="securityId">Security ID *</Label>
                            <Input
                                id="securityId"
                                value={value.securityId || ''}
                                onChange={(e) => update('securityId', e.target.value)}
                                placeholder="e.g., 2885"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="exchangeSegment">Exchange Segment</Label>
                            <Select
                                value={value.exchangeSegment || 'NSE_EQ'}
                                onValueChange={(v) => update('exchangeSegment', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NSE_EQ">NSE Equity</SelectItem>
                                    <SelectItem value="BSE_EQ">BSE Equity</SelectItem>
                                    <SelectItem value="NSE_FNO">NSE F&O</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
