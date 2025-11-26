import { requireAuth } from "@/lib/auth-utils";
import { executionParamsLoader } from "@/features/executions/server/params-loader";
import { prefetchExecutions } from "@/features/executions/server/prefetch";
import { HydrateClient } from "@/trpc/server";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { SearchParams } from "nuqs";
import {
  ExecutionsContainer,
  ExecutionsList,
  ExecutionsLoadingView,
  ExecutionsErrorView,
} from "@/features/executions/components/executions";

type Props = {
  searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams }: Props) => {
  await requireAuth();

  const params = await executionParamsLoader(searchParams);
  await prefetchExecutions(params);

  return (
    <ExecutionsContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<ExecutionsErrorView />}>
          <Suspense fallback={<ExecutionsLoadingView />}>
            <ExecutionsList />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </ExecutionsContainer>
  );
};

export default Page;