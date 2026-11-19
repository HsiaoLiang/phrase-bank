/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground))",
        },
        "primary-hover": "hsl(var(--primary-hover) / <alpha-value>)",
        xp: { DEFAULT: "hsl(var(--xp) / <alpha-value>)", soft: "hsl(var(--xp-soft) / <alpha-value>)" },
        streak: { DEFAULT: "hsl(var(--streak) / <alpha-value>)", soft: "hsl(var(--streak-soft) / <alpha-value>)" },
        good: { DEFAULT: "hsl(var(--good) / <alpha-value>)", soft: "hsl(var(--good-soft) / <alpha-value>)" },
        bad: { DEFAULT: "hsl(var(--bad) / <alpha-value>)", soft: "hsl(var(--bad-soft) / <alpha-value>)" },
        casual: { DEFAULT: "hsl(var(--casual) / <alpha-value>)", soft: "hsl(var(--casual-soft) / <alpha-value>)" },
        neu: { DEFAULT: "hsl(var(--neu) / <alpha-value>)", soft: "hsl(var(--neu-soft) / <alpha-value>)" },
        formal: { DEFAULT: "hsl(var(--formal) / <alpha-value>)", soft: "hsl(var(--formal-soft) / <alpha-value>)" },
      },
      boxShadow: {
        card: "0 2px 6px rgb(40 46 62 / 0.06)",
        lift: "0 8px 26px rgb(40 46 62 / 0.13)",
        btn: "0 3px 0 0 rgb(0 0 0 / 0.14)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "60%": { transform: "scale(1.08)", opacity: "1" }, "100%": { transform: "scale(1)" } },
        shake: { "0%,100%": { transform: "translateX(0)" }, "20%,60%": { transform: "translateX(-7px)" }, "40%,80%": { transform: "translateX(7px)" } },
        floatup: { "0%": { opacity: "0", transform: "translate(-50%, 0) scale(.8)" }, "15%": { opacity: "1", transform: "translate(-50%, -12px) scale(1.05)" }, "100%": { opacity: "0", transform: "translate(-50%, -70px) scale(1)" } },
        wiggle: { "0%,100%": { transform: "rotate(0)" }, "25%": { transform: "rotate(-10deg) scale(1.1)" }, "75%": { transform: "rotate(10deg) scale(1.1)" } },
        glow: { "0%,100%": { boxShadow: "0 0 0 0 hsl(var(--xp) / .0)" }, "50%": { boxShadow: "0 0 0 6px hsl(var(--xp) / .25)" } },
        flicker: { "0%,100%": { transform: "scale(1) rotate(-2deg)" }, "50%": { transform: "scale(1.12) rotate(3deg)" } },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        rise: "rise .3s ease-out both",
        pop: "pop .45s cubic-bezier(.2,1.4,.4,1) both",
        shake: "shake .4s ease-in-out",
        floatup: "floatup 1.1s ease-out forwards",
        wiggle: "wiggle .5s ease-in-out",
        glow: "glow .8s ease-out",
        flicker: "flicker 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
