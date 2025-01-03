import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // Enable dark mode with the class strategy
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",    // Include all files in pages directory
    "./components/**/*.{js,ts,jsx,tsx}", // Include all files in components directory
    "./app/**/*.{js,ts,jsx,tsx}",     // Include all files in app directory (if using App Router)
    "./src/**/*.{js,ts,jsx,tsx}",     // Include all files in src directory (if applicable)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

// export default {
//   content: [
//     "./pages/**/*.{js,ts,jsx,tsx,mdx}",
//     "./components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./app/**/*.{js,ts,jsx,tsx,mdx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         background: "var(--background)",
//         foreground: "var(--foreground)",
//       },
//     },
//   },
//   plugins: [],
// } satisfies Config;

export default config;