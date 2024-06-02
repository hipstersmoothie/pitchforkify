import makeClass from "clsx";

import { BestNewBadge } from "./icons/BestNewBadge";

interface ScoreProps extends React.ComponentProps<"div"> {
  score: number;
  isBestNew: boolean;
  isBig?: boolean | "responsive";
}

export const Score = ({
  score,
  isBestNew,
  className,
  isBig,
  ...props
}: ScoreProps) => {
  return (
    <div className="flex items-center flex-col gap-4 md:gap-6">
      {/* {isBestNew && isBig && <BestNewBadge />} */}
      <div
        className={makeClass(
          className,
          !className?.includes("border-") && !isBestNew && "border-gray-0",
          "font-extrabold border-4 rounded-full p-2 mb-3 w-12 h-12",
          isBig === true &&
            "text-5xl border-[6px] w-28 h-28 flex items-center justify-center",
          isBig === "responsive" &&
            "md:text-5xl md:border-[6px] md:w-28 md:h-28 md:flex md:items-center md:justify-center",
          isBestNew && "text-[#ff3530] border-[#ff3530]"
        )}
        {...props}
      >
        {score < 10 ? score.toFixed(1) : score}
      </div>
    </div>
  );
};
