"use client";

import { memo, useState } from "react";
import { useReactFlow, type NodeProps, type Node } from "@xyflow/react";
import { BaseExecutionNode } from "../base-execution-node";
import { SlackDialog, slackSchema } from "./dialog";
import { z } from "zod";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchSlackRealtimeToken } from "./actions";
import { SLACK_CHANNEL_NAME } from "@/inngest/channels/slack";

type SlackNodeData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
  username?: string;
};

type SlackNodeType = Node<SlackNodeData>;

export const SlackNode = memo((props: NodeProps<SlackNodeType>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const status = useNodeStatus({
    nodeId: props.id,
    channel: SLACK_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchSlackRealtimeToken,
  });

  const handleSubmit = (values: z.infer<typeof slackSchema>) => {
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
      <SlackDialog
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
        name="Slack"
        description={desc}
        icon="/slack.svg"
        status={status}
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});

SlackNode.displayName = "SlackNode";

