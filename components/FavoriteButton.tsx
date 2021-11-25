import { HeartIcon } from "./icons/HeartIcon";
import { UnfilledHeartIcon } from "./icons/UnfilledHeartIcon";
import { Tooltip } from "./Tooltip";

interface FavoriteButtonProps extends React.ComponentProps<"button"> {
  isSaved: boolean;
  className?: string;
  size?: number;
  fill?: string;
}

export const FavoriteButton = ({
  isSaved,
  style,
  size,
  fill,
  ...props
}: FavoriteButtonProps) => {
  return (
    <Tooltip
      message={isSaved ? "Remove from Your Library" : "Save to Your Library"}
    >
      <button
        style={{ ...style, fill: isSaved ? "var(--pitchfork-orange)" : fill }}
        {...props}
      >
        {isSaved ? (
          <HeartIcon size={size} />
        ) : (
          <UnfilledHeartIcon size={size} />
        )}
      </button>
    </Tooltip>
  );
};
