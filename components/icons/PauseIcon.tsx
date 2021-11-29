export const PauseIcon = (
  props: Omit<React.ComponentProps<"svg">, "viewBox">
) => (
  <svg
    fill="currentColor"
    role="img"
    height="16"
    width="16"
    viewBox="0 0 16 16"
    {...props}
  >
    <path fill="none" d="M0 0h16v16H0z"></path>
    <path d="M3 2h3v12H3zm7 0h3v12h-3z"></path>
  </svg>
);
