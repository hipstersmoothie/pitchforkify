import makeClass from "clsx";
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
  return (
    <Slider.Root
      value={[value]}
      max={max}
      onValueChange={([newValue]) => onChange(newValue)}
      className={makeClass(
        "cursor-pointer rounded group flex items-center select-none",
        className
      )}
    >
      <Slider.Track className="bg-gray-400 h-1 w-full">
        <Slider.Range className="bg-gray-700 h-1 absolute" />
      </Slider.Track>
      <Slider.Thumb className="block opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity h-4 w-4 bg-white rounded-full border border-gray-300 shadow-lg  focus:outline-none keyboard-focus:shadow-focus" />
    </Slider.Root>
  );
};
