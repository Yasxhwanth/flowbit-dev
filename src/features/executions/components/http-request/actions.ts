"use client";
import type { Realtime } from "@inngest/realtime";
import { httpRequestChannel } from "@/inngest/channels/http-request";

export type HttpRequestToken = Realtime.Token<
  typeof httpRequestChannel,
  ["status"]
>;

export async function fetchHttpRequestRealtimeToken(): Promise<HttpRequestToken> {
  const response = await fetch("/api/inngest/tokens/http-request");
  if (!response.ok) {
    throw new Error("Failed to fetch HTTP Request token");
  }
  return response.json();
}