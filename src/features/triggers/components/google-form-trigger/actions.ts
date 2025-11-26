"use client";

import type { Realtime } from "@inngest/realtime";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";

export type GoogleFormTriggerToken = Realtime.Token<
  typeof googleFormTriggerChannel,
  ["status"]
>;

export async function fetchGoogleFormTriggerRealtimeToken(): Promise<
  GoogleFormTriggerToken
> {
  const response = await fetch("/api/inngest/tokens/google-form-trigger");
  if (!response.ok) {
    throw new Error("Failed to fetch Google Form Trigger token");
  }
  return response.json();
}