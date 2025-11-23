"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

export const slackSchema = z.object({
  variableName: z.string().min(1),
  webhookUrl: z.string().url("Invalid Slack webhook URL"),
  content: z.string().min(1, "Message cannot be empty"),
  username: z.string().optional(),
});

interface SlackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof slackSchema>) => void;
  defaultVariableName?: string;
  defaultWebhookUrl?: string;
  defaultContent?: string;
  defaultUsername?: string;
}

export const SlackDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultVariableName = "",
  defaultWebhookUrl = "",
  defaultContent = "",
  defaultUsername = "",
}: SlackDialogProps) => {
  const form = useForm({
    resolver: zodResolver(slackSchema),
    defaultValues: {
      variableName: defaultVariableName,
      webhookUrl: defaultWebhookUrl,
      content: defaultContent,
      username: defaultUsername,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultVariableName,
        webhookUrl: defaultWebhookUrl,
        content: defaultContent,
        username: defaultUsername,
      });
    }
  }, [open, defaultVariableName, defaultWebhookUrl, defaultContent, defaultUsername, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Slack Configuration</DialogTitle>
          <DialogDescription>
            Send a message using a Slack webhook URL. For Workflow Builder, use <code className="bg-background px-1 rounded text-xs">{"{{content}}"}</code> in your Slack workflow message step.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(values => {
              onSubmit(values);
              onOpenChange(false);
            })}
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl><Input placeholder="mySlack" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL</FormLabel>
                  <FormControl><Input placeholder="https://hooks.slack.com/services/..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Content</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[100px]" placeholder="Hello world" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Username (optional)</FormLabel>
                  <FormControl><Input placeholder="bot name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

