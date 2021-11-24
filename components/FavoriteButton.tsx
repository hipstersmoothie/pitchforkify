import { HeartIcon } from "./icons/HeartIcon";
import { UnfilledHeartIcon } from "./icons/UnfilledHeartIcon";
import { Tooltip } from "./Tooltip";

interface FavoriteButtonProps {
  isSaved: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  size?: number;
  fill?: string;
}

export const FavoriteButton = ({
  isSaved,
  onClick,
  className,
  size,
  fill,
}: FavoriteButtonProps) => {
  return (
    <Tooltip
      message={isSaved ? "Remove from Your Library" : "Save to Your Library"}
    >
      <button
        className={className}
        onClick={onClick}
        style={{ fill: isSaved ? "var(--pitchfork-orange)" : fill }}
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
