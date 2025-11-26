"use client";
import type { Realtime } from "@inngest/realtime";
import { geminiChannel } from "@/inngest/channels/gemini";

export type GeminiToken = Realtime.Token<
  typeof geminiChannel,
  ["status"]
>;

export async function fetchGeminiRealtimeToken(): Promise<GeminiToken> {
  const response = await fetch("/api/inngest/tokens/gemini");
  if (!response.ok) {
    throw new Error("Failed to fetch Gemini token");
  }
  return response.json();
}