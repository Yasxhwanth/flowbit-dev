"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function AiStrategyBuilderPage() {
    const router = useRouter();
    const [strategyText, setStrategyText] = useState("");
    const [generatedWorkflow, setGeneratedWorkflow] = useState<any>(null);

    const buildStrategyMutation = trpc.ai.buildStrategy.useMutation({
        onSuccess: (data) => {
            setGeneratedWorkflow(data);
            toast.success("Strategy generated successfully!");
        },
        onError: (error) => {
            toast.error(`Failed to generate strategy: ${error.message}`);
        },
    });

    const createWorkflowMutation = trpc.workflows.create.useMutation();
    const updateWorkflowMutation = trpc.workflows.update.useMutation();

    const handleGenerate = () => {
        if (!strategyText.trim()) {
            toast.error("Please enter a strategy description");
            return;
        }
        buildStrategyMutation.mutate({ text: strategyText });
    };

    const handleOpenInEditor = async () => {
        if (!generatedWorkflow) return;

        try {
            toast.loading("Creating workflow...");

            // 1. Create a new empty workflow
            const workflow = await createWorkflowMutation.mutateAsync();

            // 2. Update it with the generated graph
            await updateWorkflowMutation.mutateAsync({
                id: workflow.id,
                nodes: generatedWorkflow.nodes,
                edges: generatedWorkflow.edges,
            });

            toast.success("Workflow created! Redirecting...");
            router.push(`/workflows/${workflow.id}`);
        } catch (error: any) {
            toast.error(`Failed to create workflow: ${error.message}`);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="flex flex-col gap-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
                        <Sparkles className="h-8 w-8 text-primary" />
                        AI Strategy Builder
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Describe your trading strategy in plain English, and we'll build the workflow for you.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Strategy Description</CardTitle>
                        <CardDescription>
                            Be as specific as possible about indicators, conditions, and order details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="Example: Buy when RSI(14) crosses below 30 and sell when it crosses above 70. Use 1h candles on BTC/USDT."
                            className="min-h-[150px] text-lg p-4"
                            value={strategyText}
                            onChange={(e) => setStrategyText(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button
                                size="lg"
                                onClick={handleGenerate}
                                disabled={buildStrategyMutation.isPending || !strategyText.trim()}
                            >
                                {buildStrategyMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate Strategy
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {generatedWorkflow && (
                    <Card className="border-primary/50 bg-primary/5">
                        <CardHeader>
                            <CardTitle>Strategy Generated</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-background rounded-md border">
                                <p className="text-sm text-muted-foreground mb-2 font-semibold">AI Explanation:</p>
                                <p>{generatedWorkflow.explanation}</p>
                            </div>

                            <div className="flex items-center justify-between bg-background p-4 rounded-md border">
                                <div className="text-sm">
                                    <span className="font-semibold">{generatedWorkflow.nodes.length}</span> Nodes,{" "}
                                    <span className="font-semibold">{generatedWorkflow.edges.length}</span> Edges
                                </div>
                                <Button onClick={handleOpenInEditor}>
                                    Open in Editor
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
