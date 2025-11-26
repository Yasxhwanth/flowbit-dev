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
import {
  useCreateWorkflow,
  useRemoveWorkflow,
  useWorkflows,
} from "../hooks/use-workflows";
import { useUpgradeModal } from "../hooks/use-upgrade-modal";
import { useRouter } from "next/navigation";
import { useWorkflowsParams } from "../hooks/use-workflows-params";
import { useEntitySearch } from "@/hooks/use-entity-search";
import type { Workflow } from "@/generated/prisma/client";
import { WorkflowIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

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

export const WorkflowsList = () => {
  const { data: workflows, isLoading, error } = useWorkflows();

  // Ensure server and client render the same initial HTML to avoid
  // hydration mismatches between the loading and empty states.
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <WorkflowsLoadingView />;
  }

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
  const createWorkflow=useCreateWorkflow();
  const {handleError,modal}=useUpgradeModal();
  const router = useRouter();
  const handleCreate=() => {
    createWorkflow.mutate(undefined,{
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`);
      },
      onError:(error) => {
       handleError(error);  
      }
    });
  }
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

  // Avoid hydration mismatches by only rendering pagination after mount
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


export const WorkflowsContainer = ({
  children
}: {
  children: React.ReactNode;
}) => {
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
  return (
    <LoadingView entity="workflows" />
  )
}
export const WorkflowsErrorView = () => {
  return (
    <ErrorView message="Failed to load workflows" />
  )
}

export const WorkflowsEmptyView = () => {
  const createWorkflow=useCreateWorkflow();
  const {handleError,modal}=useUpgradeModal();
  const router = useRouter();

  const handleCreate=() => {
    createWorkflow.mutate(undefined,{
      onError:(error) => {
       handleError(error);  
      },
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`);
      },
    });
  }
  return (
    <>
    {modal}

    <EmptyView
    onNew={handleCreate}
    message="You haven't created any workflows yet. Get started by creating a new workflow." />
    </>
  );

};
export const WorkflowItem = ({
  data,
}: {
  data: Workflow
}) => {
  const removeWorkflow=useRemoveWorkflow();
  const handleRemove=() => {
    removeWorkflow.mutate({id:data.id});
  }

  return (
    <EntityItem
      href={`/workflows/${data.id}`}
      title={data.name}
      subtitle={
        <>
          Updated  {formatDistanceToNow(data.updatedAt,{addSuffix:true})} {""}
          &bull; Created {""}
          {formatDistanceToNow(data.createdAt,{addSuffix:true})}
        </>
      }
      image={
        <div className="size-8 flex items-center justify-center">
          <WorkflowIcon/>
        </div>
      }
      onRemove={handleRemove}
      isRemoving={removeWorkflow.isPending}
    />
  );
};