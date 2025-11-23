import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { discordChannel } from "@/inngest/channels/discord";

type DiscordNodeData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
  username?: string;
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
    await publish(discordChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Webhook URL is required");
  }
  if (!data.content) {
    await publish(discordChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Message content is required");
  }
  if (!data.variableName) {
    await publish(discordChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Variable name is required");
  }

  try {
    const resolvedContent = Handlebars.compile(data.content)(context);

    const payload: any = { content: resolvedContent };
    if (data.username) payload.username = data.username;

    const result = await step.run("discord-webhook", async () => {
      const res = await fetch(data.webhookUrl!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Discord webhook error: ${res.status}`);

      return await res.json().catch(() => ({}));
    });

    await publish(
      discordChannel().status({
        nodeId,
        status: "success",
      })
    );

    return {
      result: {
        ...context,
        [data.variableName]: {
          sent: true,
          webhookResponse: result,
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


