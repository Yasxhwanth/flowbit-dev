"use client";

import { memo, useState } from "react";
import { useReactFlow, type NodeProps, type Node } from "@xyflow/react";
import { BaseExecutionNode } from "../base-execution-node";
import { DiscordDialog, discordSchema } from "./dialog";
import { z } from "zod";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchDiscordRealtimeToken } from "./actions";
import { DISCORD_CHANNEL_NAME } from "@/inngest/channels/discord";

type DiscordNodeData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
  username?: string;
};

type DiscordNodeType = Node<DiscordNodeData>;

export const DiscordNode = memo((props: NodeProps<DiscordNodeType>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const status = useNodeStatus({
    nodeId: props.id,
    channel: DISCORD_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchDiscordRealtimeToken,
  });

  const handleSubmit = (values: z.infer<typeof discordSchema>) => {
    setNodes(nodes =>
      nodes.map(n =>
        n.id === props.id
          ? { ...n, data: { ...n.data, ...values } }
          : n
      )
    );
  };

  const desc = props.data?.content
    ? props.data.content.slice(0, 40) + (props.data.content.length > 40 ? "..." : "")
    : "Not configured";

  return (
    <>
      <DiscordDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        defaultVariableName={props.data?.variableName}
        defaultWebhookUrl={props.data?.webhookUrl}
        defaultContent={props.data?.content}
        defaultUsername={props.data?.username}
      />

      <BaseExecutionNode
        {...props}
        name="Discord"
        description={desc}
        icon="/discord.svg"
        status={status}
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});

DiscordNode.displayName = "DiscordNode";

