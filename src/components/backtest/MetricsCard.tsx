'use client';

/**
 * Metrics Card Component
 * Displays backtest performance metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsCardProps {
    metrics: {
        totalTrades: number;
        winRate: number;
        totalPNL: number;
        maxDrawdown: number;
        sharpe?: number;
        profitFactor?: number;
        avgTradePNL?: number;
    };
    initialCapital: number;
}

export function MetricsCard({ metrics, initialCapital }: MetricsCardProps) {
    const returnPct = ((metrics.totalPNL / initialCapital) * 100).toFixed(2);
    const winRatePct = (metrics.winRate * 100).toFixed(1);
    const drawdownPct = (metrics.maxDrawdown * 100).toFixed(2);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Trades
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalTrades}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Win Rate
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">{winRatePct}%</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total P&L
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${metrics.totalPNL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{metrics.totalPNL.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">{returnPct}%</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Max Drawdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-500">{drawdownPct}%</div>
                </CardContent>
            </Card>

            {metrics.sharpe !== undefined && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Sharpe Ratio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.sharpe.toFixed(2)}</div>
                    </CardContent>
                </Card>
            )}

            {metrics.profitFactor !== undefined && metrics.profitFactor !== Infinity && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Profit Factor
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.profitFactor.toFixed(2)}</div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
