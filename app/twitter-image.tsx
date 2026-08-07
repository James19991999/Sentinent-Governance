import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sentient Governance — Responsible AI Oversight & Integrity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "linear-gradient(135deg, #0f172a 0%, #131b2e 100%)",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: "#0d9488",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              color: "white",
            }}
          >
            ⛨
          </div>
          <div style={{ fontSize: 40, color: "#dae2fd", fontWeight: 700 }}>Sentient Governance</div>
        </div>
        <div style={{ fontSize: 56, color: "white", fontWeight: 700, maxWidth: 900, lineHeight: 1.15, display: "flex" }}>
          Responsible AI Oversight &amp; Integrity
        </div>
        <div style={{ fontSize: 28, color: "#bec6e0", marginTop: 24, maxWidth: 850, display: "flex" }}>
          Real bias audits, ethics-certified workflows, and workforce upskilling — in one platform.
        </div>
      </div>
    ),
    { ...size }
  );
}
