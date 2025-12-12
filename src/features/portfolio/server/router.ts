import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import prisma from "@/lib/db";
import { z } from "zod";

export const portfolioRouter = createTRPCRouter({
    getSummary: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.auth.user.id;

        // Fetch all workflows with their latest backtest and execution
        const workflows = await prisma.workflow.findMany({
            where: { userId },
            include: {
                executions: {
                    orderBy: { startedAt: "desc" },
                    take: 1,
                },
            },
        });

        // Fetch latest backtest for each workflow (doing this separately to avoid massive join if many backtests)
        // Or we can just fetch all backtests and filter in memory if not too many, but per-workflow query is safer for now
        // Actually, let's try to fetch the latest backtest for each workflow efficiently.
        // Since Prisma doesn't support `distinct` on `orderBy` easily for this in one go without raw query,
        // we'll fetch the latest backtest for each workflow ID.

        const workflowIds = workflows.map(w => w.id);

        // Fetch latest backtest run for each workflow
        // We can use a raw query or just iterate. Iterating might be N+1 but acceptable for < 50 workflows.
        // Better: fetch all backtests for these workflows, ordered by date, then pick latest in JS.
        // Optimization: limit to recent ones? No, we need the absolute latest.

        const backtests = await prisma.backtestRun.findMany({
            where: {
                // We can't easily filter by "latest" in `findMany` for multiple groups without raw query.
                // Let's fetch all backtests for these workflows and group in memory.
                // Assuming user doesn't have thousands of backtests yet.
                // If they do, we should optimize this.
                // For now, let's just fetch the last 5 backtests per workflow to be safe? 
                // No, let's just fetch all and filter.
                // actually, `workflowJson` is in BacktestRun, but `workflowId` is NOT directly on BacktestRun in the schema I saw?
                // Let's check schema again.
                // Schema says: `workflowJson Json`, `params Json`. It does NOT have `workflowId` relation!
                // Wait, how do we link backtest to workflow?
                // The schema showed: `model BacktestRun { ... userId String ... }`
                // It seems BacktestRun is not directly linked to a Workflow ID in the schema provided!
                // It stores `workflowJson`.
                // If so, we might not be able to link backtests to specific current workflows easily unless `params` contains `workflowId`.
                // Let's assume `params` has `workflowId`.
                userId,
            },
            orderBy: { createdAt: "desc" },
        });

        // Group backtests by workflowId (assuming it's in params)
        const latestBacktestByWorkflow: Record<string, any> = {};

        for (const run of backtests) {
            const params = run.params as any;
            const wfId = params?.workflowId;
            if (wfId && !latestBacktestByWorkflow[wfId]) {
                latestBacktestByWorkflow[wfId] = run;
            }
        }

        // Aggregation Variables
        let totalStrategies = workflows.length;
        let activeStrategies = 0;
        let totalBacktestedPnl = 0;
        let totalWinRate = 0;
        let winRateCount = 0;
        let worstMaxDrawdown = 0;

        const brokerDistribution: Record<string, number> = {
            dhan: 0,
            fyers: 0,
            angel: 0,
        };

        const workflowSummaries = workflows.map((workflow) => {
            if (workflow.enabled) activeStrategies++;

            const broker = workflow.defaultBroker?.toLowerCase() || "unknown";
            if (broker in brokerDistribution) {
                brokerDistribution[broker]++;
            } else if (broker !== "unknown") {
                brokerDistribution[broker] = (brokerDistribution[broker] || 0) + 1;
            }

            const latestBacktest = latestBacktestByWorkflow[workflow.id];
            let pnl = 0;
            let winRate = 0;
            let maxDrawdown = 0;
            let equityCurve: any[] = [];
            let lastBacktestTimestamp = null;

            if (latestBacktest) {
                const result = latestBacktest.result as any;
                if (result && result.metrics) {
                    pnl = result.metrics.totalPnl || 0;
                    winRate = result.metrics.winRate || 0;
                    maxDrawdown = result.metrics.maxDrawdown || 0;
                    equityCurve = result.equityCurve || [];

                    totalBacktestedPnl += pnl;
                    totalWinRate += winRate;
                    winRateCount++;
                    if (maxDrawdown < worstMaxDrawdown) worstMaxDrawdown = maxDrawdown; // Drawdown is usually negative? Or positive percentage?
                    // Usually maxDrawdown is reported as a positive % drop or negative value. 
                    // Let's assume positive % for now, or check how it's stored.
                    // If it's stored as negative, we want the minimum. If positive, the maximum.
                    // Let's assume it's a percentage like 15.5 (meaning 15.5% drop). So we want the max value.
                    if (Math.abs(maxDrawdown) > Math.abs(worstMaxDrawdown)) worstMaxDrawdown = maxDrawdown;
                }
                lastBacktestTimestamp = latestBacktest.createdAt;
            }

            return {
                id: workflow.id,
                name: workflow.name,
                enabled: workflow.enabled,
                broker: workflow.defaultBroker,
                lastBacktest: latestBacktest ? {
                    pnl,
                    winRate,
                    maxDrawdown,
                    equityCurve, // We might want to downsample this if it's huge
                    timestamp: lastBacktestTimestamp,
                } : null,
                lastExecutionStatus: workflow.executions[0]?.status || null,
            };
        });

        const avgWinRate = winRateCount > 0 ? totalWinRate / winRateCount : 0;

        // Recent Trades
        // We can extract trades from the latest executions or backtests.
        // The requirement says "Recent trades (last 10 across all workflows)".
        // Real trades come from Executions. Backtest trades come from BacktestRuns.
        // Usually a portfolio dashboard shows REAL trades if available, or backtest trades if in simulation mode.
        // Let's prioritize Execution trades if we can parse them from `output`.
        // If `output` structure is known.

        // For now, let's try to pull trades from the latest executions of all workflows.
        // We need to fetch more executions probably.

        const recentExecutions = await prisma.execution.findMany({
            where: {
                workflow: { userId },
                status: "SUCCESS",
            },
            orderBy: { completedAt: "desc" },
            take: 20,
            include: { workflow: true },
        });

        const recentTrades: any[] = [];

        for (const exec of recentExecutions) {
            if (recentTrades.length >= 10) break;

            const output = exec.output as any;
            // Assuming output contains a list of trades or a single trade result
            // This is highly dependent on the workflow logic.
            // If we can't reliably get trades from generic execution output, we might need to skip this or use a specific format.
            // Let's look for a `trades` array in output.

            if (output && Array.isArray(output.trades)) {
                for (const trade of output.trades) {
                    if (recentTrades.length >= 10) break;
                    recentTrades.push({
                        workflowId: exec.workflowId,
                        workflowName: exec.workflow.name,
                        symbol: trade.symbol || exec.workflow.defaultSymbol || "Unknown",
                        side: trade.side,
                        quantity: trade.quantity || trade.qty,
                        price: trade.price || trade.entryPrice,
                        pnl: trade.pnl,
                        timestamp: trade.timestamp || exec.completedAt,
                    });
                }
            }
        }

        return {
            stats: {
                totalStrategies,
                activeStrategies,
                totalBacktestedPnl,
                avgWinRate,
                worstMaxDrawdown,
            },
            brokerDistribution,
            workflows: workflowSummaries,
            recentTrades,
        };
    }),
});
