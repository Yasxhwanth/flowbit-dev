import { type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type NodeStatus = "loading" | "success" | "error" | "initial";
export type NodeStatusVariant = "overlay" | "border";

export type NodeStatusIndicatorProps = {
  status?: NodeStatus;
  variant?: NodeStatusVariant;
  children: ReactNode;
  className?: string;
};

/* ---------------- LOADING (POPPY BLUE) ---------------- */
export const SpinnerLoadingIndicator = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative">
      <StatusBorder className="border-blue-500 shadow-[0_0_10px_3px_rgba(0,115,255,0.6)]">
        {children}
      </StatusBorder>

      <div className="absolute inset-0 z-50 rounded-[9px] bg-background/40 backdrop-blur-xs" />
      <div className="absolute inset-0 z-50">
        <span className="absolute h-10 w-10 animate-ping rounded-full bg-blue-400/30 top-[calc(50%-20px)] left-[calc(50%-20px)]" />
        <LoaderCircle className="absolute size-6 animate-spin text-blue-600 top-[calc(50%-12px)] left-[calc(50%-12px)]" />
      </div>
    </div>
  );
};

/* ---------------- LOADING BORDER (Poppy Blue Spinner) ---------------- */
export const BorderLoadingIndicator = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div className="absolute -top-[2px] -left-[2px] h-[calc(100%+4px)] w-[calc(100%+4px)] pointer-events-none">
        <style>
          {`
          @keyframes spin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `}
        </style>

        <div className={cn("absolute inset-0 overflow-hidden rounded-sm", className)}>
          <div className="absolute left-1/2 top-1/2 w-[140%] aspect-square rounded-full bg-[conic-gradient(from_0deg,rgb(0,140,255),rgba(0,140,255,0))] animate-[spin_1.8s_linear_infinite]" />
        </div>
      </div>

      {children}
    </>
  );
};

/* ---------------- BASE BORDER ---------------- */
const StatusBorder = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <>
      <div
        className={cn(
          "absolute -top-[2px] -left-[2px] h-[calc(100%+4px)] w-[calc(100%+4px)] rounded-md border-3",
          className,
        )}
      />
      {children}
    </>
  );
};

/* ---------------- FINAL INDICATOR ---------------- */
export const NodeStatusIndicator = ({
  status,
  variant = "border",
  children,
  className,
}: NodeStatusIndicatorProps) => {
  switch (status) {
    /* LOADING */
    case "loading":
      if (variant === "overlay") {
        return <SpinnerLoadingIndicator>{children}</SpinnerLoadingIndicator>;
      }
      if (variant === "border") {
        return <BorderLoadingIndicator className={className}>{children}</BorderLoadingIndicator>;
      }
      return <>{children}</>;

    /* SUCCESS — POPPY GREEN */
    case "success":
      return (
        <StatusBorder
          className={cn(
            "border-green-500 shadow-[0_0_12px_4px_rgba(0,200,90,0.6)]",
            className
          )}
        >
          {children}
        </StatusBorder>
      );

    /* ERROR — POPPY HOT RED */
    case "error":
      return (
        <StatusBorder
          className={cn(
            "border-red-500 shadow-[0_0_12px_4px_rgba(255,60,60,0.6)]",
            className
          )}
        >
          {children}
        </StatusBorder>
      );

    /* NONE */
    default:
      return <>{children}</>;
  }
};

