"use client";

import type { Realtime } from "@inngest/realtime";
import { slackChannel } from "@/inngest/channels/slack";

export type SlackToken = Realtime.Token<typeof slackChannel, ["status"]>;

export async function fetchSlackRealtimeToken(): Promise<SlackToken> {
  const response = await fetch("/api/inngest/tokens/slack");
  if (!response.ok) {
    throw new Error("Failed to fetch Slack token");
  }
  return response.json();
}

