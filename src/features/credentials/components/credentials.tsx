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
  useRemoveCredential,
  useCredentials,
} from "../hooks/use-credentials";

import { useCredentialsParams } from "../hooks/use-credentials-params";
import { useEntitySearch } from "@/hooks/use-entity-search";

import { useRouter } from "next/navigation";

// Import type from existing enums file (safe for client components)
import { CredentialType } from "@/generated/prisma/enums";
export { CredentialType } from "@/generated/prisma/enums";

// Define Credential type locally to avoid importing Prisma Client
export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  createdAt: Date;
  updatedAt: Date;
}

import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

/* -------------------------------------------------------------------------- */
/*                              SEARCH COMPONENT                              */
/* -------------------------------------------------------------------------- */

export const CredentialsSearch = () => {
  const [params, setParams] = useCredentialsParams();

  const { searchValue, onSearchChange } = useEntitySearch({
    params: {
      search: params.search,
      page: params.page,
    },
    setParams,
  });

  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder="Search credentials"
    />
  );
};

/* -------------------------------------------------------------------------- */
/*                               LIST COMPONENT                               */
/* -------------------------------------------------------------------------- */

export const CredentialsList = () => {
  const { data: credentials, isLoading, error } = useCredentials();

  if (isLoading && !credentials) {
    return <CredentialsLoadingView />;
  }

  if (error) {
    return <CredentialsErrorView />;
  }

  return (
    <EntityList
      items={credentials?.items ?? []}
      renderItem={(credential) => <CredentialItem data={credential} />}
      getKey={(credential) => credential.id}
      emptyView={<CredentialsEmptyView />}
    />
  );
};

/* -------------------------------------------------------------------------- */
/*                              HEADER COMPONENT                              */
/* -------------------------------------------------------------------------- */

export const CredentialsHeader = ({ disabled }: { disabled?: boolean }) => {
  return (
    <EntityHeader
      title="Credentials"
      description="Create and manage your stored credentials"
      newButtonLabel="New Credential"
      newButtonHref="/credentials/new"
      disabled={disabled}
    />
  );
};

/* -------------------------------------------------------------------------- */
/*                           PAGINATION COMPONENT                             */
/* -------------------------------------------------------------------------- */

export const CredentialsPagination = () => {
  const { data: credentials, isFetching } = useCredentials();
  const [params, setParams] = useCredentialsParams();

  if (!credentials) {
    return null;
  }

  return (
    <EntityPagination
      disabled={isFetching}
      page={credentials.page}
      totalPages={credentials.totalPages}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

/* -------------------------------------------------------------------------- */
/*                           MAIN CONTAINER WRAPPER                            */
/* -------------------------------------------------------------------------- */

export const CredentialsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<CredentialsHeader />}
      search={<CredentialsSearch />}
      pagination={<CredentialsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

/* -------------------------------------------------------------------------- */
/*                             LOADING + ERROR VIEW                            */
/* -------------------------------------------------------------------------- */

export const CredentialsLoadingView = () => (
  <LoadingView entity="Credentials" />
);

export const CredentialsErrorView = () => (
  <ErrorView message="Failed to load credentials" />
);

/* -------------------------------------------------------------------------- */
/*                              EMPTY VIEW                                    */
/* -------------------------------------------------------------------------- */

export const CredentialsEmptyView = () => {
  const router = useRouter();

  const handleCreate = () => {
    router.push("/credentials/new");
  };

  return (
    <EmptyView
      onNew={handleCreate}
      message="You haven't created any credentials yet. Create one to get started."
    />
  );
};

/* -------------------------------------------------------------------------- */
/*                               ITEM COMPONENT                               */
/* -------------------------------------------------------------------------- */
const credentialLogos: Record<CredentialType, string> = {
  [CredentialType.OPENAI]: "/openai.svg",
  [CredentialType.ANTHROPIC]: "/anthropic.svg",
  [CredentialType.GEMINI]: "/gemini.svg",
};

export const CredentialItem = ({ data }: { data: Credential }) => {
  const removeCredential = useRemoveCredential();

  const handleRemove = () => removeCredential.mutate({ id: data.id });

  const logo = credentialLogos[data.type] || "/openai.svg";

  return (
    <EntityItem
      href={`/credentials/${data.id}`}
      title={data.name}
      subtitle={
        <>
          Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })} •
          Created {formatDistanceToNow(data.createdAt, { addSuffix: true })}
        </>
      }
      image={
        <div className="size-8 flex items-center justify-center">
          <Image
            src={logo}
            alt={data.type}
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
      }
      onRemove={handleRemove}
      isRemoving={removeCredential.isPending}
    />
  );
};