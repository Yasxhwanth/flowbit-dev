"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyIcon } from "lucide-react";

import { useParams } from "next/navigation";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StripeTriggerDialog = ({ open, onOpenChange }: Props) => {
  const params = useParams();
  const workflowId = params.workflowId as string;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/webhooks/stripe?workflowId=${workflowId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stripe Trigger Configuration</DialogTitle>
          <DialogDescription>
            Use this webhook URL to connect your Stripe events to this trigger.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* WEBHOOK URL */}
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                value={webhookUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button type="button" size="icon" variant="outline" onClick={copyToClipboard}>
                <CopyIcon className="size-4" />
              </Button>
            </div>
          </div>

          {/* SETUP INSTRUCTIONS */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Setup Instructions</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open your Stripe Dashboard</li>
              <li>Go to <b>Developers → Webhooks</b></li>
              <li>Click <b>"Add endpoint"</b></li>
              <li>Paste the webhook URL above</li>
              <li>Select events you want to listen for (e.g. <code>payment_intent.succeeded</code>)</li>
              <li>Save and copy the <b>Signing Secret</b></li>
            </ol>
          </div>

          {/* AVAILABLE VARIABLES */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Available Variables</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{stripe.eventType}}"}
                </code>{" "}
                – Type of the Stripe event (e.g. payment_intent.succeeded)
              </li>

              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{stripe.data.id}}"}
                </code>{" "}
                – Stripe Object ID (e.g. PaymentIntent ID)
              </li>

              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{stripe.data.object.amount}}"}
                </code>{" "}
                – Payment amount
              </li>

              <li>
                <code className="bg-background px-1 py-0.5 rounded">{`{{json stripe}}`}</code>{" "}
                – Full Stripe webhook payload as JSON
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
