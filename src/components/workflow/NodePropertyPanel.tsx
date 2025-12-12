'use client';

/**
 * Node Property Panel
 * Sidebar for editing workflow node properties
 */

import { useState, useEffect } from 'react';
import { X, BarChart3, LineChart, Filter, ShoppingCart, Bell, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Node type definitions
interface WorkflowNode {
    id: string;
    type: string;
    data: Record<string, unknown>;
}

interface NodePropertyPanelProps {
    selectedNode: WorkflowNode | null;
    onUpdateNode: (nodeId: string, updatedData: Record<string, unknown>) => void;
    onClose: () => void;
}

// Node type icons
const nodeIcons: Record<string, React.ReactNode> = {
    candles: <BarChart3 className="h-5 w-5" />,
    indicators: <LineChart className="h-5 w-5" />,
    condition: <Filter className="h-5 w-5" />,
    order: <ShoppingCart className="h-5 w-5" />,
    notify: <Bell className="h-5 w-5" />,
};

// Node type descriptions
const nodeDescriptions: Record<string, string> = {
    candles: 'Fetch historical candlestick data from a broker.',
    indicators: 'Calculate technical indicators on candle data.',
    condition: 'Define conditions to trigger actions.',
    order: 'Execute buy or sell orders.',
    notify: 'Send notifications via Discord, Telegram, or email.',
};

export function NodePropertyPanel({
    selectedNode,
    onUpdateNode,
    onClose,
}: NodePropertyPanelProps) {
    const [localData, setLocalData] = useState<Record<string, unknown>>({});

    useEffect(() => {
        if (selectedNode) {
            setLocalData(selectedNode.data || {});
        }
    }, [selectedNode]);

    if (!selectedNode) return null;

    function handleFieldChange(key: string, value: unknown) {
        setLocalData((prev) => ({ ...prev, [key]: value }));
    }

    function handleSave() {
        if (!selectedNode) return;
        onUpdateNode(selectedNode.id, localData);
        onClose();
    }

    const nodeType = selectedNode.type;

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {nodeIcons[nodeType] || <BarChart3 className="h-5 w-5" />}
                    </div>
                    <div>
                        <h2 className="font-semibold capitalize">{nodeType} Node</h2>
                        <p className="text-xs text-muted-foreground">ID: {selectedNode.id}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Description */}
            <div className="px-4 py-3 bg-muted/30">
                <p className="text-sm text-muted-foreground">
                    {nodeDescriptions[nodeType] || 'Configure this node.'}
                </p>
            </div>

            <Separator />

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {nodeType === 'candles' && (
                    <CandlesForm data={localData} onChange={handleFieldChange} />
                )}
                {nodeType === 'indicators' && (
                    <IndicatorsForm data={localData} onChange={handleFieldChange} />
                )}
                {nodeType === 'condition' && (
                    <ConditionForm data={localData} onChange={handleFieldChange} />
                )}
                {nodeType === 'order' && (
                    <OrderForm data={localData} onChange={handleFieldChange} />
                )}
                {nodeType === 'notify' && (
                    <NotifyForm data={localData} onChange={handleFieldChange} />
                )}
            </div>

            <Separator />

            {/* Footer */}
            <div className="p-4 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                    Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                </Button>
            </div>
        </div>
    );
}

// ============================================================================
// CANDLES FORM
// ============================================================================
interface FormProps {
    data: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
}

function CandlesForm({ data, onChange }: FormProps) {
    const broker = data.broker as string || '';

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                    id="symbol"
                    value={(data.symbol as string) || ''}
                    onChange={(e) => onChange('symbol', e.target.value)}
                    placeholder="e.g., RELIANCE"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="broker">Broker</Label>
                <Select
                    value={broker}
                    onValueChange={(v) => onChange('broker', v)}
                >
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

            <div className="space-y-2">
                <Label htmlFor="interval">Interval</Label>
                <Select
                    value={(data.interval as string) || '1d'}
                    onValueChange={(v) => onChange('interval', v)}
                >
                    <SelectTrigger>
                        <SelectValue />
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

            {broker === 'dhan' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="securityId">Security ID *</Label>
                        <Input
                            id="securityId"
                            value={(data.securityId as string) || ''}
                            onChange={(e) => onChange('securityId', e.target.value)}
                            placeholder="e.g., 2885"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="exchangeSegment">Exchange Segment</Label>
                        <Select
                            value={(data.exchangeSegment as string) || 'NSE_EQ'}
                            onValueChange={(v) => onChange('exchangeSegment', v)}
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
    );
}

