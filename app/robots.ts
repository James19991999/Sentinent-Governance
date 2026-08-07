import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/bias-audit", "/workflows", "/upskilling", "/guidelines", "/settings", "/billing", "/onboarding", "/api/"],
      },
    ],
    sitemap: "https://sentient-governance.example.com/sitemap.xml",
  };
}
