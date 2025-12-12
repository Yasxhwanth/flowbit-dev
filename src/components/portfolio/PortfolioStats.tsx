import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

interface PortfolioStatsProps {
    stats: {
        totalStrategies: number;
        activeStrategies: number;
        totalBacktestedPnl: number;
        avgWinRate: number;
        worstMaxDrawdown: number;
    };
}

export function PortfolioStats({ stats }: PortfolioStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Strategies</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalStrategies}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.activeStrategies} active
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total PNL (Backtest)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${stats.totalBacktestedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${stats.totalBacktestedPnl.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Across all strategies
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Win Rate</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.avgWinRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                        Weighted average
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-500">
                        {stats.worstMaxDrawdown.toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Worst case scenario
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Ratio</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.totalStrategies > 0
                            ? ((stats.activeStrategies / stats.totalStrategies) * 100).toFixed(0)
                            : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Strategies enabled
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
