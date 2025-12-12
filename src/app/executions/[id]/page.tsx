'use client';

/**
 * Execution Log Viewer Page
 * Shows detailed execution logs for a workflow run
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2, FileText } from 'lucide-react';
import { ExecutionHeader, ExecutionTimeline } from '@/components/executions';

interface ExecutionLog {
    nodeId: string;
    nodeName: string;
    type: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    startedAt?: string;
    finishedAt?: string;
    durationMs?: number;
    input?: unknown;
    output?: unknown;
    error?: {
        message: string;
        code?: string;
        details?: unknown;
    };
}

interface ExecutionData {
    id: string;
    workflowId: string;
    workflowName: string;
    startedAt: string;
    completedAt: string | null;
    status: 'RUNNING' | 'SUCCESS' | 'FAILED';
    durationMs: number | null;
    error: string | null;
    logs: ExecutionLog[];
    meta?: {
        symbol?: string;
        broker?: string;
        interval?: string;
    };
}

export default function ExecutionViewerPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const [execution, setExecution] = useState<ExecutionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const executionId = params.id as string;
    const highlightNodeId = searchParams.get('highlight') || undefined;

    useEffect(() => {
        async function fetchExecution() {
            try {
                const res = await fetch(`/api/executions/${executionId}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('Execution not found');
                    } else if (res.status === 403) {
                        setError('Access denied');
                    } else {
                        setError('Failed to load execution');
                    }
                    return;
                }
                const data = await res.json();
                setExecution(data);
            } catch {
                setError('Failed to load execution');
            } finally {
                setLoading(false);
            }
        }

        if (executionId) {
            fetchExecution();
        }
    }, [executionId]);

    if (loading) {
        return (
            <div className="container py-12 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Loading execution logs...</p>
            </div>
        );
    }

    if (error || !execution) {
        return (
            <div className="container py-12 flex flex-col items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">{error || 'Execution not found'}</p>
            </div>
        );
    }

    return (
        <div className="container py-6 space-y-6">
            <ExecutionHeader execution={execution} />

            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Execution Timeline
                </h2>
                <ExecutionTimeline logs={execution.logs} highlightNodeId={highlightNodeId} />
            </div>

            {execution.error && (
                <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5">
                    <h3 className="font-medium text-red-500 mb-2">Execution Error</h3>
                    <p className="text-sm">{execution.error}</p>
                </div>
            )}
        </div>
    );
}
