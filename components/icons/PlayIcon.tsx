import React from "react";

export const PlayIcon = (
  props: Omit<React.ComponentProps<"svg">, "viewBox">
) => (
  <svg role="img" height="16" width="16" viewBox="0 0 16 16" {...props}>
    <path fill="currentColor" d="M4.018 14L14.41 8 4.018 2z"></path>
  </svg>
);
