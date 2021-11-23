import * as TooltipPrimitive from "@radix-ui/react-tooltip";

interface TooltipProps {
  children: React.ReactNode;
  message: React.ReactNode;
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
}: TooltipProps) => (
  <TooltipPrimitive.Root delayDuration={3 * 1000}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
    <TooltipPrimitive.Content
      side={side}
      sideOffset={sideOffset}
      className="border border-gray-200 px-4 py-2 shadow-md bg-white rounded"
    >
      {message}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Root>
);
