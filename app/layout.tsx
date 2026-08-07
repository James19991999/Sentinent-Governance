import type { Metadata } from "next";
import "./globals.css";

// FONT LOADING NOTE (see README "Font Loading" section):
// The Stitch design spec calls for Hanken Grotesk, Inter, and Geist. We do NOT
// use next/font/google here, because it fetches from fonts.gstatic.com at build
// time — a hard dependency this environment (and some CI/self-hosted setups)
// cannot guarantee. Instead we define the font stack as CSS variables that
// fall back cleanly to system-ui if the named fonts aren't installed/self-hosted.
// To match the spec exactly in production, drop woff2 files into /public/fonts
// and switch these variables to next/font/local — see README for the exact swap.
const fontVars = {
  ["--font-hanken" as string]: "'Hanken Grotesk', system-ui, sans-serif",
  ["--font-inter" as string]: "'Inter', system-ui, sans-serif",
  ["--font-geist" as string]: "'Geist', ui-monospace, monospace",
};

export const metadata: Metadata = {
  title: {
    default: "Sentient Governance | Responsible AI Oversight & Integrity",
    template: "%s | Sentient Governance",
  },
  description:
    "Enterprise AI governance, bias auditing, workflow oversight, and responsible-AI upskilling in one platform.",
  metadataBase: new URL("https://sentient-governance.example.com"),
  openGraph: {
    title: "Sentient Governance",
    description:
      "Enterprise AI governance, bias auditing, workflow oversight, and responsible-AI upskilling in one platform.",
    url: "https://sentient-governance.example.com",
    siteName: "Sentient Governance",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentient Governance",
    description:
      "Enterprise AI governance, bias auditing, workflow oversight, and responsible-AI upskilling in one platform.",
  },
  robots: { index: true, follow: true },
};

// Runs before hydration, inline, so the correct theme class is on <html>
// for the very first paint — no flash of light theme before JS loads.
// Reads localStorage first (explicit user choice), falling back to the
// OS-level prefers-color-scheme. Wrapped in try/catch: if localStorage is
// blocked (e.g. some privacy-hardened browsers), this fails silently and
// the page just renders in light mode rather than throwing.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("sg-theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={fontVars as React.CSSProperties}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
