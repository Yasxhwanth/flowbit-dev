"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface AIExplanationPanelProps {
    executionId: string;
    workflowName: string;
    nodes: any[];
    edges: any[];
    trades: any[];
    logs?: any[];
}

export function AIExplanationPanel({
    executionId,
    workflowName,
    nodes,
    edges,
    trades,
    logs,
}: AIExplanationPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    const { data: explanation, isLoading, refetch, isRefetching } = trpc.ai.explain.explainExecution.useQuery(
        {
            executionId,
            workflowName,
            nodes,
            edges,
            trades,
            logs,
        },
        {
            enabled: isOpen,
            staleTime: Infinity, // Cache forever once fetched
        }
    );

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setIsOpen(true)}
            >
                <Sparkles className="h-4 w-4 text-primary" />
                Explain with AI
            </Button>
        );
    }

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Analysis
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isLoading || isRefetching}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading || isRefetching ? "animate-spin" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                            <ChevronUp className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading || isRefetching ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Analyzing execution logic...</p>
                    </div>
                ) : explanation ? (
                    <div className="space-y-6">
                        <div className="prose dark:prose-invert">
                            <p className="text-lg leading-relaxed">{explanation.explanation}</p>
                        </div>

                        {explanation.breakdown && explanation.breakdown.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Key Events</h4>
                                <ul className="space-y-2">
                                    {explanation.breakdown.map((point, i) => (
                                        <li key={i} className="flex gap-2 items-start text-sm">
                                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {Object.keys(explanation.tradeReasons || {}).length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Trade Analysis</h4>
                                <div className="grid gap-3">
                                    {Object.entries(explanation.tradeReasons).map(([tradeId, reason]) => (
                                        <div key={tradeId} className="bg-background/50 p-3 rounded-md border text-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="font-mono text-xs">{tradeId.slice(0, 8)}</Badge>
                                            </div>
                                            <p className="text-muted-foreground">{reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        Failed to generate explanation.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
