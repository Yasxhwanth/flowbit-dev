/**
 * Scheduled Workflow Run API Route
 * Vercel cron endpoint for running active workflows
 */

import { NextResponse } from 'next/server';
import { runScheduled } from '@/lib/scheduler';

/**
 * GET /api/run-scheduled
 * Run all active workflows on schedule
 * 
 * This endpoint is designed to be called by Vercel Cron.
 * Add to vercel.json:
 * {
 *   "crons": [{ "path": "/api/run-scheduled", "schedule": "* /1 * * * *" }]
 * }
 */
export async function GET(request: Request) {
    try {
        // Verify cron secret in production (optional but recommended)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }

        // Run all scheduled workflows
        const result = await runScheduled();

        return NextResponse.json(result);
    } catch (error) {
        console.error('Scheduled run failed:', error);

        return NextResponse.json(
            {
                error: 'Scheduled run failed',
                code: 'SCHEDULER_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
