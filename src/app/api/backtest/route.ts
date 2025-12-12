/**
 * Backtest API Route
 * POST /api/backtest
 */

import { NextRequest, NextResponse } from 'next/server';
import { runBacktest } from '@/lib/backtest';
import prisma from '@/lib/db';
import type { BacktestRequest } from '@/lib/backtest/types';
import type { BrokerName } from '@/lib/broker/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const { workflow, symbol, broker, interval, from, to, initialCapital, userId } = body;

        if (!workflow) {
            return NextResponse.json({ error: 'workflow is required' }, { status: 400 });
        }
        if (!symbol) {
            return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
        }
        if (!broker) {
            return NextResponse.json({ error: 'broker is required' }, { status: 400 });
        }
        if (!interval) {
            return NextResponse.json({ error: 'interval is required' }, { status: 400 });
        }
        if (!from || !to) {
            return NextResponse.json({ error: 'from and to timestamps are required' }, { status: 400 });
        }
        if (!initialCapital || initialCapital <= 0) {
            return NextResponse.json({ error: 'initialCapital must be positive' }, { status: 400 });
        }

        const backtestRequest: BacktestRequest = {
            workflow,
            symbol,
            broker: broker as BrokerName,
            interval,
            from: Number(from),
            to: Number(to),
            initialCapital: Number(initialCapital),
            securityId: body.securityId,
            exchangeSegment: body.exchangeSegment,
            creds: body.creds,
        };

        console.log(`[API] Running backtest for ${symbol}`);

        const result = await runBacktest(backtestRequest);

        // Save to database if userId provided
        let backtestId: string | undefined;
        if (userId) {
            const backtestRun = await prisma.backtestRun.create({
                data: {
                    userId,
                    workflowJson: workflow as object,
                    params: {
                        symbol,
                        broker,
                        interval,
                        from: Number(from),
                        to: Number(to),
                        initialCapital: Number(initialCapital),
                        securityId: body.securityId,
                        exchangeSegment: body.exchangeSegment,
                    },
                    result: JSON.parse(JSON.stringify(result)),
                },
            });
            backtestId = backtestRun.id;
            console.log(`[API] Saved backtest: ${backtestId}`);
        }

        return NextResponse.json({
            backtestId,
            result,
        });
    } catch (error) {
        console.error('[API] Backtest error:', error);

        const message = error instanceof Error ? error.message : 'Backtest failed';

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
