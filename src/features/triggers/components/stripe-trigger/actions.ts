"use client";

import type { Realtime } from "@inngest/realtime";
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger";

export type StripeTriggerToken = Realtime.Token<
  typeof stripeTriggerChannel,
  ["status"]
>;

export async function fetchStripeTriggerRealtimeToken(): Promise<
  StripeTriggerToken
> {
  const response = await fetch("/api/inngest/tokens/stripe-trigger");
  if (!response.ok) {
    throw new Error("Failed to fetch Stripe Trigger token");
  }
  return response.json();
}