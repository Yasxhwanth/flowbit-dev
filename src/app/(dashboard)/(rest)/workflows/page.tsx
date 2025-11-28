import { WorkflowsContainer, WorkflowsList } from '@/features/workflows/components/workflows';
import { prefetchWorkflows } from '@/features/workflows/server/prefetch';
import { requireAuth } from '@/lib/auth-utils';
import { HydrateClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import { SearchParams } from 'nuqs/server';
import { workflowsParamsLoader } from '@/features/workflows/server/params-loader';
import { WorkflowsLoadingView, WorkflowsErrorView } from '@/features/workflows/components/workflows';

type Props = {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  await requireAuth();
  const params = await workflowsParamsLoader(searchParams);
  const safeParams = {
    ...params,
    page: Number(params.page) || 1,
    pageSize: Number(params.pageSize) || 5,
    search: params.search || "",
  };
  prefetchWorkflows(safeParams);
  return (
    <WorkflowsContainer>
      <HydrateClient>
        <ErrorBoundary fallback={<WorkflowsErrorView />}>
          <Suspense fallback={<WorkflowsLoadingView />}>
            <WorkflowsList
            />
          </Suspense>
        </ErrorBoundary>
      </HydrateClient>
    </WorkflowsContainer>
  );
};

export default Page;