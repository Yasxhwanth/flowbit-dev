/**
 * PATCH /api/workflows/[id]/settings
 * Update workflow-level settings
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Verify workflow belongs to user
        const workflow = await prisma.workflow.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!workflow) {
            return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        // Extract allowed fields
        const {
            name,
            description,
            enabled,
            defaultBroker,
            defaultSymbol,
            defaultInterval,
            cron,
        } = body;

        // Build update object with only provided fields
        const updateData: Record<string, unknown> = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (enabled !== undefined) updateData.enabled = enabled;
        if (defaultBroker !== undefined) updateData.defaultBroker = defaultBroker;
        if (defaultSymbol !== undefined) updateData.defaultSymbol = defaultSymbol;
        if (defaultInterval !== undefined) updateData.defaultInterval = defaultInterval;
        if (cron !== undefined) updateData.cron = cron;

        // Update workflow
        const updated = await prisma.workflow.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            workflow: updated,
        });
    } catch (error) {
        console.error('Failed to update workflow settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
