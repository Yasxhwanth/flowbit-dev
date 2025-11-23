import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { geminiChannel } from "@/inngest/channels/gemini";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

type GeminiNodeData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
  model?: string; // optional now
};

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

export const geminiExecutor: NodeExecutor<GeminiNodeData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    geminiChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.variableName) {
    await publish(geminiChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Variable name is required");
  }

  if (!data.userPrompt) {
    await publish(geminiChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("User prompt is required");
  }

  // ✅ Default model (NO need for user to configure)
  const model = data.model || "gemini-2.0-flash";

  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new NonRetriableError("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const resolvedPrompt = Handlebars.compile(data.userPrompt)(context);
    const resolvedSystem =
      data.systemPrompt
        ? Handlebars.compile(data.systemPrompt)(context)
        : undefined;

    // ⭐ Gemini wrapper like in your screenshot
    const { steps } = await step.ai.wrap(
      "gemini-generate-text",
      generateText,
      {
        model: google(model),
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
      geminiChannel().status({
        nodeId,
        status: "success",
      })
    );

    return {
      result: {
        ...context,
        [data.variableName]: {
          model,
          aiResponse: text,
        },
      },
    };
  } catch (error) {
    await publish(
      geminiChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};


