import { getSubscriptionToken } from "@inngest/realtime";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: googleFormTriggerChannel(),
      topics: ["status"],
    });

    return NextResponse.json(token);
  } catch (error) {
    console.error("Failed to get Google Form Trigger token:", error);
    return NextResponse.json(
      { error: "Failed to get token" },
      { status: 500 }
    );
  }
}

