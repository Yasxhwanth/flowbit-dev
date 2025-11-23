"use client";

import { memo, useState } from "react";
import { useReactFlow, type NodeProps, type Node } from "@xyflow/react";
import { AnthropicDialog, anthropicFormSchema } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchAnthropicRealtimeToken } from "./actions";
import { ANTHROPIC_CHANNEL_NAME } from "@/inngest/channels/anthropic-channel";
import { BaseExecutionNode } from "../base-execution-node";
import { z } from "zod";

type AnthropicNodeData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

type AnthropicNodeType = Node<AnthropicNodeData>;

export const AnthropicNode = memo((props: NodeProps<AnthropicNodeType>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const data = props.data;

  const description =
    data.userPrompt?.slice(0, 50) +
      (data.userPrompt && data.userPrompt.length > 50 ? "..." : "") ||
    "Not configured";

  const status = useNodeStatus({
    nodeId: props.id,
    channel: ANTHROPIC_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchAnthropicRealtimeToken,
  });

  const handleSubmit = (values: z.infer<typeof anthropicFormSchema>) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id
          ? { ...node, data: { ...node.data, ...values } }
          : node
      )
    );
  };

  return (
    <>
      <AnthropicDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        defaultVariableName={data.variableName}
        defaultSystemPrompt={data.systemPrompt}
        defaultUserPrompt={data.userPrompt}
      />

      <BaseExecutionNode
        {...props}
        name="Anthropic"
        icon="/anthropic.svg"
        description={description}
        status={status}
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});

AnthropicNode.displayName = "AnthropicNode";



