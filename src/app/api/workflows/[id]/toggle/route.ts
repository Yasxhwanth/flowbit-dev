/**
 * POST /api/workflows/[id]/toggle
 * Toggle workflow enabled state
 * 
 * NOTE: Requires `enabled Boolean @default(true)` field in Workflow model
 * Run: npx prisma db push
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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
        const body = await request.json();
        const { enabled } = body;

        if (typeof enabled !== 'boolean') {
            return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
        }

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

        // Update enabled state
        // NOTE: This will fail if `enabled` field doesn't exist in schema
        // Add to schema: enabled Boolean @default(true)
        const updated = await prisma.workflow.update({
            where: { id },
            data: { enabled } as Record<string, unknown>,
        });

        return NextResponse.json({
            success: true,
            workflow: {
                id: updated.id,
                name: updated.name,
                enabled: (updated as unknown as { enabled?: boolean }).enabled ?? true,
            },
        });
    } catch (error) {
        console.error('Failed to toggle workflow:', error);
        return NextResponse.json(
            { error: 'Failed to toggle workflow. Ensure enabled field exists in schema.' },
            { status: 500 }
        );
    }
}
