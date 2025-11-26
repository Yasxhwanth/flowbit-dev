import { getSubscriptionToken } from "@inngest/realtime";
import { anthropicChannel } from "@/inngest/channels/anthropic-channel";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: anthropicChannel(),
      topics: ["status"],
    });

    return NextResponse.json(token);
  } catch (error) {
    console.error("Failed to get Anthropic token:", error);
    return NextResponse.json(
      { error: "Failed to get token" },
      { status: 500 }
    );
  }
}

