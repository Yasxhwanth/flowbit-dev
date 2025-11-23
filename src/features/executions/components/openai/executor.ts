import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { openaiChannel } from "@/inngest/channels/openai";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

type OpenAINodeData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
  model?: string; // optional – we default it below
};

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

export const openAIExecutor: NodeExecutor<OpenAINodeData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    openaiChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.variableName) {
    await publish(openaiChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Variable name is required");
  }

  if (!data.userPrompt) {
    await publish(openaiChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("User prompt is required");
  }

  const modelId = "gpt-4o-mini"; // ✅ default model

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new NonRetriableError("OPENAI_API_KEY is not set");
    }

    const openai = createOpenAI({ apiKey });

    const resolvedPrompt = Handlebars.compile(data.userPrompt)(context);
    const resolvedSystem = data.systemPrompt
      ? Handlebars.compile(data.systemPrompt)(context)
      : undefined;

    const { steps } = await step.ai.wrap(
      "openai-generate-text",
      generateText,
      {
        model: openai(modelId),
        system: resolvedSystem,
        prompt: resolvedPrompt,
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
      openaiChannel().status({
        nodeId,
        status: "success",
      })
    );

    return {
      result: {
        ...context,
        [data.variableName]: {
          model: modelId,
          aiResponse: text,
        },
      },
    };
  } catch (error) {
    await publish(
      openaiChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};



