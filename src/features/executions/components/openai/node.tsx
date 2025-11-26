"use client";

import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { OpenAIDialog, openAIAFormSchema } from "./dialog";
import { z } from "zod";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchOpenAIRealtimeToken } from "./actions";
import { OPENAI_CHANNEL_NAME } from "@/inngest/channels/openai";

type OpenAINodeData = {
  systemPrompt?: string;
  userPrompt?: string;
  variableName?: string;
  model?: string;
  credentialId?: string;
};

type OpenAINodeType = Node<OpenAINodeData>;

export const OpenAINode = memo((props: NodeProps<OpenAINodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const handleOpenSettings = () => setDialogOpen(true);

  const nodeData = props.data;

  const description = nodeData.userPrompt
    ? `${nodeData.userPrompt.slice(0, 50)}${
        nodeData.userPrompt.length > 50 ? "..." : ""
      }`
    : "Not configured";

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: OPENAI_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchOpenAIRealtimeToken,
  });

  const handleSubmit = (values: z.infer<typeof openAIAFormSchema>) => {
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
      <OpenAIDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultSystemPrompt={nodeData.systemPrompt}
        defaultUserPrompt={nodeData.userPrompt}
        defaultVariableName={nodeData.variableName}
        defaultCredentialId={nodeData.credentialId}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/openai.svg"
        name="OpenAI"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

OpenAINode.displayName = "OpenAINode";


