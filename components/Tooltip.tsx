import * as TooltipPrimitive from "@radix-ui/react-tooltip";

interface TooltipProps {
  children: React.ReactNode;
  message: React.ReactNode;
  delayDuration?: number;
  side?: React.ComponentProps<typeof TooltipPrimitive.Content>["side"];
  sideOffset?: React.ComponentProps<
    typeof TooltipPrimitive.Content
  >["sideOffset"];
}

export const Tooltip = ({
  children,
  message,
  side = "top",
  sideOffset = 8,
  delayDuration,
}: TooltipProps) => (
  <TooltipPrimitive.Root delayDuration={delayDuration}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
    <TooltipPrimitive.Content
      side={side}
      sideOffset={sideOffset}
      className="px-2 py-1 shadow-md bg-gray-900 dark:bg-gray-100 rounded text-xs text-gray-100 dark:text-gray-900"
    >
      {message}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Root>
);
