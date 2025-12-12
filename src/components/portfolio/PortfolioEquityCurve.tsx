"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp } from 'lucide-react';

interface PortfolioEquityCurveProps {
    workflows: {
        id: string;
        name: string;
        lastBacktest: {
            equityCurve: { time: number; value: number }[];
        } | null;
    }[];
}

export function PortfolioEquityCurve({ workflows }: PortfolioEquityCurveProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("all");

    // Filter workflows that have backtest data
    const availableWorkflows = useMemo(() =>
        workflows.filter(w => w.lastBacktest && w.lastBacktest.equityCurve.length > 0),
        [workflows]);

    // Combine equity curves if "all" is selected, or pick specific one
    const chartData = useMemo(() => {
        if (availableWorkflows.length === 0) return [];

        if (selectedWorkflowId !== "all") {
            const wf = availableWorkflows.find(w => w.id === selectedWorkflowId);
            return wf?.lastBacktest?.equityCurve.map(p => ({
                time: typeof p.time === 'string' ? Math.floor(new Date(p.time).getTime() / 1000) : p.time,
                value: p.value
            })) || [];
        }

        // Aggregate "All" - this is tricky because timestamps might not align.
        // For simplicity, let's just show the equity curve of the *first* available workflow for now,
        // or maybe we shouldn't support "All" aggregation yet without proper time alignment logic.
        // Let's default to the first one if "all" is selected, or just show nothing/placeholder.
        // Better: Default to the first workflow with data.

        if (availableWorkflows.length > 0) {
            const wf = availableWorkflows[0];
            return wf.lastBacktest?.equityCurve.map(p => ({
                time: typeof p.time === 'string' ? Math.floor(new Date(p.time).getTime() / 1000) : p.time,
                value: p.value
            })) || [];
        }

        return [];
    }, [selectedWorkflowId, availableWorkflows]);

    useEffect(() => {
        if (availableWorkflows.length > 0 && selectedWorkflowId === "all") {
            setSelectedWorkflowId(availableWorkflows[0].id);
        }
    }, [availableWorkflows, selectedWorkflowId]);

    useEffect(() => {
        if (!containerRef.current || chartData.length === 0) return;

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: 300,
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

        const lineSeries = chart.addSeries(LineSeries, {
            color: '#22c55e',
            lineWidth: 2,
        });

        lineSeries.setData(chartData as any);
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
    }, [chartData]);

    if (availableWorkflows.length === 0) {
        return (
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Equity Curve</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No backtest data available
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Equity Curve
                </CardTitle>
                <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select Strategy" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableWorkflows.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                                {w.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div ref={containerRef} className="h-[300px] w-full" />
            </CardContent>
        </Card>
    );
}
