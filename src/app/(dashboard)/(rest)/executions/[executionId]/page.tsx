import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: {
      executionId: string;
    };
  }
  
  const Page = async({ params: { executionId } }: PageProps) => {
    await requireAuth();
    return (
      <div>
        <h1>execution Detail Page</h1>
        <p>This is the detail page for execution ID: {executionId}</p>
      </div>
    );
  };
  
  export default Page;