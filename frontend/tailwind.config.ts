import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}", "../templates/**/*.html"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["'Montserrat'", "sans-serif"],
        sans: ["'Montserrat'", "sans-serif"],
      },
      colors: {
        "primary-red": "#8B1E1E",
        "secondary-red": "#B23A2A",
        "accent-red": "#D94C3A",
        "green-dark": "#1F4D3A",
        "green-medium": "#2E6B4A",
        "green-light": "#4C8C6B",
        "background-cream": "#F5E6C8",
        "background-warm": "#EAD7B0",
        "text-primary": "#2B1B12",
        "text-secondary": "#5A3A2A",
        "gold-accent": "#C89B3C",
        "orange-accent": "#E07A2F",
      },
      boxShadow: {
        "artisan-sm": "0 2px 4px rgba(43, 27, 18, 0.1)",
        "artisan-md": "0 4px 12px rgba(43, 27, 18, 0.15)",
        "artisan-lg": "0 12px 32px rgba(43, 27, 18, 0.2)",
      },
      borderRadius: {
        "artisan": "2px",
        "artisan-lg": "8px",
      },
      backgroundImage: {
        "pizza-grain":
          "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.35), transparent 42%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.26), transparent 36%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
