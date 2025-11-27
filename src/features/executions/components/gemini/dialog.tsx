"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { CredentialType } from "@prisma/client";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const geminiFormSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[a-zA-Z_][a-zA-Z0-9_$]*$/, {
      message:
        "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  // Make credential optional so the node can use env-based API key instead
  credentialId: z.string().optional(),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, { message: "User prompt is required" }),
});

interface GeminiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof geminiFormSchema>) => void;
  defaultVariableName?: string;
  defaultCredentialId?: string;
  defaultSystemPrompt?: string;
  defaultUserPrompt?: string;
}

export const GeminiDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultVariableName = "",
  defaultCredentialId,
  defaultSystemPrompt = "",
  defaultUserPrompt = "",
}: GeminiDialogProps) => {
  const { data: credentials = [] } = useCredentialsByType(CredentialType.GEMINI);

  const credentialOptions = useMemo(
    () =>
      credentials.map((c) => ({
        id: c.id,
        name: c.name,
      })),
    [credentials]
  );

  const geminiForm = useForm<z.infer<typeof geminiFormSchema>>({
    resolver: zodResolver(geminiFormSchema),
    defaultValues: {
      variableName: defaultVariableName,
      credentialId: defaultCredentialId ?? "",
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
    geminiForm,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gemini AI Request</DialogTitle>
          <DialogDescription>
            Configure settings for the Gemini AI execution node.
          </DialogDescription>
        </DialogHeader>

        <Form {...geminiForm}>
          <div className="space-y-4">
            <FormField
              control={geminiForm.control}
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
                    Optional: choose a saved Gemini API key, or leave empty to use the default env key.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormDescription>
                    Instructions that guide the AI's behavior and style.
                  </FormDescription>
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
              <Button
                type="button"
                onClick={geminiForm.handleSubmit(handleGeminiSubmit)}
              >
                Save
              </Button>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
