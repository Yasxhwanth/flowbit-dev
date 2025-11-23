import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: {
      credentialId: string;
    };
  }
  
  const Page = async ({ params: { credentialId } }: PageProps) => {
    await requireAuth();
    return (
      <div>
        <h1>Credential Detail Page</h1>
        <p>This is the detail page for credential ID: {credentialId}</p>
      </div>
    );
  };
  
  export default Page;
  