import makeClass from "clsx";
import { useCallback, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import * as Slider from "@radix-ui/react-slider";

interface ScrubberBarProps
  extends Omit<React.ComponentProps<"div">, "onChange"> {
  value: number;
  max: number;
  onChange: (newValue: number) => void;
}

export const ScrubberBar = ({
  max,
  value,
  className,
  onChange,
}: ScrubberBarProps) => {
  const [internalValue, internalValueSet] = useState(value);
  const debouncedOnChange = useDebouncedCallback(onChange, 200);

  const setValue = useCallback(
    (newValue: number) => {
      internalValueSet(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange]
  );

  return (
    <Slider.Root
      value={[internalValue]}
      max={max}
      onValueChange={([newValue]) => setValue(newValue)}
      className={makeClass(
        "cursor-pointer rounded group flex items-center select-none",
        className
      )}
    >
      <Slider.Track className="bg-gray-400 h-1 w-full">
        <Slider.Range className="bg-gray-700 h-1 absolute" />
      </Slider.Track>
      <Slider.Thumb className="block opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 bg-white rounded-full border border-gray-300 shadow-lg" />
    </Slider.Root>
  );
};
