import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { discordChannel } from "@/inngest/channels/discord";

type DiscordNodeData = {
  webhookUrl?: string;
  content?: string;
  username?: string;
  variableName?: string; // optional, but handled safely
};

export const discordExecutor: NodeExecutor<DiscordNodeData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    discordChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.webhookUrl) {
    throw new NonRetriableError("Webhook URL is required");
  }

  if (!data.content) {
    throw new NonRetriableError("Message content is required");
  }

  try {
    // Render template with Handlebars
    let resolvedContent = Handlebars.compile(data.content)(context);

    // Must be a string
    if (!resolvedContent || typeof resolvedContent !== "string") {
      throw new NonRetriableError("Resolved message content is not a valid string");
    }

    // Discord max length is 2000 chars
    resolvedContent = resolvedContent.slice(0, 2000);

    const payload: any = {
      content: resolvedContent,
    };

    if (data.username) {
      payload.username = data.username;
    }

    const result = await step.run("discord-webhook", async () => {
      const res = await fetch(data.webhookUrl!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Not OK → read error body for debugging
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Discord webhook error: ${res.status} - ${errorText}`);
      }

      // 204 No Content → return empty result
      if (res.status === 204) {
        return { success: true };
      }

      // Handle JSON response safely
      try {
        return await res.json();
      } catch {
        return { success: true };
      }
    });

    await publish(
      discordChannel().status({
        nodeId,
        status: "success",
      })
    );

    // Optional variable assignment
    return {
      result: {
        ...context,
        [data.variableName || "discord"]: {
          sent: true,
          response: result,
        },
      },
    };
  } catch (error) {
    await publish(
      discordChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};


