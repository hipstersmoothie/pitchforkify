import makeClass from "clsx";

import { PlayIcon } from "../components/icons/PlayIcon";
import { PauseIcon } from "../components/icons/PauseIcon";
import { forwardRef } from "react";

interface PlayButtonProps
  extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  isPlaying: boolean;
}

export const PlayButton = forwardRef(function PlayButton(
  { isPlaying, className, ...props }: PlayButtonProps,
  ref: React.Ref<HTMLButtonElement>
) {
  return (
    <button
      ref={ref}
      aria-label={isPlaying ? "pause" : "play"}
      className={makeClass(
        className,
        "bg-gray-800 text-white p-3 rounded-full cursor-pointer hover:scale-[1.1] focus:outline-none keyboard-focus:shadow-focus-tight"
      )}
      {...props}
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
});
