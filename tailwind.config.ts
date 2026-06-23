import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["Inter", "sans-serif"],
        display: ["Manrope", "sans-serif"],
      },
      fontSize: {
        display: ["var(--text-display)", { lineHeight: "1.05", fontWeight: "700", letterSpacing: "-0.03em" }],
        h1: ["var(--text-h1)", { lineHeight: "1.05", fontWeight: "700", letterSpacing: "-0.03em" }],
        h2: ["var(--text-h2)", { lineHeight: "1.1", fontWeight: "600", letterSpacing: "-0.02em" }],
        h3: ["var(--text-h3)", { lineHeight: "1.15", fontWeight: "600", letterSpacing: "-0.02em" }],
        h4: ["var(--text-h4)", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.01em" }],
        "body-lg": ["var(--text-body-lg)", { lineHeight: "1.6", fontWeight: "400" }],
        body: ["var(--text-body)", { lineHeight: "1.6", fontWeight: "400" }],
        caption: ["var(--text-caption)", { lineHeight: "1.5", fontWeight: "400" }],
        small: ["var(--text-small)", { lineHeight: "1.4", fontWeight: "400" }],
      },
      spacing: {
        "space-4": "var(--space-4)",
        "space-8": "var(--space-8)",
        "space-12": "var(--space-12)",
        "space-16": "var(--space-16)",
        "space-24": "var(--space-24)",
        "space-32": "var(--space-32)",
        "space-48": "var(--space-48)",
        "space-64": "var(--space-64)",
        "space-96": "var(--space-96)",
      },
      borderRadius: {
        input: "12px",
        card: "16px",
        modal: "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.06)",
        "card-hover": "0 4px 12px rgba(15,23,42,0.12), 0 16px 40px rgba(15,23,42,0.10)",
        modal: "0 20px 60px rgba(15,23,42,0.20)",
      },
      colors: {
        primary: "#2F6BFF",
        "primary-hover": "#1E293B",
        accent: "#2563EB",
        "accent-hover": "#1D4ED8",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        bg: "#F8FAFC",
        surface: "#FFFFFF",
        border: "#E2E8F0",
        "text-primary": "#0F172A",
        "text-secondary": "#64748B",
      },
      maxWidth: {
        layout: "1440px",
      },
    },
  },
} satisfies Config;
