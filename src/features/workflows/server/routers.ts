import { generateSlug } from "random-word-slugs";
import prisma from "@/lib/db";
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { NodeType } from "@prisma/client";
import type { Node, Edge } from "@xyflow/react";
import { inngest } from "@/inngest/client";
import { sendWorkflowExecution } from "@/inngest/utils";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { autoLayout } from "@/lib/workflow/layout";

export const workflowsRouter = createTRPCRouter({
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });

      await sendWorkflowExecution({
        workflowId: input.id,
      });

      return workflow;
    }),
  create: protectedProcedure.mutation(({ ctx }) => {
    return prisma.workflow.create({
      data: {
        name: generateSlug(3),
        userId: ctx.auth.user.id,
        nodes: {
          create: {
            type: NodeType.INITIAL,
            name: NodeType.INITIAL,
            data: {
              position: { x: 0, y: 0 },
            },
          },
        },
      },
    });
  }),

  generateWithAi: protectedProcedure
    .input(z.object({ prompt: z.string(), workflowId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prompt, workflowId } = input;

      const nodeSchema = z.object({
        id: z.string().describe("Unique identifier for the node. E.g. 'node-1'"),
        type: z.enum([
          "INITIAL", "MANUAL_TRIGGER", "HTTP_REQUEST", "GOOGLE_FORM_TRIGGER", "STRIPE_TRIGGER",
          "ANTHROPIC", "GEMINI", "OPENAI", "DISCORD", "SLACK",
          "CONDITION", "CANDLES", "INDICATORS", "ORDER", "NOTIFY"
        ]).describe("The type of the node. Start with a trigger node (INITIAL, MANUAL_TRIGGER, etc)."),
        data: z.record(z.string(), z.any()).describe("Configuration data for the node depending on its type."),
      });

      const edgeSchema = z.object({
        source: z.string().describe("The ID of the source node connecting from"),
        target: z.string().describe("The ID of the target node connecting to"),
        sourceHandle: z.string().optional().describe("Output handle name, often 'main' unless CONDITION branch ('true' or 'false')"),
        targetHandle: z.string().optional().describe("Input handle name, usually 'main'"),
      });

      const { object } = await generateObject({
        model: google("gemini-1.5-pro"),
        temperature: 0.1,
        schema: z.object({
          nodes: z.array(nodeSchema).min(1).describe("The sequence of workflow nodes. Maximum 15 nodes."),
          edges: z.array(edgeSchema).describe("The edges connecting the workflow nodes. Must form a DAG."),
        }),
        prompt: `Create an automated workflow architecture based on this user request: "${prompt}".
        
        Available Node Types and usage:
        - INITIAL / MANUAL_TRIGGER: Used to manually start the workflow.
        - HTTP_REQUEST: Makes external API calls. Needs endpoint, method.
        - GOOGLE_FORM_TRIGGER: Triggers on new auth'd form submissions.
        - STRIPE_TRIGGER: Listens to Stripe events.
        - ANTHROPIC / GEMINI / OPENAI: Connects to LLMs for text processing or generation. Usually needs a 'prompt' data field.
        - DISCORD / SLACK: Notification nodes for messaging. Needs 'message', 'webhookUrl' (Discord) or 'channel' (Slack).
        - CONDITION: Branches workflow logic based on simple rules. Has 'true' and 'false' output handles.
        - CANDLES / INDICATORS / ORDER: Financial/trading nodes.
        - NOTIFY: Internal/general notification.

        Rules:
        1. Keep the workflow relatively simple.
        2. Format it as a Directed Acyclic Graph.
        3. Every node must have an ID.
        4. Make sure edges reference the exact node IDs.
        5. Provide a sensible starting trigger (usually MANUAL_TRIGGER if none is clearly specified).`
      });

      // Apply auto-layout
      const { nodes: layoutNodes, edges: layoutEdges } = autoLayout(
        object.nodes.map(n => ({ id: n.id, type: n.type, data: n.data, width: 250, height: 100 })),
        object.edges
      );

      // Verify workflow ownership
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId, userId: ctx.auth.user.id }
      });

      if (!workflow) {
        throw new Error("Workflow not found or access denied");
      }

      return await prisma.$transaction(async (tx) => {
        // Clear existing nodes and connections
        await tx.node.deleteMany({ where: { workflowId } });
        await tx.connection.deleteMany({ where: { workflowId } });

        // Create new ones from AI
        await tx.node.createMany({
          data: layoutNodes.map(node => ({
            id: node.id,
            workflowId,
            name: node.type || "unknown",
            type: (node.type as NodeType) ?? NodeType.INITIAL,
            data: {
              ...(node.data || {}),
              position: (node as any).position || { x: 0, y: 0 }
            }
          }))
        });

        if (layoutEdges.length > 0) {
          await tx.connection.createMany({
            data: layoutEdges.map(edge => ({
              fromNodeId: edge.source,
              toNodeId: edge.target,
              workflowId,
              fromOutput: (edge.sourceHandle as string) || "main",
              toInput: (edge.targetHandle as string) || "main",
            }))
          });
        }

        const updated = await tx.workflow.update({
          where: { id: workflowId },
          data: { updatedAt: new Date() },
          include: { nodes: true, connections: true }
        });

        return updated;
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.delete({
        where: { id: input.id, userId: ctx.auth.user.id },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string().nullish(),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.any()).optional(),
          }),
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await prisma.$transaction(async (tx) => {
        // Verify workflow ownership before updating
        const workflow = await tx.workflow.findUnique({
          where: { id: input.id, userId: ctx.auth.user.id },
        });

        if (!workflow) {
          throw new Error("Workflow not found or access denied");
        }

        await tx.node.deleteMany({ where: { workflowId: input.id } });

        await tx.node.createMany({
          data: input.nodes.map((node) => ({
            id: node.id,
            workflowId: input.id,
            name: node.type || "unknown",
            type: (node.type as NodeType) ?? NodeType.INITIAL,
            data: {
              ...(node.data || {}),
              position: node.position,
            },
          })),
        });

        await tx.connection.deleteMany({ where: { workflowId: input.id } });

        await tx.connection.createMany({
          data: input.edges.map((edge) => ({
            fromNodeId: edge.source,
            toNodeId: edge.target,
            workflowId: input.id,
            fromOutput: edge.sourceHandle || "main",
            toInput: edge.targetHandle || "main",
          })),
        });

        await tx.workflow.update({
          where: { id: input.id, userId: ctx.auth.user.id },
          data: { updatedAt: new Date() },
        });

        // Save version
        // We need to import saveWorkflowVersion.
        // Since we are inside a transaction, we should probably pass the tx or just call it after?
        // `saveWorkflowVersion` uses `prisma` global. It's fine to call it after, or inside if it doesn't conflict.
        // But `saveWorkflowVersion` creates a `WorkflowVersion`.
        // Let's just call it here.
        // Wait, I need to import it first.

        return { success: true };
      });

      // Save version after successful update
      // We need the nodes and edges from input.
      const { saveWorkflowVersion } = await import("./save-version");
      await saveWorkflowVersion(
        input.id,
        input.nodes,
        input.edges,
        "Manual Save",
      );

      return { success: true };
    }),

  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: { id: input.id, userId: ctx.auth.user.id },
        data: { name: input.name },
      });
    }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        enabled: z.boolean().optional(),
        cron: z.string().optional(),
        defaultBroker: z.string().optional(),
        defaultSymbol: z.string().optional(),
        defaultInterval: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return prisma.workflow.update({
        where: { id, userId: ctx.auth.user.id },
        data,
      });
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        include: { nodes: true, connections: true },
      });

      const nodes: Node[] = workflow.nodes.map((node) => {
        const rawData = (node.data as Record<string, unknown>) || {};
        const { position, ...restData } = rawData as {
          position?: { x: number; y: number };
        } & Record<string, unknown>;

        return {
          id: node.id,
          type: node.type as Node["type"],
          position: position ?? { x: 0, y: 0 },
          data: restData,
        };
      });

      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput ?? undefined,
        targetHandle: connection.toInput ?? undefined,
      }));

      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        enabled: workflow.enabled,
        defaultBroker: workflow.defaultBroker,
        defaultSymbol: workflow.defaultSymbol,
        defaultInterval: workflow.defaultInterval,
        cron: workflow.cron,
        tags: workflow.tags,
        nodes,
        edges,
      };
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.DEFAULT_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      const fs = await import("fs");
      const logMsg = `[${new Date().toISOString()}] getMany - User: ${ctx.auth.user.id}, Search: "${search}", Page: ${page}\n`;
      fs.appendFileSync("debug-log.txt", logMsg);

      const [items, totalCount] = await Promise.all([
        prisma.workflow.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            userId: ctx.auth.user.id,
            name: { contains: search || "", mode: "insensitive" },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.workflow.count({
          where: {
            userId: ctx.auth.user.id,
            name: { contains: search || "", mode: "insensitive" },
          },
        }),
      ]);

      fs.appendFileSync(
        "debug-log.txt",
        `[${new Date().toISOString()}] Found ${items.length} items, Total: ${totalCount}\n`,
      );

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    }),
});
