import { parseAsInteger } from "nuqs/server";
import { PAGINATION } from "@/config/constants";

/**
 * Query params for credentials listing (URL / query-state).
 * Keep parsing/ defaults here; stricter validation enforced in TRPC router.
 */
export const executionParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
};

export type CredentialsParams = typeof executionParams;
