"use client";

import type { Realtime } from "@inngest/realtime";
import { openaiChannel } from "@/inngest/channels/openai";

export type OpenAIToken = Realtime.Token<
  typeof openaiChannel,
  ["status"]
>;

export async function fetchOpenAIRealtimeToken(): Promise<OpenAIToken> {
  const response = await fetch("/api/inngest/tokens/openai");
  if (!response.ok) {
    throw new Error("Failed to fetch OpenAI token");
  }
  return response.json();
}
