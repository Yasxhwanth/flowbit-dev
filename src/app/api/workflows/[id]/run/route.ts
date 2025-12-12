/**
 * POST /api/workflows/[id]/run
 * Trigger a workflow run manually
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { inngest } from '@/inngest/client';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify workflow belongs to user
        const workflow = await prisma.workflow.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
            include: { nodes: true, connections: true },
        });

        if (!workflow) {
            return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        // Trigger execution via Inngest
        const eventId = `manual_${id}_${Date.now()}`;

        await inngest.send({
            name: 'workflow/execute',
            data: {
                workflowId: id,
                userId: session.user.id,
                trigger: 'manual',
            },
            id: eventId,
        });

        // Create execution record
        const execution = await prisma.execution.create({
            data: {
                workflowId: id,
                status: 'RUNNING',
                inngestEventId: eventId,
            },
        });

        return NextResponse.json({
            success: true,
            executionId: execution.id,
            message: 'Workflow execution started',
        });
    } catch (error) {
        console.error('Failed to run workflow:', error);
        return NextResponse.json(
            { error: 'Failed to run workflow' },
            { status: 500 }
        );
    }
}
