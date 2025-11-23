import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { slackChannel } from "@/inngest/channels/slack";

// Register Handlebars helper for JSON output (useful for debugging)
Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type SlackNodeData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
  username?: string;
};

export const slackExecutor: NodeExecutor<SlackNodeData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  // Debug: Log the incoming data
  console.log("[Slack Executor] Received data:", JSON.stringify(data, null, 2));
  console.log("[Slack Executor] Node ID:", nodeId);
  console.log("[Slack Executor] Context:", JSON.stringify(context, null, 2));
  
  await publish(
    slackChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.webhookUrl) {
    await publish(slackChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Webhook URL is required");
  }
  if (!data.content) {
    await publish(slackChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(`Message content is required. Data received: ${JSON.stringify(data)}`);
  }
  if (!data.variableName) {
    await publish(slackChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Variable name is required");
  }

  try {
    // Validate and get the raw content
    if (!data.content) {
      await publish(slackChannel().status({ nodeId, status: "error" }));
      throw new NonRetriableError(`Content is required but was ${data.content === null ? "null" : "undefined"}`);
    }
    
    if (typeof data.content !== "string") {
      await publish(slackChannel().status({ nodeId, status: "error" }));
      throw new NonRetriableError(`Invalid content type: expected string, got ${typeof data.content}. Value: ${JSON.stringify(data.content)}`);
    }

    // Ensure content is a string and resolve Handlebars templates
    const contentTemplate = data.content.trim();
    
    if (!contentTemplate) {
      await publish(slackChannel().status({ nodeId, status: "error" }));
      throw new NonRetriableError("Content cannot be empty");
    }
    
    // Compile and resolve the template
    let resolvedContent: string;
    try {
      const compiled = Handlebars.compile(contentTemplate);
      const result = compiled(context);
      
      // Handle different result types
      if (result === null || result === undefined) {
        // If template resolves to null/undefined, use the original content
        resolvedContent = contentTemplate;
      } else if (typeof result === "string") {
        resolvedContent = result;
      } else if (typeof result === "object") {
        // If it's an object, try to stringify it
        resolvedContent = JSON.stringify(result);
      } else {
        resolvedContent = String(result);
      }
    } catch (error) {
      await publish(slackChannel().status({ nodeId, status: "error" }));
      throw new NonRetriableError(`Failed to resolve template: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Ensure resolved content is a string (not undefined, null, or object)
    const messageText = resolvedContent.trim();
    
    if (!messageText || messageText === "null" || messageText === "undefined") {
      await publish(slackChannel().status({ nodeId, status: "error" }));
      throw new NonRetriableError(`Resolved message content is invalid. Original: "${data.content}", Resolved: "${resolvedContent}", Context keys: ${Object.keys(context).join(", ")}`);
    }

    // Check if this is a Slack Workflow Builder trigger URL
    const isWorkflowBuilder = data.webhookUrl?.includes("/triggers/");
    
    let payload: any;
    
    if (isWorkflowBuilder) {
      // For Slack Workflow Builder triggers, the payload structure is different
      // Workflow Builder expects variables that match what the workflow is configured to receive
      // Common variable names: message, text, content, body
      payload = {
        message: messageText,
        text: messageText,
        content: messageText, // Support multiple common variable names
        body: messageText,
      };
      // Add username if provided
      if (data.username) {
        payload.username = data.username;
        payload.user = data.username;
      }
    } else {
      // Standard incoming webhook format
      payload = { text: messageText };
      if (data.username) payload.username = data.username;
    }
    
    // Validate payload before sending
    if (!payload.text && !payload.message && !payload.content && !payload.body) {
      await publish(slackChannel().status({ nodeId, status: "error" }));
      throw new NonRetriableError("Payload is missing message content");
    }
    
    // Log for debugging
    console.log("[Slack Executor] Final payload:", JSON.stringify(payload, null, 2));
    console.log("[Slack Executor] Message text:", messageText);
    console.log("[Slack Executor] Is Workflow Builder:", isWorkflowBuilder);

    const result = await step.run("slack-webhook", async () => {
      // Log the payload being sent for debugging
      console.log("[Slack Executor] Sending payload:", JSON.stringify(payload, null, 2));
      console.log("[Slack Executor] Webhook URL:", data.webhookUrl);
      console.log("[Slack Executor] Is Workflow Builder:", isWorkflowBuilder);
      
      const res = await fetch(data.webhookUrl!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      
      console.log("[Slack Executor] Response status:", res.status);
      console.log("[Slack Executor] Response text:", responseText);

      if (!res.ok) {
        throw new Error(`Slack webhook error: ${res.status} - ${responseText}`);
      }

      // Slack webhooks return "ok" as plain text, not JSON
      try {
        return JSON.parse(responseText);
      } catch {
        return { ok: responseText === "ok", response: responseText };
      }
    });

    await publish(
      slackChannel().status({
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
      slackChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};

