'use client';

/**
 * WorkflowTable Component
 * Displays workflows with execution status and enable/disable toggle
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {
    Play,
    MoreVertical,
    FileText,
    Edit,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
    enabled?: boolean;
}

interface WorkflowTableProps {
    workflows: WorkflowItem[];
    onRefresh: () => void;
}

const statusBadges = {
    RUNNING: <Badge variant="outline" className="bg-blue-500/10 text-blue-500">Running</Badge>,
    SUCCESS: <Badge variant="outline" className="bg-green-500/10 text-green-500">Success</Badge>,
    FAILED: <Badge variant="outline" className="bg-red-500/10 text-red-500">Failed</Badge>,
};

export function WorkflowTable({ workflows, onRefresh }: WorkflowTableProps) {
    const router = useRouter();
    const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

    async function handleToggle(id: string, currentEnabled: boolean) {
        setTogglingIds((prev) => new Set(prev).add(id));

        try {
            const res = await fetch(`/api/workflows/${id}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !currentEnabled }),
            });
            if (!res.ok) throw new Error('Failed to toggle');

            onRefresh();
        } catch (error) {
            console.error('Toggle failed:', error);
        } finally {
            setTogglingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }

    async function handleRunNow(id: string) {
        setRunningIds((prev) => new Set(prev).add(id));

        try {
            const res = await fetch(`/api/workflows/${id}/run`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to run');

            setTimeout(() => {
                onRefresh();
                setRunningIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }, 2000);
        } catch (error) {
            console.error('Run failed:', error);
            setRunningIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }

    if (workflows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                <p>No workflows found</p>
                <Button className="mt-4" onClick={() => router.push('/strategy/new')}>
                    Create Strategy
                </Button>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Active</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {workflows.map((wf) => {
                    const isRunning = runningIds.has(wf.id) || wf.lastExecution?.status === 'RUNNING';
                    const isToggling = togglingIds.has(wf.id);
                    const enabled = wf.enabled ?? true;

                    return (
                        <TableRow key={wf.id} className={!enabled ? 'opacity-50' : ''}>
                            <TableCell>
                                <Switch
                                    checked={enabled}
                                    onCheckedChange={() => handleToggle(wf.id, enabled)}
                                    disabled={isToggling}
                                />
                            </TableCell>
                            <TableCell>
                                <div>
                                    <div className="font-medium">{wf.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {wf.nodeCount} nodes
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {wf.symbol ? (
                                    <div className="flex flex-col">
                                        <span className="font-mono">{wf.symbol}</span>
                                        {wf.interval && (
                                            <span className="text-xs text-muted-foreground">{wf.interval}</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {wf.broker ? (
                                    <Badge variant="secondary" className="capitalize">
                                        {wf.broker}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {wf.lastExecution ? (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-sm">
                                            {formatDistanceToNow(new Date(wf.lastExecution.startedAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-sm">Never</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {!enabled ? (
                                    <Badge variant="outline" className="bg-gray-500/10 text-gray-500">Disabled</Badge>
                                ) : isRunning ? (
                                    statusBadges.RUNNING
                                ) : wf.lastExecution ? (
                                    statusBadges[wf.lastExecution.status]
                                ) : (
                                    <Badge variant="outline">Not run</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRunNow(wf.id)}
                                        disabled={isRunning}
                                    >
                                        {isRunning ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/workflows/${wf.id}`)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Workflow
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push(`/executions?workflow=${wf.id}`)}>
                                                <FileText className="h-4 w-4 mr-2" />
                                                View Logs
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
