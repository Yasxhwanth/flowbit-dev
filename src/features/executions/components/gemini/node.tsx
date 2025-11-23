"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { GeminiDialog, geminiFormSchema } from "./dialog";
import { z } from "zod";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchGeminiRealtimeToken } from "./actions";
import { GEMINI_CHANNEL_NAME } from "@/inngest/channels/gemini";

type GeminiNodeData = {
  systemPrompt?: string;
  userPrompt?: string;
  variableName?: string;
};

type GeminiNodeType = Node<GeminiNodeData>;

export const GeminiNode = memo((props: NodeProps<GeminiNodeType>) => {
  const [geminiDialogOpen, setGeminiDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const handleOpenGeminiSettings = () => setGeminiDialogOpen(true);

  const geminiNodeData = props.data;

  const geminiDescription = geminiNodeData.userPrompt
    ? `${geminiNodeData.userPrompt.slice(0, 50)}${
        geminiNodeData.userPrompt.length > 50 ? "..." : ""
      }`
    : "Not configured";

  const geminiNodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: GEMINI_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchGeminiRealtimeToken,
  });

  const handleGeminiSubmit = (values: z.infer<typeof geminiFormSchema>) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...values,
            },
          };
        }
        return node;
      })
    );
  };

  return (
    <>
      <GeminiDialog
        open={geminiDialogOpen}
        onOpenChange={setGeminiDialogOpen}
        onSubmit={handleGeminiSubmit}
        defaultSystemPrompt={geminiNodeData.systemPrompt}
        defaultUserPrompt={geminiNodeData.userPrompt}
        defaultVariableName={geminiNodeData.variableName}
      />

      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/gemini.svg"
        name="Gemini"
        status={geminiNodeStatus}
        description={geminiDescription}
        onSettings={handleOpenGeminiSettings}
        onDoubleClick={handleOpenGeminiSettings}
      />
    </>
  );
});

GeminiNode.displayName = "GeminiNode";

