"use client";
import type { Realtime } from "@inngest/realtime";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";

export type ManualTriggerToken = Realtime.Token<
  typeof manualTriggerChannel,
  ["status"]
>;

export async function fetchManualTriggerRealtimeToken(): Promise<ManualTriggerToken> {
  const response = await fetch("/api/inngest/tokens/manual-trigger");
  if (!response.ok) {
    throw new Error("Failed to fetch Manual Trigger token");
  }
  return response.json();
}