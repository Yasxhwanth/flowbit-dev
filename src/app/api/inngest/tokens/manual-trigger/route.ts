import { getSubscriptionToken } from "@inngest/realtime";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: manualTriggerChannel(),
      topics: ["status"],
    });

    return NextResponse.json(token);
  } catch (error) {
    console.error("Failed to get Manual Trigger token:", error);
    return NextResponse.json(
      { error: "Failed to get token" },
      { status: 500 }
    );
  }
}

