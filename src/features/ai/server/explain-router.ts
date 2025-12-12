import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import prisma from "@/lib/db";

// Schema for the AI output
const ExplanationSchema = z.object({
    explanation: z.string(),
    breakdown: z.array(z.string()),
    tradeReasons: z.record(z.string(), z.string()),
});

export const explainRouter = createTRPCRouter({
    explainExecution: protectedProcedure
        .input(
            z.object({
                executionId: z.string(),
                workflowName: z.string(),
                nodes: z.array(z.any()),
                edges: z.array(z.any()),
                trades: z.array(z.any()),
                logs: z.array(z.any()).optional(),
            })
        )
        .query(async ({ input }) => {
            // 1. Check cache
            const cached = await prisma.executionExplanation.findUnique({
                where: { executionId: input.executionId },
            });

            if (cached) {
                return cached.explanation as unknown as z.infer<typeof ExplanationSchema>;
            }

            // 2. Build prompt
            const prompt = `
You are an expert algorithmic trading analyst. Your job is to explain why the algorithm triggered specific trades using the node graph and trade data. Use clear, concise language.

Workflow Name: ${input.workflowName}

Nodes:
${JSON.stringify(input.nodes.map(n => ({ id: n.id, type: n.type, data: n.data })))}

Trades Executed:
${JSON.stringify(input.trades)}

Logs (Context):
${JSON.stringify(input.logs?.slice(0, 50) || [])} 

Explain the trading execution in human terms.
- Provide a high-level summary of the strategy's performance and logic.
- Break down the key events.
- For each trade, explain EXACTLY why it was taken based on the conditions (e.g. "RSI was 25 which is < 30").
`;

            // 3. Call AI
            const result = await generateObject({
                model: google("gemini-2.0-flash-exp"),
                schema: ExplanationSchema,
                prompt,
            });

            const explanation = result.object;

            // 4. Cache result
            await prisma.executionExplanation.create({
                data: {
                    executionId: input.executionId,
                    explanation: explanation as any,
                },
            });

            return explanation;
        }),
});
