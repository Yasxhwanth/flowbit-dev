import { getSubscriptionToken } from "@inngest/realtime";
import { openaiChannel } from "@/inngest/channels/openai";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: openaiChannel(),
      topics: ["status"],
    });

    return NextResponse.json(token);
  } catch (error) {
    console.error("Failed to get OpenAI token:", error);
    return NextResponse.json(
      { error: "Failed to get token" },
      { status: 500 }
    );
  }
}

