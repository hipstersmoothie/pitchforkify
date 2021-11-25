import React from "react";

export const CloseIcon = (
  props: Omit<React.ComponentProps<"svg">, "viewBox">
) => (
  <svg
    fill="currentColor"
    width="20px"
    height="20px"
    viewBox="0 0 21.3 19.5"
    {...props}
  >
    <g>
      <path d="M17.8,3.7L4.6,16.9c-0.3,0.3-0.8,0.3-1.1,0c-0.3-0.3-0.3-0.8,0-1.1L16.7,2.6c0.3-0.3,0.8-0.3,1.1,0C18.1,2.9,18.1,3.4,17.8,3.7z"></path>
      <path d="M16.7,16.9L3.5,3.7c-0.3-0.3-0.3-0.8,0-1.1s0.8-0.3,1.1,0l13.2,13.2c0.3,0.3,0.3,0.8,0,1.1C17.5,17.2,17,17.2,16.7,16.9z"></path>
    </g>
  </svg>
);
