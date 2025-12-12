import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import prisma from "@/lib/db";
import { saveWorkflowVersion } from "./save-version";
import { NodeType } from "@prisma/client";

export const workflowVersionRouter = createTRPCRouter({
    getVersions: protectedProcedure
        .input(z.object({ workflowId: z.string() }))
        .query(async ({ input, ctx }) => {
            return prisma.workflowVersion.findMany({
                where: {
                    workflowId: input.workflowId,
                    workflow: { userId: ctx.auth.user.id },
                },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    createdAt: true,
                    comment: true,
                    // Don't fetch nodes/edges for list view to save bandwidth
                },
            });
        }),

    getVersion: protectedProcedure
        .input(z.object({ versionId: z.string() }))
        .query(async ({ input, ctx }) => {
            const version = await prisma.workflowVersion.findUniqueOrThrow({
                where: { id: input.versionId },
                include: { workflow: true },
            });

            if (version.workflow.userId !== ctx.auth.user.id) {
                throw new Error("Unauthorized");
            }

            return version;
        }),

    restoreVersion: protectedProcedure
        .input(z.object({ versionId: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const version = await prisma.workflowVersion.findUniqueOrThrow({
                where: { id: input.versionId },
                include: { workflow: true },
            });

            if (version.workflow.userId !== ctx.auth.user.id) {
                throw new Error("Unauthorized");
            }

            // 1. Update workflow with version data
            // We need to delete existing nodes/edges and recreate them
            // Similar to update workflow logic

            const nodes = version.nodes as any[];
            const edges = version.edges as any[];

            await prisma.$transaction(async (tx) => {
                // Delete existing
                await tx.node.deleteMany({ where: { workflowId: version.workflowId } });
                await tx.connection.deleteMany({ where: { workflowId: version.workflowId } });

                // Create new nodes
                if (nodes.length > 0) {
                    await tx.node.createMany({
                        data: nodes.map((node) => ({
                            id: node.id,
                            workflowId: version.workflowId,
                            name: node.type || "unknown",
                            type: (node.type as NodeType) ?? NodeType.INITIAL,
                            data: {
                                ...(node.data || {}),
                                position: node.position,
                            },
                        })),
                    });
                }

                // Create new edges
                if (edges.length > 0) {
                    await tx.connection.createMany({
                        data: edges.map((edge) => ({
                            fromNodeId: edge.source,
                            toNodeId: edge.target,
                            workflowId: version.workflowId,
                            fromOutput: edge.sourceHandle || "main",
                            toInput: edge.targetHandle || "main",
                        })),
                    });
                }

                // Update workflow timestamp
                await tx.workflow.update({
                    where: { id: version.workflowId },
                    data: { updatedAt: new Date() },
                });
            });

            // 2. Create a new version marking the restore
            await saveWorkflowVersion(
                version.workflowId,
                nodes,
                edges,
                `Restored from version ${new Date(version.createdAt).toLocaleString()}`
            );

            return { success: true };
        }),
});
