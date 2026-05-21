import type { NextConfig } from "next";

// CSP is temporarily disabled — the previous policy was blocking Next.js
// RSC streaming + Vercel's injected scripts, which made every Client
// Component fail to hydrate (resulting in dead buttons across the app).
// We'll add a proper nonce-based CSP in a follow-up; the remaining
// security headers below cover the most impactful protections.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
