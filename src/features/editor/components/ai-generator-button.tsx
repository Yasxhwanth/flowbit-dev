"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export const AIGeneratorButton = ({ workflowId }: { workflowId: string }) => {
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const generateMutation = trpc.workflows.generateWithAi.useMutation();

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        try {
            await generateMutation.mutateAsync({
                workflowId,
                prompt,
            });
            toast.success("Workflow generated successfully!");
            setOpen(false);
            setPrompt("");
            // Reload to fetch the new workflow layout
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || "Failed to generate workflow");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" title="Generate with AI">
                    <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                    AI Generate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generate Workflow with AI</DialogTitle>
                    <DialogDescription>
                        Describe what you want to automate, and AI will create the workflow for you.
                        Warning: This will overwrite your current unsaved canvas.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., When an HTTP request occurs, check a condition. If true, send a Discord message."
                        className="min-h-[100px]"
                        disabled={generateMutation.isPending}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={generateMutation.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={generateMutation.isPending || !prompt.trim()}>
                        {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
