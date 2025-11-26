"use client";

import type { Realtime } from "@inngest/realtime";
import { anthropicChannel } from "@/inngest/channels/anthropic-channel";

export type AnthropicToken = Realtime.Token<
  typeof anthropicChannel,
  ["status"]
>;

export async function fetchAnthropicRealtimeToken(): Promise<AnthropicToken> {
  const response = await fetch("/api/inngest/tokens/anthropic");
  if (!response.ok) {
    throw new Error("Failed to fetch Anthropic token");
  }
  return response.json();
}

