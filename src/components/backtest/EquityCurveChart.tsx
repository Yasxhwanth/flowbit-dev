'use client';

/**
 * Equity Curve Chart Component
 * Displays equity curve using Recharts
 */

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EquityPoint {
    timestamp: number;
    equity: number;
}

interface EquityCurveChartProps {
    equityCurve: EquityPoint[];
    initialCapital: number;
}

export function EquityCurveChart({ equityCurve, initialCapital }: EquityCurveChartProps) {
    const data = equityCurve.map((point) => ({
        time: new Date(point.timestamp).toLocaleDateString(),
        equity: point.equity,
    }));

    // Add initial point if not present
    if (data.length === 0 || data[0].equity !== initialCapital) {
        data.unshift({ time: 'Start', equity: initialCapital });
    }

    const minEquity = Math.min(...data.map((d) => d.equity));
    const maxEquity = Math.max(...data.map((d) => d.equity));
    const padding = (maxEquity - minEquity) * 0.1;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 12 }}
                                className="text-muted-foreground"
                            />
                            <YAxis
                                domain={[minEquity - padding, maxEquity + padding]}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                                className="text-muted-foreground"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Equity']}
                            />
                            <Line
                                type="monotone"
                                dataKey="equity"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
