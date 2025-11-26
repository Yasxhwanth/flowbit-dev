import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch } from "@/trpc/server";
import { trpc } from "@/trpc/server";


type Input = inferInput<typeof trpc.executions.getMany>;

/**
 * Prefetch all credentials
 */
export const prefetchExecutions = async (params: Input) => {
  await prefetch(trpc.executions.getMany.queryOptions(params));
};

/**
 * Prefetch a single credential
 */
export const prefetchExecution = (id: string) => {
  return prefetch(trpc.executions.getOne.queryOptions({ id }));
};
