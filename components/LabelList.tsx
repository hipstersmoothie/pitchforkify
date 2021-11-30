import makeClass from "clsx";

import { Review } from "../pages/api/reviews";

interface LabelListProps extends React.ComponentProps<"ul"> {
  review: Review;
}

export const LabelList = ({ review, className, ...props }: LabelListProps) => {
  return (
    <ul {...props} className={makeClass(className, "flex")}>
      {review.labels.map((label) => (
        <li
          className="after:content-['/'] last:after:content-[''] after:px-1 last:after:px-0"
          key={`${label.id}-${review.id}`}
        >
          {label.name}
        </li>
      ))}
    </ul>
  );
};
