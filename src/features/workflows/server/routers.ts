import { generateSlug } from "random-word-slugs";
import prisma from "@/lib/db";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { NodeType } from "@prisma/client";
import type { Node, Edge } from "@xyflow/react";
import { inngest } from "@/inngest/client";
import { sendWorkflowExecution } from "@/inngest/utils";

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
          })
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await prisma.$transaction(async (tx) => {
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
          where: { id: input.id },
          data: { updatedAt: new Date() },
        });

        return { success: true };
      });
    }),

  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: { id: input.id, userId: ctx.auth.user.id },
        data: { name: input.name },
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

      return { id: workflow.id, name: workflow.name, nodes, edges };
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
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      console.log("🔍 getMany input:", input);
      console.log("👤 getMany user:", ctx.auth.user.id);

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
