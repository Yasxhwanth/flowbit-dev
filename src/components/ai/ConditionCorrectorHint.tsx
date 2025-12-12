import { Sparkles, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConditionCorrectorHintProps {
    original: string;
    corrected: string;
    explanation: string;
    onUndo: () => void;
    onDismiss: () => void;
}

export function ConditionCorrectorHint({
    original,
    corrected,
    explanation,
    onUndo,
    onDismiss,
}: ConditionCorrectorHintProps) {
    return (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>AI Fixed Condition</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mr-2"
                    onClick={onDismiss}
                >
                    <span className="sr-only">Dismiss</span>
                    <span aria-hidden="true">&times;</span>
                </Button>
            </AlertTitle>
            <AlertDescription className="mt-2 text-amber-700 dark:text-amber-400 text-xs">
                <p className="mb-2">{explanation}</p>
                <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 p-2 rounded border border-amber-100 dark:border-amber-900/50 font-mono">
                    <span className="line-through opacity-50">{original}</span>
                    <span>&rarr;</span>
                    <span className="font-bold">{corrected}</span>
                </div>
                <Button
                    variant="link"
                    size="sm"
                    className="px-0 mt-2 h-auto text-amber-800 dark:text-amber-300"
                    onClick={onUndo}
                >
                    <Undo2 className="mr-1 h-3 w-3" />
                    Undo Change
                </Button>
            </AlertDescription>
        </Alert>
    );
}
