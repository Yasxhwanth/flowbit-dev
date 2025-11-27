import prisma from "@/lib/db";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { CredentialType } from "@prisma/client";

export const credentialsRouter = createTRPCRouter({

  // -----------------------------
  // CREATE CREDENTIAL
  // -----------------------------
  create: premiumProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        type: z.enum(CredentialType),
        value: z.string().min(1, "Value is required"),
      })
    )
    .mutation(({ ctx, input }) => {
      return prisma.credential.create({
        data: {
          name: input.name,
          type: input.type,
          value: input.value,
          userId: ctx.auth.user.id,
        },
      });
    }),

  // -----------------------------
  // DELETE CREDENTIAL
  // -----------------------------
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Ensure the credential exists and belongs to the user first
      const credential = await prisma.credential.findFirstOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
      });

      // Delete by ID (now safe because we ensured ownership)
      return prisma.credential.delete({
        where: { id: credential.id },
      });
    }),

  // -----------------------------
  // UPDATE CREDENTIAL
  // -----------------------------
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
        type: z.enum(CredentialType),
        value: z.string().min(1, "Value is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure credential belongs to the current user
      await prisma.credential.findFirstOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
      });

      // Update by ID (ownership already verified)
      return prisma.credential.update({
        where: { id: input.id },
        data: {
          name: input.name,
          type: input.type,
          value: input.value,
        },
      });
    }),

  // -----------------------------
  // GET ONE CREDENTIAL
  // -----------------------------
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return prisma.credential.findFirstOrThrow({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
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
        search: z.string().trim().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;

      const where = {
        userId: ctx.auth.user.id,
        name: { contains: search, mode: "insensitive" as const },
      };

      const [items, totalCount] = await Promise.all([
        prisma.credential.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where,
          orderBy: { createdAt: "desc" },
        }),

        prisma.credential.count({ where }),
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

  // -----------------------------
  // GET BY TYPE
  // -----------------------------
  getByType: protectedProcedure
    .input(
      z.object({
        type: z.enum(CredentialType),
      })
    )
    .query(async ({ ctx, input }) => {
      return prisma.credential.findMany({
        where: {
          userId: ctx.auth.user.id,
          type: input.type,
        },
        orderBy: { updatedAt: "desc" },
      });
    }),
});


