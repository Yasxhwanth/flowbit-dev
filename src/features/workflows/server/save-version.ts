import prisma from "@/lib/db";

export async function saveWorkflowVersion(
    workflowId: string,
    nodes: any,
    edges: any,
    comment?: string
) {
    try {
        await prisma.workflowVersion.create({
            data: {
                workflowId,
                nodes,
                edges,
                comment,
            },
        });
    } catch (error) {
        console.error("Failed to save workflow version:", error);
        // Don't throw, versioning failure shouldn't block main save
    }
}
