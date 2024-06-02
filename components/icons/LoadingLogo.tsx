export const LoadingLogoIcon = () => (
  <svg
    className="loader-animation stroke-gray-800 dark:stroke-gray-100"
    viewBox="0 0 200 200"
    width="100"
    height="100"
  >
    <g className="shape">
      <path d="M 1 100 A 99 99 0 0 1 199 100" className="circle"></path>
      <path d="M 1 100 A 99 99 0 0 0 199 100" className="circle"></path>
      <g>
        <path d="M 10 100 L 170 100" className="center-line"></path>
        <path d="M 170 100 L 152 82" className="arrow-head"></path>
        <path d="M 170 100 L 152 118" className="arrow-head"></path>
      </g>
      <g>
        <path d="M 24 56 L 138 56" className="short-line"></path>
        <path d="M 138 56 L 120 38" className="arrow-head"></path>
        <path d="M 138 56 L 120 74" className="arrow-head"></path>
      </g>
      <g>
        <path d="M 24 144 L 138 144" className="short-line"></path>
        <path d="M 138 144 L 120 126" className="arrow-head"></path>
        <path d="M 138 144 L 120 162" className="arrow-head"></path>
      </g>
    </g>
  </svg>
);
