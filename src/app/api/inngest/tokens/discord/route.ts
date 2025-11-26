import { getSubscriptionToken } from "@inngest/realtime";
import { discordChannel } from "@/inngest/channels/discord";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: discordChannel(),
      topics: ["status"],
    });

    return NextResponse.json(token);
  } catch (error) {
    console.error("Failed to get Discord token:", error);
    return NextResponse.json(
      { error: "Failed to get token" },
      { status: 500 }
    );
  }
}

