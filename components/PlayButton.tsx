import makeClass from "clsx";

import { PlayIcon } from "../components/icons/PlayIcon";
import { PauseIcon } from "../components/icons/PauseIcon";

interface PlayButtonProps
  extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  isPlaying: boolean;
}

export const PlayButton = ({
  isPlaying,
  className,
  ...props
}: PlayButtonProps) => {
  return (
    <button
      aria-label={isPlaying ? "pause" : "play"}
      className={makeClass(
        className,
        "bg-gray-800 text-white p-3 rounded-full cursor-pointer hover:scale-[1.1]"
      )}
      {...props}
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
};
