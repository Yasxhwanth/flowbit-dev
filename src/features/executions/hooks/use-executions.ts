"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import superjson from "superjson";
import { CredentialType } from "@prisma/client";
import { useExecutionParams } from "./use-executions-params";

/**
 * Fetch list of credentials (Suspense)
 *
 * ⚠️ Intended for SERVER components only. Do not use in client components
 * as it can cause infinite re-render / refetch loops.
 */
export const useSuspenseExecutions= () => {
  return trpc.executions.getMany.useSuspenseQuery({});
};

/**
 * Fetch list of credentials in client components.
 *
 * Uses standard React Query semantics instead of Suspense to avoid
 * infinite refetch loops when used in client components.
 */
export const useExecution= () => {
  const [params] = useExecutionParams();

  return trpc.executions.getMany.useQuery(params);
};

/**
 * Fetch a single credential (Suspense)
 *
 * Note: If your TRPC client/server is configured with SuperJSON, `data`
 * should already be deserialized. Return it directly.
 */
export const useSuspenseExecution = (credentialId: string) => {
  const [data] = trpc.executions.getOne.useSuspenseQuery({ id: credentialId });

  // If you still need to handle custom serialized payloads, you could
  // add conditional deserialization here. But prefer global SuperJSON.
  return data;
};

/**
 * Fetch credentials filtered by type
 * (OpenAI / Discord / Gemini / Stripe / etc.)
 */
export const useCredentialsByType = (type: CredentialType) =>
  trpc.credentials.getByType.useQuery({ type });





