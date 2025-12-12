import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const CorrectionSchema = z.object({
    corrected: z.string(),
    explanation: z.string(),
});

export async function attemptAICorrection(text: string, availableIndicators: string[]): Promise<string | null> {
    try {
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

        const result = await generateObject({
            model: google("gemini-2.0-flash-exp"),
            schema: CorrectionSchema,
            prompt,
        });

        return result.object.corrected;
    } catch (error) {
        console.error("AI Correction Error:", error);
        return null;
    }
}
