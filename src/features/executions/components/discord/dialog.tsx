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

export const discordSchema = z.object({
  variableName: z.string().min(1),
  webhookUrl: z.string().url("Invalid Discord webhook URL"),
  content: z.string().min(1, "Message cannot be empty"),
  username: z.string().optional(),
});

interface DiscordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof discordSchema>) => void;
  defaultVariableName?: string;
  defaultWebhookUrl?: string;
  defaultContent?: string;
  defaultUsername?: string;
}

export const DiscordDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultVariableName = "",
  defaultWebhookUrl = "",
  defaultContent = "",
  defaultUsername = "",
}: DiscordDialogProps) => {
  const form = useForm({
    resolver: zodResolver(discordSchema),
    defaultValues: {
      variableName: defaultVariableName,
      webhookUrl: defaultWebhookUrl,
      content: defaultContent,
      username: defaultUsername,
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Discord Configuration</DialogTitle>
          <DialogDescription>
            Send a message using a Discord webhook URL.
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
                  <FormControl><Input placeholder="myDiscord" {...field} /></FormControl>
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
                  <FormControl><Input placeholder="https://discord.com/api/webhooks/..." {...field} /></FormControl>
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


