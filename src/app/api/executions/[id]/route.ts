/**
 * GET /api/executions/[id]
 * Get execution details with logs
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const execution = await prisma.execution.findUnique({
            where: { id },
            include: {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        userId: true,
                        nodes: true,
                    },
                },
            },
        });

        if (!execution) {
            return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
        }

        // Security: Only workflow owner can access
        if (execution.workflow.userId !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Parse output to get logs
        const output = execution.output as Record<string, unknown> | null;
        const logs = (output?.logs as Array<Record<string, unknown>>) || [];

        // Extract metadata from candles node
        const candlesNode = execution.workflow.nodes.find((n) =>
            (n.data as Record<string, unknown>)?.symbol
        );
        const candlesData = candlesNode?.data as Record<string, unknown> | undefined;

        // Calculate duration
        const durationMs = execution.completedAt
            ? new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()
            : null;

        return NextResponse.json({
            id: execution.id,
            workflowId: execution.workflow.id,
            workflowName: execution.workflow.name,
            startedAt: execution.startedAt,
            completedAt: execution.completedAt,
            status: execution.status,
            durationMs,
            error: execution.error,
            errorStack: execution.errorStack,
            logs,
            meta: {
                userId: execution.workflow.userId,
                broker: candlesData?.broker || null,
                symbol: candlesData?.symbol || null,
                interval: candlesData?.interval || null,
            },
        });
    } catch (error) {
        console.error('Failed to fetch execution:', error);
        return NextResponse.json(
            { error: 'Failed to fetch execution' },
            { status: 500 }
        );
    }
}
