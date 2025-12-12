/**
 * GET /api/workflows/list
 * List all workflows for current user with execution info
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workflows = await prisma.workflow.findMany({
            where: { userId: session.user.id },
            include: {
                nodes: true,
                executions: {
                    orderBy: { startedAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Transform to include extracted metadata
        const result = workflows.map((wf) => {
            const lastExecution = wf.executions[0] || null;

            // Extract candles node data for symbol/broker/interval
            const candlesNode = wf.nodes.find((n) =>
                n.type === 'INITIAL' && (n.data as Record<string, unknown>)?.symbol
            );
            const candlesData = candlesNode?.data as Record<string, unknown> | undefined;

            return {
                id: wf.id,
                name: wf.name,
                createdAt: wf.createdAt,
                updatedAt: wf.updatedAt,
                symbol: candlesData?.symbol || null,
                interval: candlesData?.interval || null,
                broker: candlesData?.broker || null,
                nodeCount: wf.nodes.length,
                lastExecution: lastExecution ? {
                    id: lastExecution.id,
                    status: lastExecution.status,
                    startedAt: lastExecution.startedAt,
                    completedAt: lastExecution.completedAt,
                    error: lastExecution.error,
                } : null,
            };
        });

        return NextResponse.json({ workflows: result });
    } catch (error) {
        console.error('Failed to list workflows:', error);
        return NextResponse.json(
            { error: 'Failed to list workflows' },
            { status: 500 }
        );
    }
}
