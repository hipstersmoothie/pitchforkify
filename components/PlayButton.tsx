import makeClass from "clsx";

import { PlayIcon } from "../components/icons/PlayIcon";
import { PauseIcon } from "../components/icons/PauseIcon";
import { forwardRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { clamp } from "../utils/clamp";

interface PlayButtonProps
  extends Omit<React.ComponentPropsWithoutRef<"button">, "children"> {
  isPlaying: boolean;
  barAnimation?: boolean;
}

function useRandomScale() {
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setScale(clamp(1 * Math.random(), 0.2, 1));
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return scale;
}

function Bar() {
  const scale = useRandomScale();

  return (
    <motion.li
      className="bg-gray-100"
      style={{ height: 24, width: 4, borderRadius: 4 }}
      animate={{ scaleY: scale }}
    />
  );
}

function BarAnimation() {
  return (
    <motion.ol
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      initial="hidden"
      animate="show"
      className="group w-8 h-8 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
    >
      <div className="flex items-center justify-center gap-1 opacity-100 group-hover:opacity-0">
        <Bar />
        <Bar />
        <Bar />
        <Bar />
      </div>
      <PauseIcon className="opacity-0 group-hover:opacity-100 absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2" />
    </motion.ol>
  );
}

export const PlayButton = forwardRef(function PlayButton(
  { isPlaying, className, barAnimation, ...props }: PlayButtonProps,
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
      {isPlaying ? (
        barAnimation ? (
          <BarAnimation />
        ) : (
          <PauseIcon />
        )
      ) : (
        <PlayIcon />
      )}
    </button>
  );
});
