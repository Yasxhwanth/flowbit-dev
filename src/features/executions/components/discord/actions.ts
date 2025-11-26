"use client";

import type { Realtime } from "@inngest/realtime";
import { discordChannel } from "@/inngest/channels/discord";

export type DiscordToken = Realtime.Token<typeof discordChannel, ["status"]>;

export async function fetchDiscordRealtimeToken(): Promise<DiscordToken> {
  const response = await fetch("/api/inngest/tokens/discord");
  if (!response.ok) {
    throw new Error("Failed to fetch Discord token");
  }
  return response.json();
}
