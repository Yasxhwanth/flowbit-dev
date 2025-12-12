import { NodeType } from "@prisma/client";
import { NodeExecutor } from "../types";

import { manualTriggerExecutor } from "@/features/triggers/components/manual-trigger/executor";
import { httpRequestExecutor } from "../components/http-request/executor";
import { googleFormTriggerExecutor } from "@/features/triggers/components/google-form-trigger/executor";
import { stripeTriggerExecutor } from "@/features/triggers/components/stripe-trigger/executor";
import { geminiExecutor } from "../components/gemini/executor";
import { openAIExecutor } from "../components/openai/executor";
import { anthropicExecutor } from "../components/anthropic/executor";
import { discordExecutor } from "../components/discord/executor";
import { slackExecutor } from "../components/slack/executor";
import { conditionExecutor } from "../components/condition/executor";
import { candlesExecutor } from "../components/candles/executor";
import { indicatorsExecutor } from "../components/indicators/executor";
import { orderExecutor } from "../components/order/executor";
import { notifyExecutor } from "../components/notify/executor";

export const executorRegistry: Record<NodeType, NodeExecutor<any>> = {
  [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
  [NodeType.INITIAL]: manualTriggerExecutor,
  [NodeType.HTTP_REQUEST]: httpRequestExecutor,
  [NodeType.GOOGLE_FORM_TRIGGER]: googleFormTriggerExecutor,
  [NodeType.STRIPE_TRIGGER]: stripeTriggerExecutor,
  [NodeType.GEMINI]: geminiExecutor,
  [NodeType.ANTHROPIC]: anthropicExecutor,
  [NodeType.OPENAI]: openAIExecutor,
  [NodeType.DISCORD]: discordExecutor,
  [NodeType.SLACK]: slackExecutor,
  [NodeType.CONDITION]: conditionExecutor,
  [NodeType.CANDLES]: candlesExecutor,
  [NodeType.INDICATORS]: indicatorsExecutor,
  [NodeType.ORDER]: orderExecutor,
  [NodeType.NOTIFY]: notifyExecutor,
};

export const getExecutor = (type: NodeType): NodeExecutor => {
  const executor = executorRegistry[type];
  if (!executor) {
    throw new Error(`No executor found for node type: ${type}`);
  }
  return executor;
};
