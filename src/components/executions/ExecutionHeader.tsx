'use client';

/**
 * ExecutionHeader Component
 * Shows execution summary with actions
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { useState } from 'react';

interface ExecutionHeaderProps {
    execution: {
        id: string;
        workflowId: string;
        workflowName: string;
        startedAt: string;
        completedAt: string | null;
        status: 'RUNNING' | 'SUCCESS' | 'FAILED';
        durationMs: number | null;
        meta?: {
            symbol?: string;
            broker?: string;
            interval?: string;
        };
    };
}

const statusStyles = {
    RUNNING: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    SUCCESS: 'bg-green-500/10 text-green-500 border-green-500/30',
    FAILED: 'bg-red-500/10 text-red-500 border-red-500/30',
};

export function ExecutionHeader({ execution }: ExecutionHeaderProps) {
    const router = useRouter();
    const [isRunning, setIsRunning] = useState(false);

    async function handleRerun() {
        setIsRunning(true);
        try {
            await fetch(`/api/workflows/${execution.workflowId}/run`, { method: 'POST' });
            // Redirect to dashboard after triggering
            router.push('/dashboard/trading');
        } catch {
            setIsRunning(false);
        }
    }

    function formatDuration(ms: number | null): string {
        if (ms === null) return '—';
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-semibold">{execution.workflowName}</h1>
                                <Badge variant="outline" className={statusStyles[execution.status]}>
                                    {execution.status === 'RUNNING' && (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    )}
                                    {execution.status}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>
                                    Started: {format(new Date(execution.startedAt), 'MMM d, yyyy HH:mm:ss')}
                                </span>
                                {execution.completedAt && (
                                    <span>
                                        Finished: {format(new Date(execution.completedAt), 'HH:mm:ss')}
                                    </span>
                                )}
                                <span>
                                    Duration: {formatDuration(execution.durationMs)}
                                </span>
                            </div>

                            {execution.meta && (execution.meta.symbol || execution.meta.broker) && (
                                <div className="flex items-center gap-2 mt-2">
                                    {execution.meta.symbol && (
                                        <Badge variant="secondary">{execution.meta.symbol}</Badge>
                                    )}
                                    {execution.meta.interval && (
                                        <Badge variant="outline">{execution.meta.interval}</Badge>
                                    )}
                                    {execution.meta.broker && (
                                        <Badge variant="outline" className="capitalize">
                                            {execution.meta.broker}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/workflows/${execution.workflowId}`)}
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Workflow
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleRerun}
                            disabled={isRunning}
                        >
                            {isRunning ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Play className="h-4 w-4 mr-1" />
                            )}
                            Re-run
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
