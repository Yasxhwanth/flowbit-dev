'use client';

/**
 * BacktestChart Component
 * Professional candlestick chart with trade markers using Lightweight-Charts v5
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BarChart3 } from 'lucide-react';

// Types
interface Candle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

interface Trade {
    entryTime: number;
    exitTime: number;
    entryPrice: number;
    exitPrice: number;
    side: 'BUY' | 'SELL';
    pnl?: number;
}

interface IndicatorData {
    sma?: number[];
    ema?: number[];
    rsi?: number[];
    macdLine?: number[];
    macdSignal?: number[];
}

interface BacktestChartProps {
    candles: Candle[];
    trades?: Trade[];
    indicators?: IndicatorData;
    height?: number;
}

export function BacktestChart({
    candles,
    trades = [],
    indicators,
    height = 450,
}: BacktestChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showIndicators, setShowIndicators] = useState(true);

    // Memoize chart data
    const chartData = useMemo(() => {
        return candles.map((c) => ({
            time: Math.floor(c.timestamp / 1000),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
        }));
    }, [candles]);

    // Memoize markers
    const markers = useMemo(() => {
        const result: Array<{
            time: number;
            position: 'belowBar' | 'aboveBar';
            color: string;
            shape: 'arrowUp' | 'arrowDown';
            text: string;
        }> = [];

        for (const trade of trades) {
            result.push({
                time: Math.floor(trade.entryTime / 1000),
                position: trade.side === 'BUY' ? 'belowBar' : 'aboveBar',
                color: trade.side === 'BUY' ? '#22c55e' : '#ef4444',
                shape: trade.side === 'BUY' ? 'arrowUp' : 'arrowDown',
                text: `${trade.side} @ ${trade.entryPrice.toFixed(2)}`,
            });

            if (trade.exitTime && trade.exitPrice) {
                const exitSide = trade.side === 'BUY' ? 'SELL' : 'BUY';
                result.push({
                    time: Math.floor(trade.exitTime / 1000),
                    position: exitSide === 'SELL' ? 'aboveBar' : 'belowBar',
                    color: exitSide === 'SELL' ? '#ef4444' : '#22c55e',
                    shape: exitSide === 'SELL' ? 'arrowDown' : 'arrowUp',
                    text: `${exitSide} @ ${trade.exitPrice.toFixed(2)}`,
                });
            }
        }

        return result;
    }, [trades]);

    useEffect(() => {
        if (!containerRef.current || candles.length === 0) return;

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height,
            layout: {
                background: { color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(100, 100, 100, 0.2)' },
                horzLines: { color: 'rgba(100, 100, 100, 0.2)' },
            },
            rightPriceScale: {
                borderColor: 'rgba(100, 100, 100, 0.3)',
            },
            timeScale: {
                borderColor: 'rgba(100, 100, 100, 0.3)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        // Add candlestick series (v5 API)
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        candleSeries.setData(chartData as any);

        // Add markers using v5 plugin API
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createSeriesMarkers(candleSeries, markers as any);

        // Add indicator overlays
        if (showIndicators && indicators) {
            if (indicators.sma && indicators.sma.length > 0) {
                const smaSeries = chart.addSeries(LineSeries, {
                    color: '#3b82f6',
                    lineWidth: 2,
                });
                const smaData = indicators.sma
                    .map((value, i) => ({
                        time: Math.floor(candles[i]?.timestamp / 1000),
                        value,
                    }))
                    .filter((d) => d.value != null);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                smaSeries.setData(smaData as any);
            }

            if (indicators.ema && indicators.ema.length > 0) {
                const emaSeries = chart.addSeries(LineSeries, {
                    color: '#f59e0b',
                    lineWidth: 2,
                });
                const emaData = indicators.ema
                    .map((value, i) => ({
                        time: Math.floor(candles[i]?.timestamp / 1000),
                        value,
                    }))
                    .filter((d) => d.value != null);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                emaSeries.setData(emaData as any);
            }
        }

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (containerRef.current) {
                chart.applyOptions({ width: containerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [candles, chartData, markers, showIndicators, indicators, height]);

    if (candles.length === 0) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                    No candle data available
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-4 w-4" />
                        Price Chart
                    </CardTitle>
                    {indicators && (
                        <div className="flex items-center gap-2">
                            <Switch
                                id="show-indicators"
                                checked={showIndicators}
                                onCheckedChange={setShowIndicators}
                            />
                            <Label htmlFor="show-indicators" className="text-sm">
                                Show Indicators
                            </Label>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div ref={containerRef} style={{ height }} />
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        BUY
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        SELL
                    </span>
                    <span className="ml-auto">
                        {trades.length} trades · {candles.length} candles
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
