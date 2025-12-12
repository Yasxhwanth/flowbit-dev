import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

// Schema for the AI output
const CorrectionSchema = z.object({
    corrected: z.string(),
    explanation: z.string(),
});

export const conditionRouter = createTRPCRouter({
    correctCondition: protectedProcedure
        .input(
            z.object({
                text: z.string(),
                availableIndicators: z.array(z.string()),
                nodeContext: z.any().optional(),
                broker: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const { text, availableIndicators } = input;

            // 1. Basic local validation (optimization)
            // If it's already valid or empty, we might skip AI, but for now we trust the caller
            if (!text.trim()) {
                return { corrected: "", explanation: "Empty condition" };
            }

            // 2. Build prompt
            const prompt = `
You are an expert algorithmic trading parser. Your job is to correct invalid or ambiguous strategy conditions and convert them into Flowbit's expression format.

Condition: "${text}"

Available indicators:
${JSON.stringify(availableIndicators)}

Rules:
- Valid operators: >, <, >=, <=, ==, !=, AND, OR
- You may rewrite text into these operators (e.g., "crosses above" -> ">").
- Use ONLY the provided available indicators. Match them exactly.
- If the condition implies a comparison but is incomplete (e.g., "RSI >"), infer a sensible default if possible (e.g., "RSI > 50") or return as is if ambiguous.
- Output strictly JSON.

If the condition is valid already, return it unchanged.
`;

            // 3. Call AI
            const result = await generateObject({
                model: google("gemini-2.0-flash-exp"),
                schema: CorrectionSchema,
                prompt,
            });

            return result.object;
        }),
});
