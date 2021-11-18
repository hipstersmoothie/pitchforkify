module.exports = {
  mode: "jit",
  purge: [
    "./public/**/*.html",
    "./pages/**/*.{js,jsx,ts,tsx,vue}",
    "./components/**/*.{js,jsx,ts,tsx,vue}",
  ],
  darkMode: "media",
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
