'use client';

/**
 * ExecutionTimeline Component
 * Vertical timeline of node executions
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, CandlestickChart, Activity, GitCompare, ArrowUpDown, Bell, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { JsonViewer } from './JsonViewer';

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

interface ExecutionTimelineProps {
    logs: ExecutionLog[];
    highlightNodeId?: string;
}

const nodeIcons: Record<string, React.ReactNode> = {
    candles: <CandlestickChart className="h-4 w-4" />,
    indicators: <Activity className="h-4 w-4" />,
    condition: <GitCompare className="h-4 w-4" />,
    order: <ArrowUpDown className="h-4 w-4" />,
    notify: <Bell className="h-4 w-4" />,
};

const statusIcons: Record<string, React.ReactNode> = {
    SUCCESS: <CheckCircle className="h-4 w-4 text-green-500" />,
    FAILED: <XCircle className="h-4 w-4 text-red-500" />,
    SKIPPED: <Clock className="h-4 w-4 text-yellow-500" />,
};

const statusStyles: Record<string, string> = {
    SUCCESS: 'border-green-500/30 bg-green-500/5',
    FAILED: 'border-red-500/30 bg-red-500/5',
    SKIPPED: 'border-yellow-500/30 bg-yellow-500/5',
};

export function ExecutionTimeline({ logs, highlightNodeId }: ExecutionTimelineProps) {
    const [expanded, setExpanded] = useState<Set<string>>(() => {
        return highlightNodeId ? new Set([highlightNodeId]) : new Set();
    });

    function toggleExpand(nodeId: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    }

    if (logs.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                    <p>No execution logs available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {logs.map((log, index) => {
                const isExpanded = expanded.has(log.nodeId);
                const icon = nodeIcons[log.type] || <Activity className="h-4 w-4" />;

                return (
                    <div key={log.nodeId + index} className="relative">
                        {index < logs.length - 1 && (
                            <div className="absolute left-6 top-12 bottom-0 w-px bg-border" />
                        )}

                        <Card className={`${statusStyles[log.status] || ''} transition-all`}>
                            <CardContent className="p-0">
                                <div
                                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50"
                                    onClick={() => toggleExpand(log.nodeId)}
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                        {icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium truncate">{log.nodeName}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {log.type}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {log.nodeId}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {log.durationMs !== undefined && (
                                            <span className="text-xs text-muted-foreground">
                                                {log.durationMs}ms
                                            </span>
                                        )}
                                        {statusIcons[log.status]}
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 border-t pt-3">
                                        {log.input !== undefined && (
                                            <JsonViewer data={log.input} title="Input" />
                                        )}
                                        {log.output !== undefined && (
                                            <JsonViewer data={log.output} title="Output" />
                                        )}
                                        {log.error && (
                                            <div className="border border-red-500/30 rounded-lg p-3 bg-red-500/5">
                                                <div className="flex items-center gap-2 text-red-500 font-medium">
                                                    <XCircle className="h-4 w-4" />
                                                    <span>Error</span>
                                                </div>
                                                <p className="text-sm mt-2">{String(log.error.message)}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}
