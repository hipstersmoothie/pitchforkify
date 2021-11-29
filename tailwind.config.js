const plugin = require("tailwindcss/plugin");

module.exports = {
  mode: "jit",
  purge: [
    "./public/**/*.html",
    "./pages/**/*.{js,jsx,ts,tsx,vue}",
    "./components/**/*.{js,jsx,ts,tsx,vue}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        pitchfork: "#ff3530",
      },
      boxShadow: {
        focus: '0 0 0 4px #fff, 0 0 0 8px #ff3530',
        ['focus-inner']: 'inset 0 0 0 4px #ff3530',
        ['focus-tight']: '0 0 0 4px #ff3530'
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    plugin(({ addVariant, e }) => {
      addVariant("keyboard-focus", ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `[data-keyboard-nav] .${e(
            `keyboard-focus${separator}${className}`
          )}:focus`;
        });
      });
    }),
  ],
};
