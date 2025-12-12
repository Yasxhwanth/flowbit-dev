/**
 * Backtest Save API
 * POST /api/backtest/save
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, workflow, params, result } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }
        if (!workflow) {
            return NextResponse.json({ error: 'workflow is required' }, { status: 400 });
        }
        if (!result) {
            return NextResponse.json({ error: 'result is required' }, { status: 400 });
        }

        const backtestRun = await prisma.backtestRun.create({
            data: {
                userId,
                workflowJson: workflow,
                params: params || {},
                result,
            },
        });

        console.log(`[Backtest] Saved backtest run: ${backtestRun.id}`);

        return NextResponse.json({ id: backtestRun.id });
    } catch (error) {
        console.error('[Backtest] Save error:', error);
        const message = error instanceof Error ? error.message : 'Failed to save backtest';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
