import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { PAGINATION } from "@/config/constants";


export const executionsRouter = createTRPCRouter({
  // -----------------------------
  // GET ONE CREDENTIAL
  // -----------------------------
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return prisma.execution.findFirstOrThrow({
        where: {
          id: input.id,
          workflow: { userId: ctx.auth.user.id },
        },
        include: {
          workflow: {
            include: {
              nodes: true,
              connections: true,
            },
          },
        },
      });
    }),

  // -----------------------------
  // LIST / PAGINATION
  // -----------------------------
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.DEFAULT_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, } = input;

      const where = {
        userId: ctx.auth.user.id,
      };

      const [items, totalCount] = await Promise.all([
        prisma.execution.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            workflow: {
              userId: ctx.auth.user.id,
            }
          },
          orderBy: { startedAt: "desc" },
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),

        prisma.execution.count({
          where: {
            workflow: {
              userId: ctx.auth.user.id,
            },
          }
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    }),

});


