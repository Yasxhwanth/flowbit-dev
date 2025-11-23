import { requireAuth } from "@/lib/auth-utils";

const Page=async() => {
    await requireAuth();
    return (
        <div>
            <h1>Credentials Page</h1>
            <p>This is the credentials page under the dashboard.</p>
        </div>
    );
}
export default Page;