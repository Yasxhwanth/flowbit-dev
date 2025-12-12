'use client';

/**
 * ConditionBuilder Component
 * Main component for building trading conditions visually
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitCompare } from 'lucide-react';
import { trpc } from "@/trpc/client";
import { ConditionCorrectorHint } from "@/components/ai/ConditionCorrectorHint";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ConditionGroupData } from './types';
import { createEmptyGroup } from './types';
import { ConditionGroup } from './ConditionGroup';
import { generateExpression, parseExpression } from './utils';
import { generateIndicatorOptions, priceOptions } from './indicatorOptions';
import type { IndicatorOption } from './indicatorOptions';

interface IndicatorConfig {
    type: string;
    period?: number;
    fastPeriod?: number;
    slowPeriod?: number;
    signalPeriod?: number;
}

interface ConditionBuilderProps {
    /** Current condition tree (for editing) */
    value?: ConditionGroupData | null;
    /** Current expression string (fallback parsing) */
    expression?: string;
    /** Available indicator configurations */
    indicators?: IndicatorConfig[];
    /** Called when condition changes */
    onChange: (tree: ConditionGroupData, expression: string) => void;
}

export function ConditionBuilder({
    value,
    expression,
    indicators = [],
    onChange,
}: ConditionBuilderProps) {
    const [tree, setTree] = useState<ConditionGroupData>(() => {
        if (value) return value;
        if (expression) {
            const parsed = parseExpression(expression);
            if (parsed) return parsed;
        }
        return createEmptyGroup('AND', 'root');
    });

    // Generate indicator options
    const indicatorOptions: IndicatorOption[] = indicators.length > 0
        ? generateIndicatorOptions(indicators)
        : priceOptions;

    const [isManual, setIsManual] = useState(false);
    const [manualExpression, setManualExpression] = useState(expression || "");
    const [correction, setCorrection] = useState<{ original: string; corrected: string; explanation: string } | null>(null);

    const correctCondition = trpc.ai.condition.correctCondition.useMutation({
        onSuccess: (data) => {
            if (data.corrected && data.corrected !== manualExpression) {
                setCorrection({
                    original: manualExpression,
                    corrected: data.corrected,
                    explanation: data.explanation,
                });
                setManualExpression(data.corrected);
                onChange(tree, data.corrected); // Update parent
                toast.success("Condition auto-corrected by AI");
            }
        },
        onError: (error) => {
            toast.error("Failed to auto-correct condition");
            console.error(error);
        }
    });

    // Sync with external value changes
    useEffect(() => {
        if (value && value !== tree) {
            setTree(value);
        }
    }, [value]);

    // Sync manual expression when tree changes (if not in manual mode)
    useEffect(() => {
        if (!isManual) {
            setManualExpression(generateExpression(tree));
        }
    }, [tree, isManual]);

    function handleChange(updated: ConditionGroupData) {
        setTree(updated);
        const expr = generateExpression(updated);
        onChange(updated, expr);
    }

    function handleManualChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setManualExpression(e.target.value);
        // Note: We don't update the tree here because parsing back from string is hard/impossible for complex logic
        // We just pass the string to the parent
        onChange(tree, e.target.value);
    }

    function handleBlur() {
        if (!manualExpression.trim()) return;

        // Optimistic check: if it looks valid, don't bother AI (simple heuristic)
        // But for now, let's just send it if it's changed
        correctCondition.mutate({
            text: manualExpression,
            availableIndicators: indicators.map(i => i.type), // Pass available indicators
        });
    }

    const currentExpression = generateExpression(tree);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <GitCompare className="h-4 w-4" />
                        Condition Builder
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="manual-mode" className="text-xs">Manual Mode</Label>
                        <Switch
                            id="manual-mode"
                            checked={isManual}
                            onCheckedChange={setIsManual}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {correction && (
                    <ConditionCorrectorHint
                        original={correction.original}
                        corrected={correction.corrected}
                        explanation={correction.explanation}
                        onUndo={() => {
                            setManualExpression(correction.original);
                            onChange(tree, correction.original);
                            setCorrection(null);
                        }}
                        onDismiss={() => setCorrection(null)}
                    />
                )}

                {isManual ? (
                    <div className="space-y-2">
                        <Textarea
                            value={manualExpression}
                            onChange={handleManualChange}
                            onBlur={handleBlur}
                            placeholder="Enter condition (e.g. RSI_14 > 30)"
                            className="font-mono text-sm"
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                            AI will auto-correct your syntax when you click away.
                        </p>
                    </div>
                ) : (
                    <>
                        <ConditionGroup
                            group={tree}
                            indicators={indicatorOptions}
                            onChange={handleChange}
                            isRoot
                        />

                        {/* Expression Preview */}
                        <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                            <p className="text-xs text-muted-foreground mb-1">Expression Preview:</p>
                            <code className="text-xs font-mono">
                                {currentExpression || 'No condition defined'}
                            </code>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
