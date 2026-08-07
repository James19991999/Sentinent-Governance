import type { Config } from "tailwindcss";

function withOpacity(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: withOpacity("--surface"),
          dim: withOpacity("--surface-dim"),
          bright: withOpacity("--surface-bright"),
          "container-lowest": withOpacity("--surface-container-lowest"),
          "container-low": withOpacity("--surface-container-low"),
          container: withOpacity("--surface-container"),
          "container-high": withOpacity("--surface-container-high"),
          "container-highest": withOpacity("--surface-container-highest"),
          variant: withOpacity("--surface-variant"),
        },
        "on-surface": { DEFAULT: withOpacity("--on-surface"), variant: withOpacity("--on-surface-variant") },
        "inverse-surface": withOpacity("--inverse-surface"),
        "inverse-on-surface": withOpacity("--inverse-on-surface"),
        outline: { DEFAULT: withOpacity("--outline"), variant: withOpacity("--outline-variant") },
        primary: {
          DEFAULT: withOpacity("--primary"),
          container: withOpacity("--primary-container"),
          fixed: withOpacity("--primary-fixed"),
          "fixed-dim": withOpacity("--primary-fixed-dim"),
        },
        "on-primary": { DEFAULT: withOpacity("--on-primary"), container: withOpacity("--on-primary-container") },
        secondary: {
          DEFAULT: withOpacity("--secondary"),
          container: withOpacity("--secondary-container"),
          fixed: withOpacity("--secondary-fixed"),
          "fixed-dim": withOpacity("--secondary-fixed-dim"),
        },
        "on-secondary": { DEFAULT: withOpacity("--on-secondary"), container: withOpacity("--on-secondary-container") },
        tertiary: {
          DEFAULT: withOpacity("--tertiary"),
          container: withOpacity("--tertiary-container"),
          fixed: withOpacity("--tertiary-fixed"),
          "fixed-dim": withOpacity("--tertiary-fixed-dim"),
        },
        "on-tertiary": { DEFAULT: withOpacity("--on-tertiary"), container: withOpacity("--on-tertiary-container") },
        error: { DEFAULT: withOpacity("--error"), container: withOpacity("--error-container") },
        "on-error": { DEFAULT: withOpacity("--on-error"), container: withOpacity("--on-error-container") },
        background: withOpacity("--background"),
        "on-background": withOpacity("--on-background"),
      },
      fontFamily: {
        display: ["var(--font-hanken)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg-mobile": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" }],
        "mono-data": ["14px", { lineHeight: "20px", fontWeight: "400" }],
      },
      borderRadius: {
        sm: "0.125rem",
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        gutter: "24px",
        "margin-desktop": "64px",
        "margin-mobile": "16px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "32px",
      },
      maxWidth: {
        container: "1440px",
      },
      boxShadow: {
        level2: "0 8px 24px 0 rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
