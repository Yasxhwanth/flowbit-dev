import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { polarClient } from "@/lib/polar";
import superjson from "superjson";

export async function createTRPCContext(opts?: { req?: Request }) {
  const req = opts?.req;

  console.log("🔍 createTRPCContext called");
  console.log("📦 Has req?", !!req);
  console.log("🍪 Cookies:", req?.headers.get("cookie"));

  let session = null;

  if (req) {
    session = await auth.api.getSession({ headers: req.headers });
  } else {
    try {
      const serverHeaders = await headers();
      session = await auth.api.getSession({ headers: serverHeaders });
    } catch (error) {
      console.warn("⚠️ Unable to read headers in createTRPCContext:", error);
    }
  }

  console.log("👤 Session found?", !!session);
  console.log("👤 User:", session?.user?.email || "None");

  return {
    session,
    req,
  };
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;

export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {
  console.log("🔒 protectedProcedure check - has session?", !!ctx.session);
  
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  return next({
    ctx: {
      ...ctx,
      auth: ctx.session,
    },
  });
});

export const premiumProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const customer = await polarClient.customers.getStateExternal({
      externalId: ctx.auth.user.id,
    });

    if (
      !customer.activeSubscriptions ||
      customer.activeSubscriptions.length === 0
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Active subscription required",
      });
    }

    return next({
      ctx: {
        ...ctx,
        customer,
      },
    });
  }
);