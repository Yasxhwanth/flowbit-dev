import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { format } from "date-fns";
import { RotateCcw, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VersionHistoryPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workflowId: string;
    onRestore: () => void;
}

export function VersionHistoryPanel({
    open,
    onOpenChange,
    workflowId,
    onRestore,
}: VersionHistoryPanelProps) {
    const { data: versions, isLoading, refetch } = trpc.workflowVersion.getVersions.useQuery(
        { workflowId },
        { enabled: open }
    );

    const restoreMutation = trpc.workflowVersion.restoreVersion.useMutation({
        onSuccess: () => {
            toast.success("Workflow restored successfully");
            onRestore();
            onOpenChange(false);
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to restore version: ${error.message}`);
        },
    });

    const handleRestore = (versionId: string) => {
        if (confirm("Are you sure you want to restore this version? Current unsaved changes might be lost.")) {
            restoreMutation.mutate({ versionId });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Version History</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : versions?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No versions saved yet.
                        </div>
                    ) : (
                        <div className="space-y-4 pr-4">
                            {versions?.map((version) => (
                                <div
                                    key={version.id}
                                    className="flex flex-col gap-2 rounded-lg border p-3 text-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-medium">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            {format(new Date(version.createdAt), "MMM d, yyyy HH:mm")}
                                        </div>
                                    </div>
                                    {version.comment && (
                                        <p className="text-muted-foreground">{version.comment}</p>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-2"
                                        onClick={() => handleRestore(version.id)}
                                        disabled={restoreMutation.isPending}
                                    >
                                        <RotateCcw className="mr-2 h-3 w-3" />
                                        Restore
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
