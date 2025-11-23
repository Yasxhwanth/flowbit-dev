"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const anthropicFormSchema = z.object({
  variableName: z.string().min(1, "Variable name required"),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, "User prompt required"),
});

export const AnthropicDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultVariableName = "",
  defaultSystemPrompt = "",
  defaultUserPrompt = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof anthropicFormSchema>) => void;
  defaultVariableName?: string;
  defaultSystemPrompt?: string;
  defaultUserPrompt?: string;
}) => {
  const form = useForm<z.infer<typeof anthropicFormSchema>>({
    resolver: zodResolver(anthropicFormSchema),
    defaultValues: {
      variableName: defaultVariableName,
      systemPrompt: defaultSystemPrompt,
      userPrompt: defaultUserPrompt,
    },
  });

  const handleSubmit = (values: z.infer<typeof anthropicFormSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Anthropic — Claude Request</DialogTitle>
          <DialogDescription>Configure Claude AI settings.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">

            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myClaudeCall" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="You are Claude..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Prompt</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter your prompt..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(handleSubmit)}>Save</Button>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};


