/**
 * Backtest Fetch API
 * GET /api/backtest/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const backtestRun = await prisma.backtestRun.findUnique({
            where: { id },
        });

        if (!backtestRun) {
            return NextResponse.json({ error: 'Backtest not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: backtestRun.id,
            userId: backtestRun.userId,
            createdAt: backtestRun.createdAt,
            workflowJson: backtestRun.workflowJson,
            params: backtestRun.params,
            result: backtestRun.result,
        });
    } catch (error) {
        console.error('[Backtest] Fetch error:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch backtest';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
