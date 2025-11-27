"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import superjson from "superjson";
import { CredentialType } from "@prisma/client";
import { useCredentialsParams } from "./use-credentials-params";

/**
 * Fetch list of credentials (Suspense)
 *
 * ⚠️ Intended for SERVER components only. Do not use in client components
 * as it can cause infinite re-render / refetch loops.
 */
export const useSuspenseCredentials = () => {
  return trpc.credentials.getMany.useSuspenseQuery({});
};

/**
 * Fetch list of credentials in client components.
 *
 * Uses standard React Query semantics instead of Suspense to avoid
 * infinite refetch loops when used in client components.
 */
export const useCredentials = () => {
  const [params] = useCredentialsParams();

  return trpc.credentials.getMany.useQuery(params);
};

/**
 * Fetch a single credential (Suspense)
 *
 * Note: If your TRPC client/server is configured with SuperJSON, `data`
 * should already be deserialized. Return it directly.
 */
export const useSuspenseCredential = (credentialId: string) => {
  const [data] = trpc.credentials.getOne.useSuspenseQuery({ id: credentialId });

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

/**
 * Create credential
 */
export const useCreateCredential = () => {
  const utils = trpc.useUtils();

  return trpc.credentials.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Credential "${data.name}" created`);
      utils.credentials.getMany.invalidate();
      utils.credentials.getByType.invalidate({ type: data.type });
    },
    onError: (err: any) => {
      toast.error(`Failed to create credential: ${err.message}`);
    },
  });
};

/**
 * Update credential
 */
export const useUpdateCredential = () => {
  const utils = trpc.useUtils();

  return trpc.credentials.update.useMutation({
    onSuccess: (data) => {
      toast.success(`Credential "${data.name}" updated`);
      utils.credentials.getMany.invalidate();
      utils.credentials.getOne.invalidate({ id: data.id });
      utils.credentials.getByType.invalidate({ type: data.type });
    },
    onError: (err: any) => {
      toast.error(`Failed to update credential: ${err.message}`);
    },
  });
};

/**
 * Delete credential
 */
export const useRemoveCredential = () => {
  const utils = trpc.useUtils();

  return trpc.credentials.remove.useMutation({
    onSuccess: (data) => {
      toast.success(`Credential "${data.name}" removed`);
      utils.credentials.getMany.invalidate();
      utils.credentials.getOne.invalidate({ id: data.id });
    },
    onError: (err: any) => {
      toast.error(`Failed to delete credential: ${err.message}`);
    },
  });
};
