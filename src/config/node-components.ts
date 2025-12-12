import { InitialNode } from "@/components/intial-node";
import { GeminiNode } from "@/features/executions/components/gemini/node";
import { HttpRequestNode } from "@/features/executions/components/http-request/node";
import { OpenAINode } from "@/features/executions/components/openai/node";
import { GoogleFormTrigger } from "@/features/triggers/components/google-form-trigger/node";
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/node";
import { StripeTriggerNode } from "@/features/triggers/components/stripe-trigger/node";
import { NodeType } from "@prisma/client";
import type { NodeTypes } from "@xyflow/react";
import { AnthropicNode } from "@/features/executions/components/anthropic/node";
import { DiscordNode } from "@/features/executions/components/discord/node";
import { SlackNode } from "@/features/executions/components/slack/node";
import { ConditionNode } from "@/components/workflow/nodes/ConditionNode";
import { CandleNode } from "@/components/workflow/nodes/CandleNode";
import { IndicatorNode } from "@/components/workflow/nodes/IndicatorNode";
import { OrderNode } from "@/components/workflow/nodes/OrderNode";
import { NotifyNode } from "@/components/workflow/nodes/NotifyNode";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
  [NodeType.HTTP_REQUEST]: HttpRequestNode,
  [NodeType.GOOGLE_FORM_TRIGGER]: GoogleFormTrigger,
  [NodeType.STRIPE_TRIGGER]: StripeTriggerNode,
  [NodeType.GEMINI]: GeminiNode,
  [NodeType.OPENAI]: OpenAINode,
  [NodeType.ANTHROPIC]: AnthropicNode,
  [NodeType.DISCORD]: DiscordNode,
  [NodeType.SLACK]: SlackNode,
  [NodeType.CONDITION]: ConditionNode,
  [NodeType.CANDLES]: CandleNode,
  [NodeType.INDICATORS]: IndicatorNode,
  [NodeType.ORDER]: OrderNode,
  [NodeType.NOTIFY]: NotifyNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;