// ============================================================================
// INDICATORS FORM
// ============================================================================
interface IndicatorConfig {
    type: string;
    period?: number;
    fastPeriod?: number;
    slowPeriod?: number;
    signalPeriod?: number;
}

function IndicatorsForm({ data, onChange }: FormProps) {
    const indicators = (data.indicators as IndicatorConfig[]) || [];

    function updateIndicator(index: number, field: string, value: unknown) {
        const updated = [...indicators];
        updated[index] = { ...updated[index], [field]: value };
        onChange('indicators', updated);
    }

    function addIndicator() {
        onChange('indicators', [...indicators, { type: 'sma', period: 20 }]);
    }

    function removeIndicator(index: number) {
        onChange('indicators', indicators.filter((_, i) => i !== index));
    }

    return (
        <div className="space-y-4">
            <Accordion type="multiple" className="w-full">
                {indicators.map((ind, index) => (
                    <AccordionItem key={index} value={`ind-${index}`}>
                        <AccordionTrigger className="text-sm">
                            {ind.type.toUpperCase()} {ind.period ? `(${ind.period})` : ''}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-2">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={ind.type}
                                    onValueChange={(v) => updateIndicator(index, 'type', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sma">SMA</SelectItem>
                                        <SelectItem value="ema">EMA</SelectItem>
                                        <SelectItem value="rsi">RSI</SelectItem>
                                        <SelectItem value="macd">MACD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(ind.type === 'sma' || ind.type === 'ema' || ind.type === 'rsi') && (
                                <div className="space-y-2">
                                    <Label>Period</Label>
                                    <Input
                                        type="number"
                                        value={ind.period || 20}
                                        onChange={(e) => updateIndicator(index, 'period', Number(e.target.value))}
                                        min={1}
                                        max={200}
                                    />
                                </div>
                            )}

                            {ind.type === 'macd' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Fast Period</Label>
                                        <Input
                                            type="number"
                                            value={ind.fastPeriod || 12}
                                            onChange={(e) => updateIndicator(index, 'fastPeriod', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Slow Period</Label>
                                        <Input
                                            type="number"
                                            value={ind.slowPeriod || 26}
                                            onChange={(e) => updateIndicator(index, 'slowPeriod', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Signal Period</Label>
                                        <Input
                                            type="number"
                                            value={ind.signalPeriod || 9}
                                            onChange={(e) => updateIndicator(index, 'signalPeriod', Number(e.target.value))}
                                        />
                                    </div>
                                </>
                            )}

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeIndicator(index)}
                            >
                                Remove
                            </Button>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <Button variant="outline" size="sm" onClick={addIndicator}>
                + Add Indicator
            </Button>
        </div>
    );
}

// ============================================================================
// CONDITION FORM
// ============================================================================
interface ConditionClause {
    left: string;
    operator: string;
    right: string;
    connector?: 'AND' | 'OR';
}

function ConditionForm({ data, onChange }: FormProps) {
    const expression = (data.expression as string) || '';
    const clauses = (data.clauses as ConditionClause[]) || [
        { left: '', operator: '>', right: '' },
    ];

    function updateClause(index: number, field: string, value: string) {
        const updated = [...clauses];
        updated[index] = { ...updated[index], [field]: value };
        onChange('clauses', updated);
        rebuildExpression(updated);
    }

    function addClause(connector: 'AND' | 'OR') {
        const lastClause = clauses[clauses.length - 1];
        if (lastClause) {
            lastClause.connector = connector;
        }
        const updated = [...clauses, { left: '', operator: '>', right: '' }];
        onChange('clauses', updated);
    }

    function removeClause(index: number) {
        if (clauses.length <= 1) return;
        const updated = clauses.filter((_, i) => i !== index);
        if (updated.length > 0 && index === clauses.length - 1) {
            delete updated[updated.length - 1].connector;
        }
        onChange('clauses', updated);
        rebuildExpression(updated);
    }

    function rebuildExpression(cls: ConditionClause[]) {
        const parts = cls.map((c, i) => {
            const base = `${c.left} ${c.operator} ${c.right}`;
            if (c.connector && i < cls.length - 1) {
                return `${base} ${c.connector}`;
            }
            return base;
        });
        onChange('expression', parts.join(' '));
    }

    const operators = ['>', '<', '>=', '<=', '==', '!='];
    const operandOptions = ['sma_20', 'sma_50', 'ema_20', 'rsi_14', 'macd.line', 'macd.signal', 'close', 'open', 'high', 'low'];

    return (
        <div className="space-y-4">
            {clauses.map((clause, index) => (
                <Card key={index} className="p-3">
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <Select
                                value={clause.left}
                                onValueChange={(v) => updateClause(index, 'left', v)}
                            >
                                <SelectTrigger className="text-xs">
                                    <SelectValue placeholder="Left" />
                                </SelectTrigger>
                                <SelectContent>
                                    {operandOptions.map((op) => (
                                        <SelectItem key={op} value={op}>{op}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={clause.operator}
                                onValueChange={(v) => updateClause(index, 'operator', v)}
                            >
                                <SelectTrigger className="text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {operators.map((op) => (
                                        <SelectItem key={op} value={op}>{op}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                className="text-xs"
                                value={clause.right}
                                onChange={(e) => updateClause(index, 'right', e.target.value)}
                                placeholder="Value or indicator"
                            />
                        </div>

                        {index > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeClause(index)}
                                className="text-xs"
                            >
                                Remove
                            </Button>
                        )}

                        {clause.connector && (
                            <div className="text-center text-xs font-medium text-muted-foreground">
                                {clause.connector}
                            </div>
                        )}
                    </div>
                </Card>
            ))}

            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addClause('AND')}>
                    + AND
                </Button>
                <Button variant="outline" size="sm" onClick={() => addClause('OR')}>
                    + OR
                </Button>
            </div>

            <div className="p-2 bg-muted rounded text-xs font-mono">
                {expression || 'No expression'}
            </div>
        </div>
    );
}

// ============================================================================
// ORDER FORM
// ============================================================================
function OrderForm({ data, onChange }: FormProps) {
    const orderType = (data.orderType as string) || 'MARKET';

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Side</Label>
                <Select
                    value={(data.side as string) || 'BUY'}
                    onValueChange={(v) => onChange('side', v)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="BUY">BUY</SelectItem>
                        <SelectItem value="SELL">SELL</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                    type="number"
                    value={(data.quantity as number) || 1}
                    onChange={(e) => onChange('quantity', Number(e.target.value))}
                    min={1}
                />
            </div>

            <div className="space-y-2">
                <Label>Order Type</Label>
                <Select
                    value={orderType}
                    onValueChange={(v) => onChange('orderType', v)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MARKET">Market</SelectItem>
                        <SelectItem value="LIMIT">Limit</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {orderType === 'LIMIT' && (
                <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                        type="number"
                        value={(data.price as number) || 0}
                        onChange={(e) => onChange('price', Number(e.target.value))}
                        step="0.01"
                    />
                </div>
            )}

            <div className="flex items-center justify-between">
                <Label htmlFor="dryRun">Dry Run (Paper Trade)</Label>
                <Switch
                    id="dryRun"
                    checked={(data.dryRun as boolean) ?? true}
                    onCheckedChange={(v) => onChange('dryRun', v)}
                />
            </div>
        </div>
    );
}

// ============================================================================
// NOTIFY FORM
// ============================================================================
function NotifyForm({ data, onChange }: FormProps) {
    const channel = (data.channel as string) || 'discord';

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Channel</Label>
                <Select
                    value={channel}
                    onValueChange={(v) => onChange('channel', v)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="discord">Discord</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {channel === 'discord' && (
                <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                        value={(data.webhookUrl as string) || ''}
                        onChange={(e) => onChange('webhookUrl', e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                    />
                </div>
            )}

            {channel === 'telegram' && (
                <>
                    <div className="space-y-2">
                        <Label>Bot Token</Label>
                        <Input
                            value={(data.botToken as string) || ''}
                            onChange={(e) => onChange('botToken', e.target.value)}
                            placeholder="Your Telegram bot token"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Chat ID</Label>
                        <Input
                            value={(data.chatId as string) || ''}
                            onChange={(e) => onChange('chatId', e.target.value)}
                            placeholder="Chat ID"
                        />
                    </div>
                </>
            )}

            {channel === 'email' && (
                <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                        type="email"
                        value={(data.email as string) || ''}
                        onChange={(e) => onChange('email', e.target.value)}
                        placeholder="your@email.com"
                    />
                </div>
            )}

            <div className="space-y-2">
                <Label>Message Template</Label>
                <Textarea
                    value={(data.message as string) || '{{symbol}} - {{side}} order executed at {{price}}'}
                    onChange={(e) => onChange('message', e.target.value)}
                    placeholder="Use {{variable}} for dynamic values"
                    rows={4}
                />
            </div>
        </div>
    );
}
