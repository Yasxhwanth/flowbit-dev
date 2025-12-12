import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { NodeType } from "@prisma/client";
import dagre from "dagre";
import { explainRouter } from "./explain-router";
import { conditionRouter } from "./condition-router";

// Schema for the AI output
const WorkflowGraphSchema = z.object({
    nodes: z.array(
        z.object({
            id: z.string(),
            type: z.nativeEnum(NodeType).or(z.string()), // Allow string for flexibility, but prefer enum
            data: z.record(z.string(), z.any()),
            label: z.string().optional(), // Helper for AI to describe the node
        })
    ),
    edges: z.array(
        z.object({
            id: z.string(),
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().optional(),
            targetHandle: z.string().optional(),
        })
    ),
    explanation: z.string().optional(),
});

export const aiRouter = createTRPCRouter({
    explain: explainRouter,
    condition: conditionRouter,

    buildStrategy: protectedProcedure
        .input(z.object({ text: z.string() }))
        .mutation(async ({ input }) => {
            const prompt = `
You are an expert algorithmic trading system architect. Your goal is to convert natural language strategy descriptions into a structured node-based workflow graph for the "Flowbit" trading platform.

The available Node Types are:
- CANDLES: Fetches market data. Data: { symbol: string, interval: string (e.g., "1m", "5m", "1h", "1d") }
- INDICATOR: Calculates technical indicators. Data: { indicator: string (e.g., "rsi", "sma", "ema", "macd"), params: object, source: string (nodeId of input data) }
- CONDITION: Evaluates logic. Data: { expression: string (e.g., "RSI < 30", "SMA_50 > SMA_200"), inputs: string[] (nodeIds) }
- ORDER: Executes trades. Data: { side: "BUY" | "SELL", type: "MARKET" | "LIMIT", quantity: number }
- NOTIFY: Sends alerts. Data: { message: string }
- MANUAL_TRIGGER: Starts the workflow manually.

Rules:
1. Always start with a CANDLES node (or MANUAL_TRIGGER if specified).
2. Connect nodes logically: Candles -> Indicators -> Condition -> Order.
3. Use unique IDs for nodes (e.g., "node-1", "node-2").
4. Ensure edges connect valid source and target IDs.
5. Extract parameters like symbol, interval, and indicator settings from the text. If missing, use sensible defaults (e.g., symbol: "BTC/USDT", interval: "1h").
6. The "expression" in CONDITION nodes should be a simple JavaScript-like boolean expression using variable names that match the indicator outputs or IDs.

User Strategy Description:
"${input.text}"

Generate the JSON structure for the workflow graph.
`;

            const result = await generateObject({
                model: openai("gpt-4o"),
                schema: WorkflowGraphSchema,
                prompt,
            });

            const graph = result.object;

            // Auto-layout using dagre
            const g = new dagre.graphlib.Graph();
            g.setGraph({ rankdir: "LR" });
            g.setDefaultEdgeLabel(() => ({}));

            graph.nodes.forEach((node) => {
                g.setNode(node.id, { width: 150, height: 50 }); // Estimate size
            });

            graph.edges.forEach((edge) => {
                g.setEdge(edge.source, edge.target);
            });

            dagre.layout(g);

            const layoutNodes = graph.nodes.map((node) => {
                const nodeWithPos = g.node(node.id);
                return {
                    ...node,
                    position: {
                        x: nodeWithPos.x - 75, // Center anchor
                        y: nodeWithPos.y - 25,
                    },
                    // Ensure type is valid for our system
                    type: mapAiTypeToSystemType(node.type),
                };
            });

            return {
                nodes: layoutNodes,
                edges: graph.edges,
                explanation: graph.explanation || "Strategy generated successfully.",
            };
        }),
});

function mapAiTypeToSystemType(type: string): NodeType {
    const normalized = type.toUpperCase();
    if (normalized.includes("CANDLE")) return NodeType.INITIAL;
    if (normalized.includes("TRIGGER")) return NodeType.MANUAL_TRIGGER;
    // Map others to HTTP_REQUEST as placeholder if specific types don't exist
    // Ideally we should update schema to include CANDLES, INDICATOR, etc.
    return NodeType.INITIAL;
}
