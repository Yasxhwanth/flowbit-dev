"use client";

import { createId } from "@paralleldrive/cuid2";
import { useReactFlow } from "@xyflow/react";
import { GlobeIcon, MousePointerIcon } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NodeType } from "@prisma/client";
import { Separator } from "./ui/separator";

export type NodeTypeOption = {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }> | string;
};

const triggerNodes: NodeTypeOption[] = [
  {
    type: NodeType.MANUAL_TRIGGER,
    label: "Trigger manually",
    description:
      "Runs the flow on clicking a button. Good for getting started quickly",
    icon: MousePointerIcon,
  },
  {
    type: NodeType.GOOGLE_FORM_TRIGGER,
    label: "Google Form",
    description:
      "Runs the flow when a Google Form is submitted",
    icon: "/googleform.svg",
  },
  {
    type: NodeType.STRIPE_TRIGGER,
    label: "Stripe Event",
    description:
      "Runs the flow when a specific event occurs in your Stripe account",
    icon: "/stripe.svg",
  },
];

const executionNodes: NodeTypeOption[] = [
  {
    type: NodeType.HTTP_REQUEST,
    label: "HTTP Request",
    description: "Makes an HTTP request",
    icon: GlobeIcon,
  },
  {
    type: NodeType.GEMINI,
    label: "Gemini AI",
    description: "Uses Gemini AI to generate text",
    icon: '/gemini.svg',
  },
  {
    type: NodeType.OPENAI,
    label: "OpenAI",
    description: "Uses OpenAI to generate text",
    icon: '/openai.svg',
  },
  {
    type: NodeType.ANTHROPIC,
    label: "Anthropic",
    description: "Uses Anthropic to generate text",
    icon: '/anthropic.svg',
  },
  {
    type: NodeType.DISCORD,
    label: "Discord",
    description: "Send messages to Discord channels using a bot",
    icon: "/discord.svg",
  },
  {
    type: NodeType.SLACK,
    label: "Slack",
    description: "Send messages to Slack channels using a webhook",
    icon: "/slack.svg",
  },
  {
    type: NodeType.CANDLES,
    label: "Candles",
    description: "Fetch OHLCV market data",
    icon: GlobeIcon, // Placeholder
  },
  {
    type: NodeType.INDICATORS,
    label: "Indicators",
    description: "Calculate technical indicators",
    icon: GlobeIcon, // Placeholder
  },
  {
    type: NodeType.CONDITION,
    label: "Condition",
    description: "Evaluate logic conditions",
    icon: GlobeIcon, // Placeholder
  },
  {
    type: NodeType.ORDER,
    label: "Order",
    description: "Place buy/sell orders",
    icon: GlobeIcon, // Placeholder
  },
  {
    type: NodeType.NOTIFY,
    label: "Notify",
    description: "Send notifications",
    icon: GlobeIcon, // Placeholder
  },
];

interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function NodeSelector({ open, onOpenChange, children }: NodeSelectorProps) {
  const { setNodes, getNodes, screenToFlowPosition } = useReactFlow();
  const handleNodeSelect = useCallback((selection: NodeTypeOption) => {
    // Check if trying to add a manual trigger when one already exists
    if (selection.type === NodeType.MANUAL_TRIGGER) {
      const nodes = getNodes();
      const hasManualTrigger = nodes.some(
        (node) => node.type === NodeType.MANUAL_TRIGGER,
      );

      if (hasManualTrigger) {
        toast.error("Only one manual trigger is allowed per workflow");
        return;
      }
    }

    setNodes((nodes) => {
      // Always drop any INITIAL ("plus") nodes once the user adds a real node
      const cleanedNodes = nodes.filter(
        (node) => node.type !== NodeType.INITIAL,
      );

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const flowPosition = screenToFlowPosition({
        x: centerX + (Math.random() - 0.5) * 200,
        y: centerY + (Math.random() - 0.5) * 200,
      });

      const newNode = {
        id: createId(),
        type: selection.type,
        position: flowPosition,
        data: {},
      };

      return [...cleanedNodes, newNode];
    });
    onOpenChange(false);

  }, [
    getNodes,
    onOpenChange,
    screenToFlowPosition,
    setNodes,
  ]);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Select a node</SheetTitle>
          <SheetDescription>
            A trigger is a step that starts your workflow
          </SheetDescription>
        </SheetHeader>

        <div>
          {triggerNodes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <div
                key={nodeType.type}
                onClick={() => handleNodeSelect(nodeType)}
                className="w-full justify-start h-auto py-5 px-4 rounded-none cursor-pointer border-l-2 border-transparent hover:border-l-primary"
              >
                <div className="flex items-center gap-6 w-full overflow-hidden">
                  {typeof Icon === "string" ? (
                    <img
                      src={Icon}
                      alt={nodeType.label}
                      className="size-5 object-contain rounded-sm"
                    />
                  ) : (
                    <Icon className="size-5" />
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-medium truncate">{nodeType.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {nodeType.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          <Separator className="my-4" />

          {executionNodes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <div
                key={nodeType.type}
                onClick={() => handleNodeSelect(nodeType)}
                className="w-full justify-start h-auto py-5 px-4 rounded-none cursor-pointer border-l-2 border-transparent hover:border-l-primary"
              >
                <div className="flex items-center gap-6 w-full overflow-hidden">
                  {typeof Icon === "string" ? (
                    <img
                      src={Icon}
                      alt={nodeType.label}
                      className="size-5 object-contain rounded-sm"
                    />
                  ) : (
                    <Icon className="size-5" />
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-medium truncate">{nodeType.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {nodeType.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </SheetContent>
    </Sheet>
  );
}
