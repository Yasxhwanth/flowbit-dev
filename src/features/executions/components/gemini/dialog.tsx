"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

//
// UPDATED SCHEMA (model removed)
//
export const geminiFormSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[a-zA-Z_][a-zA-Z0-9_$]*$/, {
      message:
        "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, { message: "User prompt is required" }),
});

interface GeminiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof geminiFormSchema>) => void;
  defaultVariableName?: string;
  defaultSystemPrompt?: string;
  defaultUserPrompt?: string;
}

export const GeminiDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultVariableName = "",
  defaultSystemPrompt = "",
  defaultUserPrompt = "",
}: GeminiDialogProps) => {
  const geminiForm = useForm<z.infer<typeof geminiFormSchema>>({
    resolver: zodResolver(geminiFormSchema),
    defaultValues: {
      variableName: defaultVariableName,
      systemPrompt: defaultSystemPrompt,
      userPrompt: defaultUserPrompt,
    },
  });

  const watchVariableName = geminiForm.watch("variableName") || "myGeminiCall";

  const handleGeminiSubmit = (values: z.infer<typeof geminiFormSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      geminiForm.reset({
        variableName: defaultVariableName,
        systemPrompt: defaultSystemPrompt,
        userPrompt: defaultUserPrompt,
      });
    }
  }, [open, defaultVariableName, defaultSystemPrompt, defaultUserPrompt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gemini AI Request</DialogTitle>
          <DialogDescription>Configure settings for the Gemini AI execution node.</DialogDescription>
        </DialogHeader>

        <Form {...geminiForm}>
          <div className="space-y-4">

            {/* Variable Name */}
            <FormField
              control={geminiForm.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myGeminiCall" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use this name to reference the result in other nodes:{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {`{{${watchVariableName}.text}}`}
                    </code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* System Prompt */}
            <FormField
              control={geminiForm.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are a helpful assistant..."
                      className="min-h-[100px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Instructions that guide the AI's behavior and style.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* User Prompt */}
            <FormField
              control={geminiForm.control}
              name="userPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your prompt here..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>The main text sent to Gemini.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={geminiForm.handleSubmit(handleGeminiSubmit)}>
                Save
              </Button>
            </div>

          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

