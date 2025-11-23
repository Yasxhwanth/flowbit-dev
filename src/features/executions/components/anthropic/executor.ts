import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { anthropicChannel } from "@/inngest/channels/anthropic-channel";

import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

type AnthropicNodeData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

export const anthropicExecutor: NodeExecutor<AnthropicNodeData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  // Loading state
  await publish(
    anthropicChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.variableName) {
    await publish(anthropicChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Variable name is required");
  }

  if (!data.userPrompt) {
    await publish(anthropicChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("User prompt is required");
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new NonRetriableError("ANTHROPIC_API_KEY is not set");
    }

    const prompt = Handlebars.compile(data.userPrompt)(context);
    const system = data.systemPrompt
      ? Handlebars.compile(data.systemPrompt)(context)
      : undefined;

    // ⭐ CORRECT AI SDK USAGE (same pattern as Gemini)
    const { steps } = await step.ai.wrap(
      "anthropic-generate-text",
      generateText,
      {
        model: anthropic("claude-3-5-sonnet-latest"), // IMPORTANT: this is correct
        system,
        prompt,

        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      }
    );

    const text =
      steps[0].content?.[0]?.type === "text"
        ? steps[0].content[0].text
        : "";

    await publish(
      anthropicChannel().status({
        nodeId,
        status: "success",
      })
    );

    return {
      result: {
        ...context,
        [data.variableName]: {
          model: "claude-3-5-sonnet-latest",
          aiResponse: text,
        },
      },
    };
  } catch (error) {
    await publish(anthropicChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
