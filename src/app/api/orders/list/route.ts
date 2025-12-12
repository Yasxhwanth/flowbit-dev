/**
 * GET /api/orders/list
 * List all orders from workflow executions
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

        // Fetch all executions for user's workflows
        const executions = await prisma.execution.findMany({
            where: {
                workflow: {
                    userId: session.user.id,
                },
            },
            include: {
                workflow: {
                    select: {
                        id: true,
                        name: true,
                        nodes: true,
                    },
                },
            },
            orderBy: { startedAt: 'desc' },
        });

        // Extract orders from execution outputs
        const orders: Array<{
            id: string;
            workflowId: string;
            workflowName: string;
            executionId: string;
            timestamp: string;
            side: string;
            quantity: number;
            price: number;
            broker: string;
            status: string;
            symbol: string;
        }> = [];

        for (const exec of executions) {
            const output = exec.output as Record<string, unknown> | null;
            const logs = (output?.logs as Array<Record<string, unknown>>) || [];

            // Find order nodes in logs
            const orderLogs = logs.filter((log) => log.type === 'order');

            for (const orderLog of orderLogs) {
                const orderOutput = orderLog.output as Record<string, unknown> | undefined;
                if (orderOutput?.orderId) {
                    // Extract candles node for symbol/broker
                    const candlesNode = exec.workflow.nodes.find((n) =>
                        (n.data as Record<string, unknown>)?.symbol
                    );
                    const candlesData = candlesNode?.data as Record<string, unknown> | undefined;

                    orders.push({
                        id: String(orderOutput.orderId),
                        workflowId: exec.workflow.id,
                        workflowName: exec.workflow.name,
                        executionId: exec.id,
                        timestamp: exec.startedAt.toISOString(),
                        side: String(orderOutput.side || 'BUY'),
                        quantity: Number(orderOutput.quantity || 0),
                        price: Number(orderOutput.price || 0),
                        broker: String(candlesData?.broker || 'unknown'),
                        status: String(orderOutput.status || 'SIMULATED'),
                        symbol: String(candlesData?.symbol || 'UNKNOWN'),
                    });
                }
            }
        }

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Failed to list orders:', error);
        return NextResponse.json(
            { error: 'Failed to list orders' },
            { status: 500 }
        );
    }
}
