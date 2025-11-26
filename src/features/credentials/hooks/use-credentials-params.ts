import { useQueryStates } from "nuqs";
import { credentialsParams } from "../params";

/**
 * Hook for binding credentials query params to the URL using nuqs.
 * Return type is inferred from useQueryStates; keep usage simple in components.
 */
export const useCredentialsParams = () => {
  return useQueryStates(credentialsParams);
};
