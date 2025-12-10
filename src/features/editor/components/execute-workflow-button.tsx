import { Button } from "@/components/ui/button";
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows";
import { FlaskConicalIcon } from "lucide-react";

export const ExecuteWorkflowButton = ({
    workflowId,
    isDirty,
}: {
    workflowId: string;
    isDirty: boolean;
}) => {
    const executeWorkflow = useExecuteWorkflow();
    const handleExecute = () => {
        executeWorkflow.mutate({ id: workflowId });
    };



    return (
        <Button
            size="lg"
            onClick={handleExecute}
            disabled={executeWorkflow.isPending || isDirty}
            title={isDirty ? "Save workflow to execute" : "Execute workflow"}
        >
            <FlaskConicalIcon className="size-4" />
            Execute workflow
        </Button>
    );
};