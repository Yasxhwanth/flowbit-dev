"use client";

import {
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  ErrorView,
  LoadingView,
  EmptyView,
} from "@/components/entity-components";
import { useExecution } from "../hooks/use-executions";
import { useExecutionParams } from "../hooks/use-executions-params";
import { useEntitySearch } from "@/hooks/use-entity-search";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

export const ExecutionsSearch = () => {
  const [params, setParams] = useExecutionParams();
  const { searchValue, onSearchChange } = useEntitySearch({
    params: { search: "", page: params.page },
    setParams,
  });

  // For now executions are not searchable on the backend, but we keep
  // the search input for future extension.

  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder="Search executions (coming soon)"
    />
  );
};

export const ExecutionsList = () => {
  const { data, isLoading, error } = useExecution();

  // Ensure server and client render the same initial HTML to avoid
  // hydration mismatches between the loading and empty states.
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <ExecutionsLoadingView />;
  }

  if (isLoading && !data) {
    return <ExecutionsLoadingView />;
  }

  if (error) {
    return <ExecutionsErrorView />;
  }

  return (
    <EntityList
      items={data?.items ?? []}
      renderItem={(execution) => (
        <ExecutionItem key={execution.id} data={execution} />
      )}
      getKey={(execution) => execution.id}
      emptyView={<ExecutionsEmptyView />}
    />
  );
};

export const ExecutionsHeader = () => {
  return (
    <EntityHeader
      title="Executions"
      description="Recent workflow runs and their status."
      newButtonLabel=""
    />
  );
};

export const ExecutionsPagination = () => {
  const { data, isFetching } = useExecution();
  const [params, setParams] = useExecutionParams();
  const [hasMounted, setHasMounted] = useState(false);

  // Avoid hydration mismatches by only rendering pagination after mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || !data) return null;

  return (
    <EntityPagination
      disabled={isFetching}
      page={data.page}
      totalPages={data.totalPages}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const ExecutionsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<ExecutionsHeader />}
      search={<ExecutionsSearch />}
      pagination={<ExecutionsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const ExecutionsLoadingView = () => {
  return <LoadingView entity="executions" />;
};

export const ExecutionsErrorView = () => {
  return <ErrorView message="Failed to load executions" />;
};

export const ExecutionsEmptyView = () => {
  return (
    <EmptyView message="No executions yet. Run a workflow to see executions here." />
  );
};

export const ExecutionItem = ({ data }: { data: any }) => {
  const createdAgo = data.startedAt
    ? formatDistanceToNow(new Date(data.startedAt), { addSuffix: true })
    : "Unknown";

  const statusColor =
    data.status === "FAILED"
      ? "text-destructive"
      : data.status === "COMPLETED"
      ? "text-emerald-500"
      : "text-muted-foreground";

  const title =
    data.status === "FAILED"
      ? "Failed"
      : data.status === "COMPLETED"
      ? "Completed"
      : "Running";

  return (
    <EntityItem
      href={`/executions/${data.id}`}
      title={title}
      subtitle={
        <div className="flex flex-col gap-1 text-xs">
          <div>
            Workflow{" "}
            <span className="font-medium">
              {data.workflow?.name ?? "Unknown workflow"}
            </span>
          </div>
          <div className="flex gap-4">
            <span>
              Started {createdAgo}
            </span>
            <span className={statusColor}>Status: {data.status}</span>
          </div>
          {data.error && (
            <div className="mt-1 rounded-md bg-destructive/10 px-3 py-2 text-destructive">
              <div className="font-medium text-xs">Error</div>
              <div className="text-[11px]">{data.error}</div>
            </div>
          )}
        </div>
      }
    />
  );
};


