import { requireAuth } from "@/lib/auth-utils";

const Page = async() => {
    await requireAuth();
    return (
        <div>
            <h1>Executions Page</h1>
            <p>This is the executions page under the dashboard.</p>
        </div>
    );
}
export default Page;