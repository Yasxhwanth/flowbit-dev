'use client';

/**
 * Live Trading Dashboard Page
 * Shows all workflows with execution status
 */

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkflowTable } from '@/components/dashboard/WorkflowTable';

interface WorkflowExecution {
    id: string;
    status: 'RUNNING' | 'SUCCESS' | 'FAILED';
    startedAt: string;
    completedAt: string | null;
    error: string | null;
}

interface WorkflowItem {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    symbol: string | null;
    interval: string | null;
    broker: string | null;
    nodeCount: number;
    lastExecution: WorkflowExecution | null;
}

export default function TradingDashboardPage() {
    const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWorkflows = useCallback(async () => {
        try {
            const res = await fetch('/api/workflows/list');
            if (res.ok) {
                const data = await res.json();
                setWorkflows(data.workflows || []);
            }
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkflows();

        // Poll for updates every 30 seconds
        const interval = setInterval(fetchWorkflows, 30000);
        return () => clearInterval(interval);
    }, [fetchWorkflows]);

    function handleRefresh() {
        setRefreshing(true);
        fetchWorkflows();
    }

    // Calculate stats
    const totalWorkflows = workflows.length;
    const runningCount = workflows.filter((w) => w.lastExecution?.status === 'RUNNING').length;
    const successCount = workflows.filter((w) => w.lastExecution?.status === 'SUCCESS').length;
    const failedCount = workflows.filter((w) => w.lastExecution?.status === 'FAILED').length;

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="h-6 w-6" />
                        Live Trading Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Monitor and control your trading strategies
                    </p>
                </div>
                <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Strategies
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalWorkflows}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Running
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{runningCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Successful
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{successCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Failed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{failedCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Workflows Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Active Strategies
                    </CardTitle>
                    <CardDescription>
                        Click the play button to run a strategy manually
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <WorkflowTable workflows={workflows} onRefresh={fetchWorkflows} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
