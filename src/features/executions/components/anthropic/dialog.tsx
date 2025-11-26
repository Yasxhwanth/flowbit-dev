"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { CredentialType } from "@/generated/prisma/enums";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const anthropicFormSchema = z.object({
  variableName: z.string().min(1, "Variable name required"),
  // Make credential optional so the node can use env-based API key instead
  credentialId: z.string().optional(),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, "User prompt required"),
});

export const AnthropicDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultVariableName = "",
  defaultCredentialId,
  defaultSystemPrompt = "",
  defaultUserPrompt = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof anthropicFormSchema>) => void;
  defaultVariableName?: string;
  defaultCredentialId?: string;
  defaultSystemPrompt?: string;
  defaultUserPrompt?: string;
}) => {
  const { data: credentials = [] } = useCredentialsByType(CredentialType.ANTHROPIC);

  const credentialOptions = useMemo(
    () =>
      credentials.map((c) => ({
        id: c.id,
        name: c.name,
      })),
    [credentials]
  );

  const form = useForm<z.infer<typeof anthropicFormSchema>>({
    resolver: zodResolver(anthropicFormSchema),
    defaultValues: {
      variableName: defaultVariableName,
      credentialId: defaultCredentialId ?? "",
      systemPrompt: defaultSystemPrompt,
      userPrompt: defaultUserPrompt,
    },
  });

  const handleSubmit = (values: z.infer<typeof anthropicFormSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultVariableName,
        credentialId: defaultCredentialId ?? "",
        systemPrompt: defaultSystemPrompt,
        userPrompt: defaultUserPrompt,
      });
    }
  }, [
    open,
    defaultVariableName,
    defaultCredentialId,
    defaultSystemPrompt,
    defaultUserPrompt,
    form,
  ]);

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
              name="credentialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key (optional)</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Use default (env) key or pick a credential" />
                      </SelectTrigger>
                      <SelectContent>
                        {credentialOptions.map((cred) => (
                          <SelectItem key={cred.id} value={cred.id}>
                            {cred.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Optional: choose a saved Anthropic API key, or leave empty to use the default env key.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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


