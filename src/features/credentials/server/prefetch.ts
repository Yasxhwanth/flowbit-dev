import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch } from "@/trpc/server";
import { trpc } from "@/trpc/server";


type Input = inferInput<typeof trpc.credentials.getMany>;

/**
 * Prefetch all credentials
 */
export const prefetchCredentials = async (params: Input) => {
  await prefetch(trpc.credentials.getMany.queryOptions(params));
};

/**
 * Prefetch a single credential
 */
export const prefetchCredential = (id: string) => {
  return prefetch(trpc.credentials.getOne.queryOptions({ id }));
};
