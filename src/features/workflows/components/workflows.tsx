"use client";

import {
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  LoadingView,
  ErrorView,
  EmptyView,
} from "@/components/entity-components";
import { Workflow as WorkflowIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Workflow } from "@prisma/client";
import { authClient } from "@/lib/auth-client";

import { useWorkflowsParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";
import { useWorkflows, useCreateWorkflow, useRemoveWorkflow } from "../hooks/use-workflows";
import { useUpgradeModal } from "../hooks/use-upgrade-modal";

// Search component for workflows
export const WorkflowsSearch = () => {
  const [params, setParams] = useWorkflowsParams();
  const { searchValue, onSearchChange } = useEntitySearch({
    params: { search: params.search, page: params.page },
    setParams,
  });
  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder="Search workflows"
    />
  );
};

// List component with loading and error handling
export const WorkflowsList = () => {
  // Prefetch using suspense hook; fallback to normal hook for client rendering
  const { data: workflows, isLoading, error } = useWorkflows();

  // Show loading view immediately while fetching
  if (isLoading && !workflows) {
    return <WorkflowsLoadingView />;
  }

  if (error) {
    return <WorkflowsErrorView />;
  }

  return (
    <EntityList
      items={workflows?.items ?? []}
      renderItem={(workflow) => <WorkflowItem data={workflow} />}
      getKey={(workflow) => workflow.id}
      emptyView={<WorkflowsEmptyView />}
    />
  );
};

export const WorkflowsHeader = ({ disabled }: { disabled?: boolean }) => {
  const createWorkflow = useCreateWorkflow();
  const { handleError, modal } = useUpgradeModal();
  const router = useRouter();
  const handleCreate = () => {
    createWorkflow.mutate(undefined, {
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`);
      },
      onError: (error) => {
        handleError(error);
      },
    });
  };
  return (
    <>
      {modal}
      <EntityHeader
        title="Workflows"
        description="Create and manage your workflows"
        newButtonLabel="New workflow"
        onNew={handleCreate}
        disabled={disabled}
        isCreating={createWorkflow.isPending}
      />
    </>
  );
};

export const WorkflowsPagination = () => {
  const { data: workflows, isFetching } = useWorkflows();
  const [params, setParams] = useWorkflowsParams();
  const [hasMounted, setHasMounted] = useState(false);

  // Avoid hydration mismatches by rendering after mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted || !workflows) return null;

  return (
    <EntityPagination
      disabled={isFetching}
      page={workflows.page}
      totalPages={workflows.totalPages}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const WorkflowsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <EntityContainer
      header={<WorkflowsHeader />}
      search={<WorkflowsSearch />}
      pagination={<WorkflowsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const WorkflowsLoadingView = () => {
  return <LoadingView entity="workflows" />;
};

export const WorkflowsErrorView = () => {
  return <ErrorView message="Failed to load workflows" />;
};

export const WorkflowsEmptyView = () => {
  const createWorkflow = useCreateWorkflow();
  const { handleError, modal } = useUpgradeModal();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleCreate = () => {
    createWorkflow.mutate(undefined, {
      onError: (error) => {
        handleError(error);
      },
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`);
      },
    });
  };

  return (
    <>
      {modal}
      <EmptyView
        onNew={handleCreate}
        message="You haven't created any workflows yet. Get started by creating a new workflow."
      />
      <div className="text-center text-xs text-muted-foreground mt-2">
        Debug: Logged in as {session?.user?.email} ({session?.user?.id})
      </div>
    </>
  );
};

export const WorkflowItem = ({ data }: { data: Workflow }) => {
  const removeWorkflow = useRemoveWorkflow();
  const handleRemove = () => {
    removeWorkflow.mutate({ id: data.id });
  };

  return (
    <EntityItem
      href={`/workflows/${data.id}`}
      title={data.name}
      subtitle={
        <>
          Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })}
          &bull; Created {formatDistanceToNow(data.createdAt, { addSuffix: true })}
        </>
      }
      image={
        <div className="size-8 flex items-center justify-center">
          <WorkflowIcon />
        </div>
      }
      onRemove={handleRemove}
      isRemoving={removeWorkflow.isPending}
    />
  );
};