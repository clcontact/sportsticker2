// tailwind.config.js (in root directory)
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // This tells Tailwind to look in the 'frontend' directory, 
    // inside the 'src' subdirectory, and scan all JS/JSX/TS/TSX files.
    //"./frontend/src/**/*.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}", 
    // And for the index.html:
    "./index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}